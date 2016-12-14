var JSFtp = require("jsftp");

//JSFtp = require('./jsftp-lsr')(JSFtp);
var config = require('../config.js');

var downloader = {
    downloading: false
};

var ftpConfig = config.seedboxFTP;

function newFTP() {
    return new JSFtp({
        host: ftpConfig.host,
        port: ftpConfig.port, // defaults to 21
        user: ftpConfig.user, // defaults to "anonymous"
        pass: ftpConfig.password // defaults to "@anonymous"
    });
}

downloader.sync = function (result) {
    if (downloader.downloading) {
        return;
    }

    var ftp = newFTP();

    ftp.lsr("/seedbox-sync", function (err, data) {
        if (err) {
            console.log(err);
            result.send(err);
            return;
        }
        console.log('File structure', JSON.stringify(data, null, 2));

        result.send("Done");
    });

    // ftp.list(ftpConfig.root, function (error, data) {
    //     console.log('List complete');
    //     console.log(data);
    //     result.send(data);
    // });
};

module.exports = downloader;
