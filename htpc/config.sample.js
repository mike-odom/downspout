/**
 * This is a sample config file that should be copied over to config.js and then edited.
 */

// Config for your remote FTP server
config.seedboxFtp = {
    host: "someserver.domain",
    user: "yourUser",
    password: "yourPassword",
    // The root of your FTP Server which will be scanned for files. This points to the syncDir in your seedbox config.
    syncRoot: "/seedbox/toUpload",
    pollingIntervalInSeconds: 6000
};

// The local destination where your files will be transferred to by default.
// You can setup more complex destinations in config.pathMappings below.
config.localSyncRoot = "C:/seedboxTest";

// Path Mappings - Use these to setup more complicated sync destinations
// This is for if you're syncing your movies to one location and shows to another, or whatever.
// Make sure to remove the comment syntax if you're going to use this. These --> /* */
/*
config.pathMappings =
    [
        {
            remotePath: "/seedbox/toUpload/tv",
            localPath: "c:/seedbox/tv"
        },
        {
            remotePath: "movies",
            localPath: "d:/movies/"
        }
    ];
*/

config.downloads = {
    // How many files to download at once
    countMax: 2,

    // Not used yet
    speedMax: 300000
};


// The port to listen to for the status page and seedbox callback
config.port = 45532;

// Keep this as false when you're setting up, but make sure to change this to true when everything checks out.
config.deleteRemoteFiles = false;