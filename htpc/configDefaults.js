const config = {};

/**
 * This is the FTP on your seedbox to connect to.
 *
 * TODO: Allow multiple FTPs to connect to.
 *
 * @type {{host: string, user: string, password: string, syncRoot: string, port: number}}
 */
config.seedboxFTP = {
    host: "localhost",
    user: "[Default]",
    password: "[Somepassword]",
    syncRoot: "/baseMediaFolder",
    port: 21,
    pollingIntervalInMinutes: 1
};

/**
 * The port that this server will listen to for the seedbox callback.
 * Also used for viewing the status page
 * 
 * @type {number}
 */
config.port = 45532;

/**
 * Where you are syncing to on the local machine
 *
 * @type {string}
 */
config.localSyncFolder = "~/somePath";

/**
 * Download config
 *
 * @type {{countMax: number, speedMax: number}}
 */
config.downloads = {
    countMax: 2,
    speedMax: 300000
};

/**
 * The seedbox script creates symlinks. This deletes those symlinks.
 *
 * You'll normally want to keep this to true, this is for setup & testing purposes only.
 *
 * @type {boolean}
 */
config.deleteRemoteFiles = true;

module.exports = config;