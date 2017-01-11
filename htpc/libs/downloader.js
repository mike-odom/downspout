const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const config = require('../config.js');
const fakeData = require('../fakeData.js');
const FtpFile = require('../objects/FtpFile.js');

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

    //testSpawn();

    // ftp.list(ftpConfig.root, function (error, data) {
    //     console.log('List complete');
    //     console.log(data);
    //     result.send(data);
    // });
};

function downloadCompleteCallback() {
    downloader.downloading = false;
}

function fakeLSR(path, callback) {
    let data = fakeData.twoFiles();

    callback(null, data);

}

let downloadQueue = [];

function JSFtpDownload(completedCallback) {
    let syncFolder = "/seedbox-sync";

    //fakeLSR
    //ftp.lsr
    ftp.lsr(syncFolder, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        //console.log('File structure', JSON.stringify(data, null, 2));

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

    let newPath = "c:\\" + file.name;
    ftp.get(file.fullPath, newPath, function(err) {
        if (err) {
            console.log("There was an error downloading the file: ", err);
        } else {
            console.log("File downloaded succesfully", newPath);

            //TODO: Delete the symlink on the server
            //TODO: Delete __seedbox_sync_folder__ file
            //TODO: Tell media server that files have been updated. If we've finished a section.

            downloadQueue.pop();

            downloadNextInQueue();
        }
    });
}

const FTP_TYPE_FILE = 0;
const FTP_TYPE_DIRECTORY = 1;

/**
 * Recursive function to traverse a file tree.
 *
 * JavaScript has a maximum depth of 1000. But we should do something lower.
 *
 * @param data an array of files
 * @param path the path where these files are located
 * @param depth how deep to go down in the children
 * @param outList
 */
function processFilesJSON(data, path, depth = 20, outList = []) {
    path = FtpFile.appendSlash(path);

    if (depth == 0) {
        console.log("Maximum file depth reached, exiting", path);
        return;
    }
    for (let file of data) {
        if (file.type == FTP_TYPE_FILE) {
            console.log(path + file.name);
            let fileObj = new FtpFile(path, file);
            outList.push(fileObj);
        } else if (file.type == FTP_TYPE_DIRECTORY) {
            if (typeof file.children == 'object') {
                const newPath = path + file.name;
                processFilesJSON(file.children, newPath, depth - 1, outList);
            }
        }
    }

    return outList;
}

module.exports = downloader;
