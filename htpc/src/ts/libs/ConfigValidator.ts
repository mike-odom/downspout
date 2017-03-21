import winston = require('winston');
const logger : winston.LoggerInstance = require('./logger');

/**
 * Validates our user's config settings and errors if necessary.
 *
 * Separated from the Config class so the Config class can be more readable by the user.
 */
class ConfigValidator {

    /**
     * Validate a config.
     *
     * @param config
     * @returns {boolean} True if success, false if failure. App should not continue if false.
     */
    public validate(config: Config) {
        if (!this.fixPathMappings(config)) {
            return false;
        }


        return true;
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
                    logger.error("config.pathMapping.remotePath not set to relative path.\n"
                                    + pathMapping.remotePath + " must exist in your config.seedboxFtp.syncRoot: " + config.seedboxFtp.syncRoot);
                    return false;
                }
            }
        }
        
        return true;
    }

}

module.exports = new ConfigValidator();