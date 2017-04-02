const JSFtp = require('./jsftp-lsr')(require("jsftp"));

const appConfig = require('../Config');

const ftpConfig = appConfig.seedboxFtp;

class FTPController {
    private static _instance: FTPController;

    private constructor() {

    }

    /**
     * Singleton!
     * @returns {FTPController}
     */
    public static getInstance() {
        if (!FTPController._instance) {
            FTPController._instance = new FTPController();
        }
        return FTPController._instance;
    }

    /** @type {JSFtp[]} */
    private ftpConnectionPool = [];

    /**
     * Create a new JSFtp instance with our config info
     */
    public newJSFtp() {
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
    public ftpForDownloading() {
        let ftp = this.ftpConnectionPool.pop() || this.newJSFtp();

        return ftp;
    }

    /**
     * Done with this FTP object, put it back in the pool
     *
     * @param ftp {JSFtp}
     */
    public doneWithFtpObj(ftp) {
        this.ftpConnectionPool.push(ftp);
    }

}

//Is this proper to do this with a singleton in node? idk node newb
module.exports = FTPController.getInstance();