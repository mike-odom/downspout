import makeDir = require('make-dir');
import fs = require('fs');
import once = require('once');
import { Client as BasicFtpClient } from 'basic-ftp';
import {FtpFile} from "../objects/FtpFile";
import {TransferSpeedAverage} from "../objects/TransfersSpeedAverage";

const logger: Winston = require('./Logger');
import {FtpController} from './FtpController';

import {Utils} from './Utils'
import { Winston } from 'winston';

class FtpDownloader {
    private _file: FtpFile;
    private _destinationDirectory: string;

    private _downloadDoneCallback;

    private _downloadSpeed = new TransferSpeedAverage();

    constructor(file: FtpFile, destinationDirectory: string) {
        this._file = file;
        this._destinationDirectory = destinationDirectory;
    }

    public async start(callback) {
        this._downloadDoneCallback = callback;

        const file = this._file;
        const localDirectory = this._destinationDirectory;

        file.destinationRoot = localDirectory;

        file.downloading = true;

        logger.info("Downloading", file.fullPath);

        let localPath = FtpFile.appendSlash(localDirectory) + Utils.sanitizeFtpPath(file.name);
        let tempPath = localPath + ".tmp";

        let ftp: BasicFtpClient;

        let writeStream: fs.WriteStream | import("stream").Writable;

        let downloadDone = (err = null) => {
            if (err) {
                logger.error("Error downloading file\r\n", "Code: " + err.code, err);
            }

            ftp && FtpController.doneWithFtpObj(ftp);

            if (writeStream) {
                try {
                    writeStream.end();
                } catch(exception) {
                    logger.error('Error closing file descriptor.', tempPath, exception);
                    err = exception;
                }
            }

            if (!err) {
                try {
                    let localSize = fs.statSync(tempPath).size;

                    if (localSize < file.size) {
                        logger.info("File downloaded, but not completely. Will try again.");
                        err = "Not completely downloaded";
                    }
                } catch (exception) {
                    logger.error("Error getting file stats.", tempPath, exception);
                    err = exception;
                }
            }

            if (!err) {
                try {
                    fs.renameSync(tempPath, localPath);
                } catch (exception) {
                    logger.error('Error renaming temp file', tempPath, exception);
                    err = exception;
                }
            }

            if (!err) {
                logger.info("File downloaded successfully", localPath);
            }

            this._file.downloading = false;

            this._downloadDoneCallback(err, file);
        };

        //There's a bunch of error listeners and one success listener tied to this, only call once.
        downloadDone = once(downloadDone);

        try {
            ftp = await FtpController.ftpForDownloading();
            ftp.ftp.log = logger.debug;
        } catch (err) {
            logger.error("Unable to connect to FTP");
            downloadDone(err);
        }

        try {
            //Create the full path. jsftp will not error if the directory doesn't exist.
            await makeDir(localDirectory);
        } catch (err) {
            logger.error("Unable to make directory", localDirectory);
            downloadDone(err);
            return;
        }

        let skipBytes: number = 0;

        try {
            if (fs.existsSync(tempPath)) {
                skipBytes = fs.statSync(tempPath).size;
    
                if (skipBytes) {
                    logger.info("file already exists, skipping bytes " + skipBytes);
                }
            }

            writeStream = fs.createWriteStream(tempPath, {flags: 'a'});

            writeStream.on('error', err => {
                logger.error("writeStream error", tempPath, err);
                // Let's let basic-ftp handle this
                //downloadDone(err);
            })

            //For displaying on the client.
            file.transferred = skipBytes;
        } catch(exception) {
            logger.error("Error opening file for writing", tempPath);
            downloadDone(exception);
            return;
        }

        try {
            ftp.trackProgress(info => {
                file.transferred = info.bytesOverall + skipBytes;
    
                this._downloadSpeed.dataReceived(info.bytes);
    
                file.downloadRate = this._downloadSpeed.average();
            })

            logger.debug("Actually downloading file", file.fullPath);
            await ftp.download(writeStream, file.fullPath, skipBytes); 
            logger.debug("Success downloading file", file.fullPath);
        } catch(err) {
            downloadDone(err);
            return;
        }
        downloadDone();
    }
}

export { FtpDownloader };