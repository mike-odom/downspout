const JSFtp = require('./jsftp-lsr')(require("jsftp"));
const FTPS = require('./ftps');

const config = require('../config.js');

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

function newLFTP() {
    return new FTPS({
        host: ftpConfig.host, // required
        username: ftpConfig.user, // Optional. Use empty username for anonymous access.
        password: ftpConfig.password, // Required if username is not empty, except when requiresPassword: false
        protocol: 'sftp', // Optional, values : 'ftp', 'sftp', 'ftps', ... default: 'ftp'
        // protocol is added on beginning of host, ex : sftp://domain.com in this case
        port: ftpConfig.port, // Optional
        // port is added to the end of the host, ex: sftp://domain.com:22 in this case
        escape: true, // optional, used for escaping shell characters (space, $, etc.), default: true
        retries: 1, // Optional, defaults to 1 (1 = no retries, 0 = unlimited retries)
        timeout: 10, // Optional, Time before failing a connection attempt. Defaults to 10
        retryInterval: 5, // Optional, Time in seconds between attempts. Defaults to 5
        retryMultiplier: 1, // Optional, Multiplier by which retryInterval is multiplied each time new attempt fails. Defaults to 1
        requiresPassword: true, // Optional, defaults to true
        autoConfirm: true, // Optional, is used to auto confirm ssl questions on sftp or fish protocols, defaults to false
        cwd: '', // Optional, defaults to the directory from where the script is executed
        additionalLftpCommands: '' // Additional commands to pass to lftp, splitted by ';'
    });
}

downloader.sync = function (result) {
    if (downloader.downloading) {
        return;
    }

    //JSFtpDownload(downloadCompleteCallback)

    LFtpDownload(downloadCompleteCallback);


    // ftp.list(ftpConfig.root, function (error, data) {
    //     console.log('List complete');
    //     console.log(data);
    //     result.send(data);
    // });
};

function downloadCompleteCallback() {
    downloader.downloading = false;
}

function JSFtpDownload(completedCallback) {
    let ftp = newJSFTP();

    ftp.list("/seedbox-sync", function (err, data) {
        if (err) {
            console.log(err);
            result.send(err);
            return;
        }
        console.log('File structure', JSON.stringify(data, null, 2));

        //TODO: Flatten out this list

        //TODO: Sort the list by date

        //TODO: Start popping items off the list and downloading them via FTP

        result.send("Done");

        completedCallback();
    });
}

function LFtpDownload(completedCallback) {
    let ftp = newLFTP();

    const opts = {
        remoteDir: '',
        localDir: '',
        //Raw options
        options: '',
        upload: false,
        parallel: false,
        filter: '',
    };

    //ftp.mirror(opts).exec(console.log);

    //var stream = ftp.raw('find').execAsStream();
    // stream.pipe(process.stdout);

    // //TODO: If lftp is not installed, no error will occur. OOPS
    ftp.ls().exec(console.log, function(err, data) {
        console.log("moo", data);
    });
}

module.exports = downloader;
