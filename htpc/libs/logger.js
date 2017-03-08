var winston = require('winston');

/**
 * @class logTemplate
 */
var logTemplate = function() {
    this.info = function() {
        
    }
};

/**
 * @constructor
 * @extends logTemplate
 */
var logger = new (winston.Logger)({
    transports: [
        new winston.transports.File(
            {
                filename: 'all-logs.log',
                timestamp: true,
                maxsize: 1000000,
                handleExceptions: true}),
        new winston.transports.Console(
            {
                level: 'debug',
                colorize: true,
                timestamp: true,
                handleExceptions: true
            })
    ],
    exitOnError: false, // <--- set this to false
});

module.exports = logger;
