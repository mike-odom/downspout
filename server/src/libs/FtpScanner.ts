import moment = require("moment");
import _ = require("lodash");
import { Client as BasicFtpClient, FileInfo as BasicFtpFileInfo, FileType as BasicFtpFileType } from "basic-ftp";
import {FtpFile} from "../objects/FtpFile";

import logger from "./Logger";
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

    private ftp: BasicFtpClient;

    public constructor(delegate: FtpScannerDelegate) {
        this.delegate = delegate;

        this.startedAt = moment();
    }

    /**
     * Looks at the files in the remote server and starts the download process
     *
     */
    public async startScan() {
        try {
            await this.startScanInternal();
        } catch(err) {
            switch (err.code) {
                //"Invalid FTP username/password"
                case 530:
                    logger.error(err.toString());
                    break;
                case 'ENOTFOUND':
                    logger.error("DNS/Network issue: " + err.toString());
                    break;
                case 'ECONNREFUSED':
                    logger.error("Connection refused: " + err.toString());
                    break;
                default:
                    //Only output the full error for unrecognized errors.
                    logger.error("Error trying to scan FTP: ", err);
            }
            this.scanComplete(err);
        }
    }

    private async startScanInternal() {
        if (this.scanning) {
            throw new Error("startScan called while scanning");
        }

        this.scanning = true;

        this.timeout = setTimeout(this.timeoutCancelCallback.bind(this), 5 * 60 * 1000);

        let syncFolder = config.seedboxFtp.syncRoot;

        this.ftp = await FtpController.newJSFtp();

        logger.info('FtpScanner: lsr start');

        let downloadQueue = await this.lsr(syncFolder);
        logger.info('FtpScanner: lsr success');

        downloadQueue = this.filterDownloadQueue(downloadQueue);

        logger.info('FtpScanner: filterDownloadQueue success');

        // Sort each group's contents by date
        downloadQueue.sort(FtpFile.sortNewestFirst);

        //TODO: Sort the groups by date

        // Scan FTP and pull their file sizes. Then calls this.delegate.scannerFileFound
        await this.updateFileSizesAndAlertFound(downloadQueue);
        logger.info('FtpScanner: updateFileSizes success');

        // Got here! We're good to go.
        this.scanComplete(null, downloadQueue);
    }

    /**
     * Recursive function to traverse an FTP file tree.
     *
     * @param data an array of files
     * @param basePath the path where these files are located
     * @param relativePath
     * @param depth how deep to go down in the children
     * 
     * @returns FtpFile[] flat array of all files
     */
    private async lsr(basePath, relativePath = "", depth = 20) {
        const results: FtpFile[] = [];

        let ftp = this.ftp;

        // TODO: Do I need to check this response?
        await ftp.cd(FtpFile.appendSlash(basePath) + relativePath);
        const fileInfoArray: BasicFtpFileInfo[] = await ftp.list();

        for (let file of fileInfoArray) {
            const fileRelativePath = FtpFile.appendSlash(relativePath) + file.name;
            if (file.isSymbolicLink) {
                logger.info("FtpScanner found sym link: " + fileRelativePath);
                let fileObj = new FtpFile(basePath, relativePath, file);
                results.push(fileObj);
            } else if (file.isFile) {
                logger.warn("FtpScanner found file:" + fileRelativePath);
                results.push(new FtpFile(basePath, relativePath, file));
            } else if (file.isDirectory) {
                console.log("checking dir", fileRelativePath, file);
                const dirResults = await this.lsr(basePath, fileRelativePath, depth - 1);

                results.push(...dirResults);
            }
        }

        return results;
    }

    private filterDownloadQueue(downloadQueue: FtpFile[]): FtpFile[] {
        return _.filter(downloadQueue, (file: FtpFile) => {
            return this.delegate.scannerShouldProcessFile(file);
        });
    }

    /**
     * The recursive directory search only gives us symlinks
     * We need to see how big the actual files are
     */
    private async updateFileSizesAndAlertFound(list: FtpFile[]) {
        for (let file of list) {
            if (this.cancelled) return;

            if (!file.isSymLink) {
                this.delegate.scannerFileFound(file);
                logger.debug("updateFileSizes file was not symlink: " + file.fullPath);
                continue;
            }
            
            try {
                let listResults = await this.ftp.list(file.fullPath);

                logger.info("Got target data");
                logger.info(listResults[0]);
                file.targetData = listResults[0];

                this.delegate.scannerFileFound(file);
            } catch(err) {
                logger.error('Error reading file size: ' + file.fullPath);
                logger.error(err);
            }
        }
    }

    private scanComplete(err: Error, files : FtpFile[] = null) {
        logger.info("FTP Scan completed");

        this.delegate.scannerComplete(err, files);

        this.finish();
    }

    private finish() {
        this.scanning = false;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        //Swap callbacks to no-ops
        this.delegate = new class implements FtpScannerDelegate {
            scannerComplete(err: Error, files: FtpFile[]): void { }
            scannerFileFound(file: FtpFile) { }
            scannerShouldProcessFile(file: FtpFile): boolean { return false; }
        };

        // TODO: Put this back in the FTP object pool
        this.ftp && !this.ftp.closed && this.ftp.close();
    }

    private timeoutCancelCallback() {
        if (!this.scanning || this.cancelled) {
            return;
        }

        logger.warn("FtpScanner scan timed out");

        this.cancelled = true;

        this.scanComplete(new Error("Scanner timed out"), []);
    }
}

export {FtpScanner, FtpScannerDelegate};