# SeedboxSync

## Configuration

Before running you must setup a config.js file of your own in the root of the htpc folder. See [Config.ts](htpc/src/ts/Config.ts) for more information about the config settings.

### Example:
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

config.deleteRemoteFiles = true;

module.exports = config;
```

## How to run

### Standard node
```
npm install
npm start
```

### As a service using pm2
This will run the app using pm2 allowing it to run in the background and on system startup.
```bash
# Install pm2 with typescript support
sudo npm install pm2 -g
sudo pm2 install typescript
sudo pm2 startup -u nodeuser

# Start the app and save the config
pm2 start src/ts/bin/www.ts --name "seedbox-sync"
pm2 save
```
