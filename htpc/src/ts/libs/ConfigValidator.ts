import winston = require('winston');
const logger : winston.LoggerInstance = require('./logger');

import fs = require('fs');

/**
 * Loads and validates our user's config settings and errors if necessary.
 *
 * Separated from the Config class so the Config class can be more readable by the user.
 */
class ConfigValidator {
    private validations = [
        this.validateFtpConfig,
        this.fixPathMappings,
        this.validatePort
    ];

    /**
     * Validates our config
     *
     * @returns {boolean} True if success, false if failure. App should not continue if false.
     */
    public loadConfig(config: Config) {
        //Config file is found at root of app at runtime.
        if (!fs.existsSync('config.js')) {
            configValidator.quitApp("Config file was not found");
        }

        // Read and eval our user's config file
        const configFile = fs.readFileSync('config.js','utf8');

        eval(configFile);

        for (let func of this.validations) {
            func(config);
        }

        return true;
    }

    public quitApp(message) {
        logger.error(message);
        logger.error("The config file did not validate. Please check your config.js file to continue.");

        process.exit(1);
    }

    private validateFtpConfig(config: Config) {
        if (!config.seedboxFtp) {
            this.quitApp("Please setup your config.seedboxFtp");
        }

        if (!config.seedboxFtp.host) {
            this.quitApp("Please setup config.seedboxFtp.host");
        }
    }

    private fixPathMappings(config: Config) {
        //Make any absolute paths into relative paths of the root.
        let pathMapping : PathMapping;
        for (pathMapping of config.pathMappings) {
            //Absolute path. Try to fix.
            if (pathMapping.remotePath[0] == '/') {

                if (pathMapping.remotePath.indexOf(config.seedboxFtp.syncRoot) == 0) {
                    pathMapping.remotePath = pathMapping.remotePath.substring(config.seedboxFtp.syncRoot.length);
                } else {
                    this.quitApp("config.pathMapping.remotePath not set to relative path.\n"
                                    + pathMapping.remotePath + " must exist in your config.seedboxFtp.syncRoot: " + config.seedboxFtp.syncRoot);
                }
            }
        }
        
        return true;
    }

    private validatePort(config: Config) {
        if (config.port < 1 || config.port > 65535) {
            this.quitApp("Please enter a valid port");
        }
    }

}

module.exports = new ConfigValidator();