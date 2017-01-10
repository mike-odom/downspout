const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const config = require('../config.js');
const fakeData = require('../fakeData.js');

const downloader = {
    downloading: false
};

const ftpConfig = config.seedboxFTP;

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

    JSFtpDownload(downloadCompleteCallback)

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

function JSFtpDownload(completedCallback) {
    let ftp = newJSFTP();

    let syncFolder = "/seedbox-sync";

    //ftp.lsr
    fakeLSR(syncFolder, function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        console.log('File structure', JSON.stringify(data, null, 2));

        //TODO: Flatten out this list
        let files = processFilesJSON(data, syncFolder, 20);

        //TODO: Sort the list by date

        //TODO: Start popping items off the list

            //TODO: Download the file

            //TODO: Delete the symlink

            //TODO: Tell media server that files have been updated

        completedCallback();
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
 * @param newList
 */
function processFilesJSON(data, path, depth, newList = []) {
    path = appendSlash(path);

    if (depth == 0) {
        console.log("Maximum file depth reached, exiting", path);
        return;
    }
    for (let file of data) {
        if (file.type == FTP_TYPE_FILE) {
            console.log(path + file.name);
            newList.push(file);
        } else if (file.type == FTP_TYPE_DIRECTORY) {
            if (typeof file.children == 'object') {
                const newPath = path + file.name;
                processFilesJSON(file.children, path, depth - 1);
            }
        }
    }

}

function appendSlash(path) {
    if (path.charAt(path.length -1) == '/') return path;
    return path + '/';
}

module.exports = downloader;
