const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const config = require('../config.js');
const fakeData = require('../fakeData.js');
const FtpFile = require('../objects/FtpFile.js');
const mkdirp = require('mkdirp');

const ftpConfig = config.seedboxFTP;

const Downloader = module.exports = function () {
    this.downloading = false;
};

/** @type {FtpFile[]} */
let downloadQueue = [];

/** @type {FtpFile[]} */
let completedList = [];

/** @type {JSFtp[]} */
let ftpConnectionPool = [];

/**
 * Create a new JSFtp instance with our config info
 */
function newJSFtp() {
    return new JSFtp({
        host: ftpConfig.host,
        port: ftpConfig.port, // defaults to 21
        user: ftpConfig.user, // defaults to "anonymous"
        pass: ftpConfig.password // defaults to "@anonymous"
    });
}

Downloader.sync = function () {
    if (this.downloading) {
        return;
    }

    this.downloading = true;

    startSync(downloadCompleteCallback);
};

Downloader.status = function() {
    /*let result = "Downloaded: ";
    for (let file of completedList) {
        result += file.fullRelativePath + '\n';
    }
    return result;*/

    let downloads = [];

    for (let file of downloadQueue) {
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

    //return fakeData.statusPage();
};

function downloadCompleteCallback() {
    Downloader.downloading = false;

    console.log("Downloading completed");
}

// function fakeLSR(path, callback) {
//     let data = fakeData.twoFiles();
//
//     callback(null, data);
//
// }

/**
 * Looks at the files in the remote server and starts the download process
 *
 */
function startSync() {
    let syncFolder = config.seedboxFTP.syncRoot;

    let ftp = newJSFtp();

    ftp.lsr(syncFolder, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Remote structure', JSON.stringify(data, null, 2));

        //TODO: Flatten out this list and group folders with __seedbox_sync_folder__ files in them
        downloadQueue = processFilesJSON(data, syncFolder, 20);

        updateFileSizes(ftp, downloadQueue);

        //TODO: Sort each group's contents by date
        downloadQueue.sort(FtpFile.sortNewestFirst);

        //console.log(downloadQueue);

        //TODO: Sort the groups by date

        //Go Async
        downloadNextInQueue();
    });
}

/**
 * Creates a new JSFtp instance or pulls one from a connection pool
 *
 * @returns {JSFtp}
 */
function ftpForDownloading() {
    let ftp = ftpConnectionPool.pop() || newJSFtp();

    ftp.on('progress', ftpProgressUpdate);

    return ftp;
}

/**
 * Done with this FTP object, put it back in the pool
 *
 * @param ftp {JSFtp}
 */
function doneWithFtpObj(ftp) {
    ftpConnectionPool.push(ftp);
}

/**
 * Returns a file if there is one ready to download
 * This function is limited by how many free ftp connections there are
 *
 * @returns {FtpFile|null}
 */
function getNextFileToDownload() {
    let downloadingCount = 0;
    let nextFile = null;

    for (let file of downloadQueue) {
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
function removeFileFromQueue(ftpFile, queue) {
    for (let t = 0; t < queue.length; t++) {
        if (queue[t] == ftpFile) {
            queue.splice(t, 1);
        }
    }
}

/**
 * Download another item in the queue if it exists
 */
function downloadNextInQueue() {
    let file = getNextFileToDownload();

    if (!file) {
        if (!downloadQueue.length) {
            downloadCompleteCallback();
        }
        return;
    }

    file.downloading = true;

    let localDirectory = FtpFile.appendSlash(config.localSyncFolder) + file.fullRelativePath;

    console.log("mkdirp", localDirectory);

    //Create the full path. jsftp will not error if the folder doesn't exist.
    mkdirp(localDirectory, function (err) {
        if (err) console.error(err);
        else console.log('dir created')
    });

    let localPath = FtpFile.appendSlash(localDirectory) + file.name;

    //TODO: Change this to use streams so we know the file download status.

    let ftp = ftpForDownloading();

    console.log("Downloading", file.fullPath);
    ftp.get(file.fullPath, localPath, function(err) {
        if (err) {
            console.log("There was an error downloading the file: ", err);
        } else {
            console.log("File downloaded succesfully", localPath);

            if (config.deleteRemoteFiles) {
                //Delete the symlink on the server
                let deleteFtp = newJSFtp();
                deleteFtp.raw("dele " + file.actualPath, function (err) {
                    if (err) {
                        console.log("Error deleting file", file.actualPath, err);
                    } else {
                        console.log("Deleted symlink", file.actualPath);
                    }

                });
            }

            //TODO: Delete __seedbox_sync_folder__ file
            //TODO: Tell media server that files have been updated. If we've finished a section.

            //Done, remove from queue.
            removeFileFromQueue(file, downloadQueue);

            completedList.push(file);

            doneWithFtpObj(ftp);

            downloadNextInQueue();
        }
    });

    downloadNextInQueue();
}

const FTP_TYPE_FILE = 0;
const FTP_TYPE_DIRECTORY = 1;
const FTP_TYPE_SYM_LINK = 2;

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
function processFilesJSON(data, basePath, depth = 20, relativePath = "", outList = []) {
    relativePath = FtpFile.appendSlash(relativePath);

    if (depth == 0) {
        console.log("Maximum file depth reached, exiting", relativePath);
        return;
    }
    for (let file of data) {
        //Only transfer symlinks, or if running the test server, all files
        if (file.type == FTP_TYPE_SYM_LINK || (config.testFtpServer && file.type == FTP_TYPE_FILE)) {
            console.log(relativePath + file.name);
            let fileObj = new FtpFile(basePath, relativePath, file);
            outList.push(fileObj);
        } else if (file.type == FTP_TYPE_DIRECTORY) {
            if (typeof file.children == 'object') {
                const newPath = relativePath + file.name;
                processFilesJSON(file.children, basePath, depth - 1, newPath, outList);
            }
        }
    }

    return outList;
}

/**
 * The recursive directory search only gives us symlinks. We need to see how big the actual files are one by one.
 *
 * @param ftp
 * @param list
 */
function updateFileSizes(ftp, list) {
    for (let file of list) {
        /** @type {FtpFile} */

        if (file.isSymLink) {
            ftp.ls(file.fullPath, function (err, data) {
                if (err || data.length != 1) {
                    cosole.log("Error getting data for", file.fullPath);
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
function ftpProgressUpdate(data) {
    for (file of downloadQueue) {
        if (file.fullPath == data.filename) {
            file.transferred = data.transferred;

            break;
        }
    }

}
