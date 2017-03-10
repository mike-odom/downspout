# SeedboxSync

## Configuration

Before running you must setup a config.js file of your own in the root of the htpc folder. See [Config.ts](htpc/src/ts/Config.ts) for more information about the config settings.

### Example:
```
# our base config derives from the default config object. 
const config = require('./src/ts/Config').newConfig();

config.seedboxFtp = {
    host: "my.server",
    user: "someUserName",
    password: "PASSWORD",
    syncRoot: "/seedbox-sync/toUpload",
    pollingIntervalInSeconds: 10
};

config.localSyncFolder = "C:\\seedboxTest";

config.downloads = {
    countMax: 2,
    speedMax: 300000
};

config.deleteRemoteFiles = true;

module.exports = config;
```

## How to run

Standard node
```
npm install
npm start
```
