import * as ts from "typescript/lib/tsserverlibrary";
import Err = ts.server.Msg.Err;
const logger = require('./Logger');
const config = require('../Config');

const FTPController = require('./FtpController');
const FtpFile = require('../objects/FtpFile');

type ScanCompleteCallbackFunction = (err: Error, files: FtpFile[]) => void;

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

        function ftpScanError(err) {
            logger.error("Error trying to scan FTP", err);
            self.scanComplete(err, null);
        }

        let ftp = FTPController.newJSFtp();

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

            self.updateFileSizes(ftp, downloadQueue);

            //TODO: Sort each group's contents by date
            downloadQueue.sort(FtpFile.sortNewestFirst);

            //logger.info(downloadQueue);

            //TODO: Sort the groups by date

            // Got our list of files, send it back
            self.scanComplete(null, downloadQueue);
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
                logger.info(relativePath + file.name);
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

    /**
     * The recursive directory search only gives us symlinks. We need to see how big the actual files are one by one.
     *
     * This is fine to not block because it's only updating the file sizes to show on the UI and not any logic
     *
     * @param ftp
     * @param list
     */
    private updateFileSizes(ftp, list) {
        for (let file of list) {
            /** @type {FtpFile} */

            if (file.isSymLink) {
                ftp.ls(file.fullPath, function (err, data) {
                    if (err || data.length != 1) {
                        logger.log("Error getting data for", file.fullPath);
                        return;
                    }

                    logger.info("Got target data", data[0]);
                    file.setTargetData(data[0]);
                });
            }
        }
    }

    private scanComplete(err: Error, files : FtpFile[]) {
        this.scanning = false;

        logger.info("FTP Scan completed");

        this.scanCompleteCallbackFunc(err, files);

        this.resetPollingTimeout();
    }

    private resetPollingTimeout() {
        this.pollingTimeoutId = setTimeout(this.scanRequest.bind(this), config.seedboxFtp.pollingIntervalInSeconds * 1000)
    }
}

module.exports = FtpScanner;