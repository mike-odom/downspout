const BasicFtp = require("basic-ftp")

const appConfig = require('../Config');

const ftpConfig = appConfig.seedboxFtp;

const ftpConnectionPool = [];

class FtpController {

    /**
     * Create a new ftp client with our config info
     */
    // TODO: Rename this
    public static async newJSFtp() {
        const client = new BasicFtp.Client(appConfig.networkTimeoutInSeconds * 1000);
        
        client.ftp.verbose = true

        // TODO: Deal with error handling
        await client.access({
            host: ftpConfig.host,
            port: ftpConfig.port || 21,
            user: ftpConfig.user || "anonymous",
            password: ftpConfig.password || "@anonymous",
            secure: ftpConfig.secure,
        });

        return client;
    }

    /**
     * Creates a new JSFtp instance or pulls one from a connection pool
     *
     * @returns {JSFtp}
     */
    public static async ftpForDownloading() {
        //The pool is closed for repairs.
        // let ftp = ftpConnectionPool.pop() || this.newJSFtp();
        //
        // return ftp;

        return this.newJSFtp();
    }

    /**
     * Done with this FTP object, put it back in the pool
     *
     * @param ftp {JSFtp}
     */
    public static doneWithFtpObj(ftp) {
        //ftpConnectionPool.push(ftp);
    }

}

export { FtpController };