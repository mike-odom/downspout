const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const config = require('../config.js');
const fakeData = require('../fakeData.js');
const FtpFile = require('../objects/FtpFile.js');
const mkdirp = require('mkdirp');

const downloader = {
    downloading: false
};

const ftpConfig = config.seedboxFTP;

const ftp = newJSFTP();

function newJSFTP() {
    return new JSFtp({
        host: ftpConfig.host,
        port: ftpConfig.port, // defaults to 21
        user: ftpConfig.user, // defaults to "anonymous"
        pass: ftpConfig.password // defaults to "@anonymous"
    });
}

downloader.sync = function () {
    if (downloader.downloading) {
        return;
    }

    downloader.downloading = true;

    JSFtpDownload(downloadCompleteCallback);
};

downloader.status = function() {
    /*let result = "Downloaded: ";
    for (let file of completedList) {
        result += file.fullRelativePath + '\n';
    }
    return result;*/

    return fakeData.statusPage();
};

function downloadCompleteCallback() {
    downloader.downloading = false;

    console.log("Downloading completed");
}

function fakeLSR(path, callback) {
    let data = fakeData.twoFiles();

    callback(null, data);

}

let downloadQueue = [];
let completedList = [];

function JSFtpDownload(completedCallback) {
    let syncFolder = config.seedboxFTP.syncRoot;

    //fakeLSR
    //ftp.lsr
    ftp.lsr(syncFolder, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('Remote structure', JSON.stringify(data, null, 2));

        //TODO: Flatten out this list and group folders with __seedbox_sync_folder__ files in them
        downloadQueue = processFilesJSON(data, syncFolder, 20);

        //TODO: Sort each group's contents by date
        downloadQueue.sort(FtpFile.sortNewestFirst);

        //console.log(downloadQueue);

        //TODO: Sort the groups by date

        //Go Async
        downloadNextInQueue();
    });
}

function downloadNextInQueue() {
    if (!downloadQueue.length) {
        downloadCompleteCallback();
        return;
    }

    let file = downloadQueue[downloadQueue.length - 1];

    let localDirectory = FtpFile.appendSlash(config.localSyncFolder) + file.fullRelativePath;

    console.log("mkdirp", localDirectory);

    //Create the full path. jsftp will not error if the folder doesn't exist.
    mkdirp(localDirectory, function (err) {
        if (err) console.error(err);
        else console.log('dir created')
    });

    let localPath = FtpFile.appendSlash(localDirectory) + file.name;

    //TODO: Change this to use streams so we know the file download status.

    console.log("Downloading", file.fullPath);
    ftp.get(file.fullPath, localPath, function(err) {
        if (err) {
            console.log("There was an error downloading the file: ", err);
        } else {
            console.log("File downloaded succesfully", localPath);

            //TODO: Delete the symlink on the server
            //ftp.delete()

            //TODO: Delete __seedbox_sync_folder__ file
            //TODO: Tell media server that files have been updated. If we've finished a section.

            downloadQueue.pop();

            completedList.push(file);

            downloadNextInQueue();
        }
    });
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
        //Only transfer symlinks
        if (file.type == FTP_TYPE_SYM_LINK) {
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

module.exports = downloader;
