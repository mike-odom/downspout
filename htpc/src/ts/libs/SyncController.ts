import * as winston from "winston";

const logger : winston.LoggerInstance = require('./Logger');

const fs = require('fs');
const config = require('../Config');
const FtpFile = require('../objects/FtpFile');
import mkdirp = require('mkdirp');
import mongoose = require('mongoose');
import {Socket} from "net";
const SyncLogItem = require('./../objects/SyncLogItem');

const FTPController = require('./FTPController');
const FTPScanner = require('./FTPScanner');

//TODO: Create new SyncController for every time we try to sync.
// This will prevent stuff like the FTP completed callbck from breaking when trying to access the downloadQueue which is missing.
class SyncController {
    private downloadQueue: FtpFile[] = [];
    private completedList: FtpFile[] = [];
    private ftpScanner = new FTPScanner(this.scanCompleteCallback.bind(this));

    public syncRequest() {
        logger.info("syncRequest");
        
        this.ftpScanner.scanRequest();
    }

    public status() {
        let downloads = [];

        for (let file of this.downloadQueue) {
            downloads.push(file.json());
        }

        return {
            "stats": {
                "download_rate": 56.3,
                "max_download_rate": 5000001,
                "num_connections": 1,
                "max_num_connections": 2
            },
            "downloads": downloads
        };
    }

    public scanCompleteCallback(err: Error, scannedQueue: FtpFile[]) {
        var self = this;

        if (err) {
            logger.error("scanCompleteCallback: ", err);
            return;
        }

        let originalDownloadQueueLength = self.downloadQueue.length;
        
        // Merge downloadQueue & scannedQueue
        for (var t = 0; t < scannedQueue.length; t++) {
            var testFile = scannedQueue[t];
            for (var n = 0; n < originalDownloadQueueLength; n++) {
                if (testFile.equals(self.downloadQueue[n])) {
                    testFile = null;
                    break;
                }
            }
            if (testFile) {
                self.downloadQueue.push(testFile);
            }
        }

        self.downloadNextInQueue();
    }

    /**
     * Returns a file if there is one ready to download
     * This function is limited by how many free ftp connections there are
     *
     * @returns {FtpFile|null}
     */
    private getNextFileToDownload(): FtpFile {
        let downloadingCount = 0;
        let nextFile = null;

        for (let file of this.downloadQueue) {
            if (!file.downloading) {
                if (nextFile == null) {
                    nextFile = file;
                }
            } else {
                downloadingCount++;
            }
        }

        if (downloadingCount < config.downloads.countMax) {
            return nextFile;
        }

        return null;
    }

    /**
     * An item has been successfully downloaded, remove it from the queue
     *
     * @param ftpFile {FtpFile}
     * @param queue {FtpFile[]}
     */
    private removeFileFromQueue(ftpFile, queue) {
        for (let t = 0; t < queue.length; t++) {
            if (queue[t] == ftpFile) {
                queue.splice(t, 1);
            }
        }
    }

    /**
     * Given an FtpFile, will return the destination directory based on our path mappings
     *
     *  ex:
     *    FTP file: "/seedbox-sync/toUpload/tv/Some TV Show/episode 01.avi",
     *    localPath: "/microverse/library/seedbox/tv",
     *
     *  returns: "/microverse/library/seedbox/tv/Some TV Show/"
     *
     * @param file
     * @returns {string}
     */
    private getDestinationDirectory(file : FtpFile) : string {
        let remoteDirectory = file.relativeDirectory;
        let pathMap : PathMapping;

        for (pathMap of config.pathMappings) {
            // We're going to be doing some comparison and removal with this path. Make sure it's good.
            let pathMapDirectory = FtpFile.appendSlash(pathMap.remotePath);

            if (remoteDirectory.indexOf(pathMapDirectory) == 0) {
                //Strip the pathMap root from the remoteDirectory to get the relative mapping
                let relativeDirectory = remoteDirectory.substring(pathMapDirectory.length);

                return FtpFile.appendSlash(pathMap.localPath) + relativeDirectory;
            }
        }
        
        // Default value will be used if there are no matching path mappings
        return FtpFile.appendSlash(config.localSyncRoot) + file.relativeDirectory;
    }

    /**
     * Download another item in the queue if it exists
     */
    private downloadNextInQueue() {
        let self = this;
        
        let file : FtpFile = this.getNextFileToDownload();

        if (!file) {
            logger.info("No more files left in the queue to process.");
            return;
        }

        file.downloading = true;

        let localDirectory = this.getDestinationDirectory(file);

        logger.info("mkdirp", localDirectory);

        //Create the full path. jsftp will not error if the directory doesn't exist.
        mkdirp(localDirectory, function (err) {
            if (err) logger.error(err);
            else logger.info('dir created')
        });

        let localPath = FtpFile.appendSlash(localDirectory) + file.name;

        let ftp = FTPController.ftpForDownloading();

        function ftpDownloadError(err) {
            logger.error("Error downloading file\r\n", err);

            file.downloading = false;

            FTPController.doneWithFtpObj(ftp);
            self.downloadNextInQueue();
        }

        ftp.on('error', ftpDownloadError);
        ftp.on('timeout', ftpDownloadError);

        logger.info("Downloading", file.fullPath);


        // Retrieve the file using async streams
        ftp.getGetSocket(file.fullPath, function(err: Error, sock: Socket) {
            if (err) {
                ftpDownloadError(err);
                return;
            }

            var fd = fs.openSync(localPath, "w+");

            // `sock` is a stream. attach events to it.
            sock.on("data", function(p) {
                fs.writeSync(fd, p, 0, p.length, null);

                var data = {
                    filename: file.fullPath,
                    transferred: sock.bytesRead,
                };
                self.ftpProgressUpdate(data);
            });
            sock.on("close", function(err) {
                if (err) {
                    ftpDownloadError(err);
                    return;
                }

                logger.info("File downloaded succesfully", localPath);

                FTPController.doneWithFtpObj(ftp);
                fs.closeSync(fd);

                self.downloadNextInQueue();
            });

            // The sock stream is paused. Call resume() on it to start reading.
            sock.resume();

            // Kick off the next download if we're ready for it.
            self.downloadNextInQueue();
        });
    }

    private fileDownloadedSuccessfully(file) {
        if (config.deleteRemoteFiles) {
            this.deleteRemoteFile(file);
        }

        //TODO: Delete __seedbox_sync_folder__ file
        //TODO: Tell media server that files have been updated. If we've finished a section.

        this.completedList.push(file);

        //Done, remove from queue.
        this.removeFileFromQueue(file, this.downloadQueue);

        this.downloadNextInQueue();
    }

    private deleteRemoteFile(file: FtpFile) {
        var deleteFtpError = function deleteFtpError(err) {
            logger.error("Error deleting file, make sure you have proper permissions", file.actualPath, err);

            //TODO: Handle this failed delete better. Logging or something.
        };

        //Delete the symlink on the server
        let deleteFtp = FTPController.newJSFtp();
        deleteFtp.on('error', deleteFtpError);
        deleteFtp.on('timeout', deleteFtpError);

        deleteFtp.raw("dele " + file.actualPath, function (err) {
            if (err) {
                deleteFtpError(err);
            } else {
                logger.info("Deleted symlink", file.actualPath);
            }
        });
    }

    /**
     * Callback from jsftp to let us know file download progress
     *
     * @param data - { transfered, total, filename, action (get/put) }
     */
    private ftpProgressUpdate(data) {
        for (let file of this.downloadQueue) {
            if (file.fullPath == data.filename) {
                file.transferred = data.transferred;

                break;
            }
        }
    }
}

module.exports = new SyncController();