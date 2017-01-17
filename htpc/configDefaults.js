const config = {};

config.seedboxFTP = {
    host: "localhost",
    user: "[Default]",
    password: "[Somepassword]",
    syncRoot: "/baseMediaFolder"
};

config.localSyncFolder = "~/somePath";

config.downloads = {
    countMax: 2,
    speedMax: 300000
};

module.exports = config;