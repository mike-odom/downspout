import * as winston from "winston";

const logger : winston.LoggerInstance = require('./logger');

const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const config = require('../Config');
const FtpFile = require('../objects/FtpFile');
import mkdirp = require('mkdirp');
import mongoose = require('mongoose');
const SyncLogItem = require('./../objects/SyncLogItem');

const ftpConfig = config.seedboxFtp;

//TODO: Create new Downloader for every time we try to sync.
// This will prevent stuff like the FTP completed callbck from breaking when trying to access the downloadQueue which is missing.
class Downloader {
    private downloading = false;
    private syncRequestedWhileDownloading = false;
    private lastRunHadStuffToDownload = false;

    private downloadQueue: FtpFile[] = [];
    private completedList: FtpFile[] = [];

    /** @type {JSFtp[]} */
    private ftpConnectionPool = [];

    private pollingTimeoutId = 0;

    /**
     * Create a new JSFtp instance with our config info
     */
    private newJSFtp() {
        return new JSFtp({
            host: ftpConfig.host,
            port: ftpConfig.port || 21,
            user: ftpConfig.user || "anonymous",
            pass: ftpConfig.password || "@anonymous"
        });
    }

    public syncRequest() {
        console.log("syncRequest");
        
        if (this.downloading) {
            // A sync was requested during our download,
            // this will attempt to run again with fresh FTP directory info.
            this.syncRequestedWhileDownloading = true;
            return;
        }

        this.startSync();
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

    private downloadCompleteCallback() {
        this.downloading = false;


        console.log("Downloading completed");
                   
        if (this.lastRunHadStuffToDownload || this.syncRequestedWhileDownloading) {
            this.startSync();
        } else {
            console.log("Polling interval", ftpConfig.pollingIntervalInSeconds * 1000);
            this.pollingTimeoutId = setTimeout(this.syncRequest.bind(this), ftpConfig.pollingIntervalInSeconds * 1000)
        }
    }

    /**
     * Looks at the files in the remote server and starts the download process
     *
     */
    private startSync() {
        this.syncRequestedWhileDownloading = false;
        this.downloading = true;

        //Cancel any scheduled polling of the server. This will be reset when we're done with our process.
        if (this.pollingTimeoutId) {
            clearTimeout(this.pollingTimeoutId);
            this.pollingTimeoutId = 0;
        }

        let syncFolder = config.seedboxFtp.syncRoot;

        let ftp = this.newJSFtp();

        ftp.lsr(syncFolder, function (err, data) {
            if (err) {
                console.log(err);
                return;
            }
            //console.log('Remote structure', JSON.stringify(data, null, 2));

            //TODO: Flatten out this list and group directories with __seedbox_sync_directory__ files in them
            this.downloadQueue = this.processFilesJSON(data, syncFolder, 20);

            this.updateFileSizes(ftp, this.downloadQueue);

            //TODO: Sort each group's contents by date
            this.downloadQueue.sort(FtpFile.sortNewestFirst);

            //console.log(downloadQueue);

            //TODO: Sort the groups by date

            //Go Async
            this.downloadNextInQueue();
        }.bind(this));
    }
    
    /**
     * Creates a new JSFtp instance or pulls one from a connection pool
     *
     * @returns {JSFtp}
     */
    private ftpForDownloading() {
        let ftp = this.ftpConnectionPool.pop() || this.newJSFtp();

        ftp.on('progress', this.ftpProgressUpdate.bind(this));

        return ftp;
    }

    /**
     * Done with this FTP object, put it back in the pool
     *
     * @param ftp {JSFtp}
     */
    private doneWithFtpObj(ftp) {
        this.ftpConnectionPool.push(ftp);
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
        let file : FtpFile = this.getNextFileToDownload();

        if (!file) {
            if (!this.downloadQueue.length) {
                this.downloadCompleteCallback();
            }
            return;
        }

        file.downloading = true;

        let localDirectory = this.getDestinationDirectory(file);

        console.log("mkdirp", localDirectory);

        //Create the full path. jsftp will not error if the directory doesn't exist.
        mkdirp(localDirectory, function (err) {
            if (err) console.error(err);
            else console.log('dir created')
        });

        let localPath = FtpFile.appendSlash(localDirectory) + file.name;

        let ftp = this.ftpForDownloading();

        console.log("Downloading", file.fullPath);
        ftp.get(file.fullPath, localPath, function (err) {
            if (err) {
                console.log("There was an error downloading the file: ", err);
            } else {
                console.log("File downloaded succesfully", localPath);

                if (config.deleteRemoteFiles) {
                    //Delete the symlink on the server
                    let deleteFtp = this.newJSFtp();
                    deleteFtp.raw("dele " + file.actualPath, function (err) {
                        if (err) {
                            console.error("Error deleting file, make sure you have proper permissions", file.actualPath, err);
                        } else {
                            console.log("Deleted symlink", file.actualPath);
                        }

                    });
                }

                //TODO: Delete __seedbox_sync_folder__ file
                //TODO: Tell media server that files have been updated. If we've finished a section.

                //Done, remove from queue.
                this.removeFileFromQueue(file, this.downloadQueue);

                this.completedList.push(file);

                this.doneWithFtpObj(ftp);

                this.downloadNextInQueue();
            }
        }.bind(this));

        this.downloadNextInQueue();
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
            console.log("Maximum file depth reached, exiting", relativePath);
            return;
        }
        for (let file of data) {
            //Only transfer symlinks, or if running the test server, all files
            if (file.type == FtpFile.FTP_TYPE_SYM_LINK || (/*config.testFtpServer && */ file.type == FtpFile.FTP_TYPE_FILE)) {
                console.log(relativePath + file.name);
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

                    console.log("Got target data", data[0]);
                    file.setTargetData(data[0]);
                });
            }
        }
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

module.exports = new Downloader();