const JSFtp = require('./jsftp-lsr')(require("jsftp"));

const appConfig = require('../Config');

const ftpConfig = appConfig.seedboxFtp;

/** @type {JSFtp[]} */
const ftpConnectionPool = [];

class FtpController {

    /**
     * Create a new JSFtp instance with our config info
     */
    public static newJSFtp() {
        const ftp = new JSFtp({
            host: ftpConfig.host,
            port: ftpConfig.port || 21,
            user: ftpConfig.user || "anonymous",
            pass: ftpConfig.password || "@anonymous"
        });

        //ftp.timeout =

        return ftp;
    }

    /**
     * Creates a new JSFtp instance or pulls one from a connection pool
     *
     * @returns {JSFtp}
     */
    public static ftpForDownloading() {
        let ftp = ftpConnectionPool.pop() || this.newJSFtp();

        return ftp;
    }

    /**
     * Done with this FTP object, put it back in the pool
     *
     * @param ftp {JSFtp}
     */
    public static doneWithFtpObj(ftp) {
        ftpConnectionPool.push(ftp);
    }

}

//Is this proper to do this with a singleton in node? idk node newb
module.exports = FtpController;