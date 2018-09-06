import moment = require("moment");
import _ = require("lodash");
import async = require("async");

import {FtpFile} from "../objects/FtpFile";

const logger = require('./Logger');
const config = require('../Config');

import {FtpController} from './FtpController';

interface FtpScannerDelegate {
    scannerComplete(err: Error, files: FtpFile[]): void;
    scannerFileFound(file: FtpFile): void;
    scannerShouldProcessFile(file: FtpFile) : boolean;
}

class FtpScanner {
    private scanning = false;
    private cancelled = false;
    private timeout;

    private delegate: FtpScannerDelegate;

    public readonly startedAt;

    get isScanning(): boolean {
        return this.scanning;
    }

    private ftp;

    public constructor(delegate: FtpScannerDelegate) {
        this.delegate = delegate;

        this.startedAt = moment();
    }

    /**
     * Looks at the files in the remote server and starts the download process
     *
     */
    public startScan() {
        if (this.scanning) {
            throw "startScan called while scanning";
        }

        this.scanning = true;

        this.timeout = setTimeout(this.timeoutCancelCallback.bind(this), 5 * 60 * 1000);

        let syncFolder = config.seedboxFtp.syncRoot;

        this.ftp = FtpController.newJSFtp();

        const ftpScanError = (err) => {
            switch (err.code) {
                //"Invalid FTP username/password"
                case 530:
                    logger.error(err.toString());
                    break;
                default:
                    //Only output the full error for unrecognized errors.
                    logger.error("Error trying to scan FTP", err);
            }
            this.scanComplete(err, null);
        };

        //jsftp does not send these errors to the callback so we must handle them.
        this.ftp.on('error', ftpScanError);
        this.ftp.on('timeout', ftpScanError);

        this.ftp.lsr(syncFolder, (err, data) => {
            if (err) {
                ftpScanError(err);
                return;
            }
            //logger.info('Remote structure', JSON.stringify(data, null, 2));

            //TODO: Flatten out this list and group directories with __seedbox_sync_directory__ files in them
            let downloadQueue = this.processFilesJSON(data, syncFolder, 20);

            downloadQueue = this.filterDownloadQueue(downloadQueue);

            //TODO: Sort each group's contents by date
            downloadQueue.sort(FtpFile.sortNewestFirst);

            //TODO: Sort the groups by date

            // TODO: Scan FTP and pull their file sizes. We might have smaller data due to symlinks
            this.updateFileSizes(downloadQueue, (err, updatedQueue) => {
                // Got our list of files, send it back
                this.scanComplete(err, updatedQueue);
            });
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

    private filterDownloadQueue(downloadQueue: FtpFile[]): FtpFile[] {
        return _.filter(downloadQueue, (file: FtpFile) => {
            return this.delegate.scannerShouldProcessFile(file);
        });
    }

    /**
     * The recursive directory search only gives us symlinks. We need to see how big the actual files are one by one.
     */
    private updateFileSizes(list: FtpFile[], completedCallback) {
        async.mapLimit(list, 1,
            (file, iterDone) => {
                if (this.cancelled) {
                    iterDone("Scan cancelled");
                    return;
                }
                if (!file.isSymLink) {
                    this.delegate.scannerFileFound(file);

                    iterDone(null, file);
                    return;
                }

                this.ftp.ls(file.fullPath, (err, data) => {
                    if (this.cancelled) {
                        iterDone("Scan cancelled");
                        return;
                    }

                    if (err || data.length != 1) {
                        iterDone("Error getting data for " + file.fullPath);
                        return;
                    }

                    logger.info("Got target data", data[0]);
                    file.targetData = data[0];

                    this.delegate.scannerFileFound(file);

                    iterDone(null, file);
                });
            }, (err, results) => {
                logger.debug('updateFileSizes async.forEach done');
                completedCallback(err, results);
            });
    }

    private scanComplete(err: Error, files : FtpFile[]) {
        logger.info("FTP Scan completed");

        this.finish();

        this.delegate.scannerComplete(err, files);
    }

    private finish() {
        this.scanning = false;

        //Swap callbacks to no-ops
        this.delegate = new class implements FtpScannerDelegate {
            scannerComplete(err: Error, files: FtpFile[]): void { }
            scannerFileFound(file: FtpFile) { }
            scannerShouldProcessFile(file: FtpFile): boolean { return false; }
        };

        this.ftp.destroy();
    }

    private timeoutCancelCallback() {
        if (!this.scanning || this.cancelled) {
            return;
        }

        logger.warn("FtpScanner scan timed out");

        this.cancel();
    }

    public cancel() {
        this.cancelled = true;

        this.finish();
    }
}

export {FtpScanner, FtpScannerDelegate};