# SeedboxSync

## Overview

This app helps you sync from a seedbox / torrent machine, where media files are being downloaded, to your HTPC (or whatever destination computer.) It is in two parts. There is a bash script that lives on your seedbox which creates symlinks and then notifies the Node.js app that runs on your HTPC.

## Seedbox
This script lives on your seedbox and requires your torrent application to call it.

### Configuration
```bash
#!/usr/bin/env bash

baseMediaDir=~/files/torrent/download/path
# We need a full path, so if you use something like ~, we need to evaluate it.
eval baseMediaDir=$baseMediaDir

# Relative path is ok here.
syncDir="toUpload"

# Where the HTPC Node.js lives
syncServer=http://[some ip address]:45532
```

Important: syncDir and baseMediaDir need to both be accessible via FTP. And the FTP client must be able to delete files from syncDir.

Make the script files executable
```bash
cd seedbox
chmod u+x *.sh
```

### Torrent client setup
Setup the [Execute Plugin](http://dev.deluge-torrent.org/wiki/Plugins/Execute) to call seedbox/deluge.sh on torrent complete.

## HTPC 
This app lives on your HTPC. It's the destination for the sync process. It sits and waits for a ping from the seedbox (or regularly scheduled interval) to scan the seedbox for new files that need to be pulled down.

### Configuration

Before running you must setup a config.js file of your own in the root of the htpc folder. See [Config.ts](htpc/src/ts/Config.ts) for more information about the config settings.

#### Example:
```
// our base config derives from the default config object.
const config = require('./src/ts/Config').newConfig();

config.seedboxFtp = {
    host: "my.server",
    user: "someUserName",
    password: "PASSWORD",
    syncRoot: "/seedbox-sync/toUpload",
    pollingIntervalInSeconds: 10
};

// Default destination folder, if no path mappings found, this will be used.
config.localSyncFolder = "C:\\seedboxTest";

// optionally, you can setup path mappings to setup unique destination paths for specific remote paths
config.pathMappings =
    [
        {
            remotePath: "/seedbox-sync/toUpload/tv",
            localPath: "c:/seedbox/tv",
            type: "shows"
        },
        {
            remotePath: "/seedbox-sync/toUpload/movies",
            localPath: "d:/home-theater/movies",
            type: "movies"
        }
    ];

config.downloads = {
    countMax: 2,
    speedMax: 300000
};

config.port = 45532;

# This app will start deleting stuff from your FTP server. So set this to false when you're testing your config. But it should be set to true when you've confirmed everything is setup ok.
config.deleteRemoteFiles = true;

module.exports = config;
```

### How to run

#### Standard node start
Do this first to make sure that everything runs ok.
```bash
cd htpc

# Install required packages
npm install

# Start the app
npm start
```

#### As a service using pm2
This will run the app using pm2 allowing it to run in the background and on system startup.
```bash
# Install pm2 with typescript support
sudo npm install pm2 -g
sudo pm2 install typescript

# Have pm2 run at startup as the specified user
sudo pm2 startup -u nodeuser

# Start the app and save the config
pm2 start src/ts/bin/www.ts --name "seedbox-sync"
pm2 save
```
