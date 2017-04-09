import {Socket} from "net";
import mkdirp = require('mkdirp');
import fs = require('fs');
import once = require('once');
import {FtpFile} from "../objects/FtpFile";

const logger = require('./Logger');
const FtpController = require('./FtpController');

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

        file.destinationRoot = localDirectory;

        file.downloading = true;

        logger.info("mkdirp", localDirectory);

        //Create the full path. jsftp will not error if the directory doesn't exist.
        mkdirp.sync(localDirectory, function (err) {
            if (err) logger.error(err);
            else logger.info('dir created')
        });

        let localPath = FtpFile.appendSlash(localDirectory) + file.name;

        logger.info("Downloading", file.fullPath);

        var ftp = FtpController.ftpForDownloading();

        let fd;
        let socket;

        let downloadDone = function(err) {
            if (err) {
                logger.error("Error downloading file\r\n", err);
                self._downloadDoneCallback(err, file);

                //Make sure no more data can come in
                if (socket) {
                    socket.destroy();
                }
            }

            FtpController.doneWithFtpObj(ftp);

            if (fd) {
                try {
                    fs.closeSync(fd);
                } catch(exception) {
                    logger.error('Error closing file descriptor.?', exception);
                    err = exception;
                }
            }

            if (!err) {
                logger.info("File downloaded succesfully", localPath);
            }

            self._file.downloading = false;

            self._downloadDoneCallback(err, file);
        };

        //There's a bunch of error listeners and one success listener tied to this, only call once.
        downloadDone = once(downloadDone);


        ftp.on('error', downloadDone)
            .on('timeout', function() {
                downloadDone('timeout');
            });



        // Retrieve the file using async streams
        ftp.getGetSocket(file.fullPath, function(err: Error, sock: Socket) {
            socket = sock;
            
            if (err) {
                logger.error('Error calling ftp.getGetSocket');
                downloadDone(err);
                return;
            }

            fd = fs.openSync(localPath, "w+");

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

                downloadDone(null)
            });

            // The sock stream is paused. Call resume() on it to start reading.
            sock.resume();
        });
    }
}

module.exports = FtpDownloader;