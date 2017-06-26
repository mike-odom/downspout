import * as winston from "winston";

const logger : winston.LoggerInstance = require('./Logger');

const fs = require('fs');
const config = require('../Config');
import mongoose = require('mongoose');
import {FtpFile} from "../objects/FtpFile";
import {UserNotificationModel} from "../../../shared/models/UserNotificationModel";
import {UserNotificationController} from "./UserNotificationController";
import {UserNotification} from "../objects/UserNotification";
const SyncLogItem = require('./../objects/SyncLogItem');

const FtpController = require('./FtpController');
const FtpScanner = require('./FtpScanner');
const FtpDownloader = require('./FtpDownloader');

//TODO: Create new SyncController for every time we try to sync.
// This will prevent stuff like the FTP completed callbck from breaking when trying to access the downloadQueue which is missing.
class SyncController {
    private downloadQueue: FtpFile[] = [];
    private completedList: FtpFile[] = [];
    private ftpScanner = new FtpScanner(this.scanCompleteCallback.bind(this));

    public syncRequest() {
        logger.info("syncRequest");

        UserNotificationController.getInstance().postNotification(new UserNotification("Sync Request received"));
        
        this.ftpScanner.scanRequest();
    }

    public status() {
        let downloads = [];

        for (let file of this.downloadQueue) {
            downloads.push(file.toModel());
        }

        return {
            "stats": {
                "download_rate": 56.3,
                "max_download_rate": 5000001,
                "num_connections": 1,
                "max_num_connections": 2
            },
            "downloads": downloads,
            "notifications": UserNotificationController.getInstance().getNotifications()
        };
    }

    public scanCompleteCallback(err, scannedQueue: FtpFile[], ftp) {
        var self = this;

        if (err) {
            let message;

            switch (err.code) {
                case 530:
                    message = "Invalid FTP user or password";
                    break;
                default:
                   message = err.toString();
            }
            logger.error("scanCompleteCallback: ", message);

            UserNotificationController.getInstance().postNotification(new UserNotificationModel(message));

            return;
        }

        let originalDownloadQueueLength = self.downloadQueue.length;
        
        // Merge downloadQueue & scannedQueue
        let nonDupes = [];
        // Merge downloadQueue & scannedQueue
        for (var t = 0; t < scannedQueue.length; t++) {
            var testFile = scannedQueue[t];
            for (var n = 0; n < self.downloadQueue.length; n++) {
                if (testFile.equals(self.downloadQueue[n])) {
                    testFile = null;
                    break;
                }
            }
            if (testFile) {
                nonDupes.push(testFile);
            }
        }

        self.updateFileSizes(nonDupes, ftp);

        logger.info("FTP scan found " + nonDupes.length + " files");

        self.downloadQueue = self.downloadQueue.concat(nonDupes);

        self.downloadNextInQueue();
    }

    /**
     * The recursive directory search only gives us symlinks. We need to see how big the actual files are one by one.
     *
     * This is fine to not block because it's only updating the file sizes to show on the UI and not any logic
     *
     * @param ftp
     * @param list
     */
    private updateFileSizes(list: FtpFile[], ftp) {
        for (let file of list) {
            /** @type {FtpFile} */

            if (file.isSymLink) {
                ftp.ls(file.fullPath, function (err, data) {
                    if (err || data.length != 1) {
                        logger.log("Error getting data for", file.fullPath);
                        return;
                    }

                    logger.info("Got target data", data[0]);
                    file.targetData(data[0]);
                });
            }
        }
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
        let file : FtpFile;
        while ( file = this.getNextFileToDownload()) {
            let localDirectory = this.getDestinationDirectory(file);

            let ftpDownloader = new FtpDownloader(file, localDirectory);
            ftpDownloader.start(this.downloadDone.bind(this));
        }
    }

    private downloadDone(err, file: FtpFile) {
        if (!err && config.deleteRemoteFiles) {
            this.deleteRemoteFile(file);
        }

        //TODO: Delete __seedbox_sync_folder__ file
        //TODO: Tell media server that files have been updated. If we've finished a section.

        if (!err) {
            this.completedList.push(file);

            UserNotificationController.getInstance().postNotification(new UserNotificationModel("Download completed " + file.name));
        }

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
        let deleteFtp = FtpController.newJSFtp();
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
}

module.exports = new SyncController();