import {Socket} from "net";
import mkdirp = require('mkdirp');
import fs = require('fs');

const logger = require('./Logger');
const FtpController = require('./FtpController');
const FtpFile = require('../objects/FtpFile');

class FtpDownloader {
    private _file: FtpFile;
    private _destinationDirectory: string;

    private _downloadDoneCallback;

    constructor(file: FtpFile, destinationDirectory: string) {
        this._file = file;
        this._destinationDirectory = destinationDirectory;
    }

    public start(callback) {
        var self = this;

        this._downloadDoneCallback = callback;
        
        const file = this._file;
        const localDirectory = this._destinationDirectory;

        file.downloading = true;

        logger.info("mkdirp", localDirectory);

        //Create the full path. jsftp will not error if the directory doesn't exist.
        mkdirp(localDirectory, function (err) {
            if (err) logger.error(err);
            else logger.info('dir created')
        });

        let localPath = FtpFile.appendSlash(localDirectory) + file.name;

        logger.info("Downloading", file.fullPath);

        var ftp = FtpController.ftpForDownloading();

        let fd = fs.openSync(localPath, "w+");

        let downloadDone = function(err) {
            if (err) {
                logger.error("Error downloading file\r\n", err);
                self._downloadDoneCallback(err);
            }

            FtpController.doneWithFtpObj(ftp);
            fs.closeSync(fd);

            self._file.downloading = false;

            self._downloadDoneCallback(err, file);
        };


        ftp.on('error', downloadDone)
            .on('timeout', downloadDone);

        // Retrieve the file using async streams
        ftp.getGetSocket(file.fullPath, function(err: Error, sock: Socket) {
            if (err) {
                downloadDone(err);
                return;
            }

            // `sock` is a stream. attach events to it.
            sock.on("data", function(p) {
                fs.writeSync(fd, p, 0, p.length, null);

                //Or should this be fs.bytesWritten?
                file.transferred = sock.bytesRead;

                //self._progressCallback(data);
            });
            sock.on("close", function(err) {
                if (err) {
                    downloadDone(err);
                    return;
                }

                logger.info("File downloaded succesfully", localPath);

                downloadDone(null)
            });

            // The sock stream is paused. Call resume() on it to start reading.
            sock.resume();
        });
    }
}

module.exports = FtpDownloader;