const config = {};

config.seedboxFTP = {
    host: "localhost",
    user: "[Default]",
    password: "[Somepassword]",
    syncRoot: "/baseMediaFolder",
    port: 21
};

config.localSyncFolder = "~/somePath";

config.downloads = {
    countMax: 2,
    speedMax: 300000
};

//You'll normally want to keep this to true, this is for testing purposes only.
config.deleteRemoteFiles = true;

module.exports = config;