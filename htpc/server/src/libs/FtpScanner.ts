import * as ts from "typescript/lib/tsserverlibrary";
import Err = ts.server.Msg.Err;
import {FtpFile} from "../objects/FtpFile";

const logger = require('./Logger');
const config = require('../Config');

const FTPController = require('./FtpController');

type ScanCompleteCallbackFunction = (err: Error, files: FtpFile[], ftp) => void;

class FtpScanner {
    private scanning = false;
    private syncRequestedWhileScanning = false;

    private pollingTimeoutId = 0;

    private scanCompleteCallbackFunc: ScanCompleteCallbackFunction;

    public constructor(scanCompleteCallback: ScanCompleteCallbackFunction) {
        this.scanCompleteCallbackFunc = scanCompleteCallback;
    }
    
    public scanRequest() {
        if (this.scanning) {
            // A sync was requested during our download,
            // this will attempt to run again with fresh FTP directory info.
            console.log("Scan requested while scanning");
            this.syncRequestedWhileScanning = true;
            return;
        }

        this.syncRequestedWhileScanning = false;
        this.startScan();
    }

    /**
     * Looks at the files in the remote server and starts the download process
     *
     */
    private startScan() {
        let self = this;

        self.scanning = true;

        self.resetPollingTimeout();

        let syncFolder = config.seedboxFtp.syncRoot;

        let ftp = FTPController.newJSFtp();

        function ftpScanError(err) {
            switch (err.code) {
                //"Invalid FTP username/password"
                case 530:
                    logger.error(err.toString());
                    break;
                default:
                    //Only output the full error for unrecognized errors.
                    logger.error("Error trying to scan FTP", err);
            }
            self.scanComplete(err, null, ftp);
        }

        //jsftp does not send these errors to the callback so we must handle them.
        ftp.on('error', ftpScanError);
        ftp.on('timeout', ftpScanError);

        ftp.lsr(syncFolder, function (err, data) {
            if (err) {
                ftpScanError(err);
                return;
            }
            //logger.info('Remote structure', JSON.stringify(data, null, 2));

            //TODO: Flatten out this list and group directories with __seedbox_sync_directory__ files in them
            let downloadQueue = self.processFilesJSON(data, syncFolder, 20);

            //TODO: Sort each group's contents by date
            downloadQueue.sort(FtpFile.sortNewestFirst);

            //TODO: Sort the groups by date

            // Got our list of files, send it back
            self.scanComplete(null, downloadQueue, ftp);
        });
    }

    /**
     * Recursive function to traverse a file tree.
     *
     * JavaScript has a maximum depth of 1000. But we should do something lower.
     *
     * @param data an array of files
     * @param basePath the path where these files are located
     * @param depth how deep to go down in the children
     * @param relativePath
     * @param outList
     */
    private processFilesJSON(data, basePath, depth = 20, relativePath = "", outList = []) {
        relativePath = FtpFile.appendSlash(relativePath);

        if (depth == 0) {
            logger.info("Maximum file depth reached, exiting", relativePath);
            return;
        }
        for (let file of data) {
            //Only transfer symlinks, or if running the test server, all files
            if (file.type == FtpFile.FTP_TYPE_SYM_LINK || (/*config.testFtpServer && */ file.type == FtpFile.FTP_TYPE_FILE)) {
                logger.info("FtpScanner found: " + relativePath + file.name);
                let fileObj = new FtpFile(basePath, relativePath, file);
                outList.push(fileObj);
            } else if (file.type == FtpFile.FTP_TYPE_DIRECTORY) {
                if (typeof file.children == 'object') {
                    const newPath = relativePath + file.name;
                    this.processFilesJSON(file.children, basePath, depth - 1, newPath, outList);
                }
            }
        }

        return outList;
    }

    private scanComplete(err: Error, files : FtpFile[], ftp) {
        this.scanning = false;

        logger.info("FTP Scan completed");

        this.scanCompleteCallbackFunc(err, files, ftp);

        this.resetPollingTimeout();
    }

    private resetPollingTimeout() {
        logger.debug("resetPollingTimeout - clearTimeout");
        clearTimeout(this.pollingTimeoutId);

        logger.debug("resetPollingTimeout - setTimeout");
        this.pollingTimeoutId = setTimeout(this.scanRequest.bind(this), config.seedboxFtp.pollingIntervalInSeconds * 1000)
    }
}

module.exports = FtpScanner;