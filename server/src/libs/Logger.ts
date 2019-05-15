import * as winston from "winston";

const logger : winston.Logger = winston.createLogger({
    transports: [
        new winston.transports.File(
            {
                filename: 'downspout.log',
                level: 'debug',
                maxsize: 1000000,
                maxFiles: 5,
                tailable: true,
                handleExceptions: true,
            }),
        new winston.transports.Console(
            {
                level: 'debug',
                handleExceptions: true,
            })
    ]
});

export default logger;