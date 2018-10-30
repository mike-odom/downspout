import * as winston from "winston";
const _ = require("lodash");

import {FtpFile} from "../objects/FtpFile";
const logger : winston.LoggerInstance = require('./Logger');
import {FtpController} from "./FtpController";

export default class RemoteDeleteQueue {
    queue: FtpFile[] = [];
    processing: boolean = false;
    paused: boolean = false;
    delayTimeout = 0;

    add(file: FtpFile) {
        if (!_.some(this.queue, otherFile => file.equals(otherFile))) {
            this.queue.push(file);
        }

        // Slight optimization, if a bunch of files all finish downloading withing a short period of time,
        // we want them to be put into the same queue.
        this.processWithDelay();
    }

    pause() {
        this.paused = true;
    }

    start() {
        this.paused = false;
        this.process();
    }

    // Delete operation has the lowest priority, we can wait a few seconds before kicking it off.
    // So we're not taking up valuable FTP connections and also allow files to queue up
    processWithDelay() {
        clearTimeout(this.delayTimeout);

        this.delayTimeout = window.setTimeout(() => {
            this.delayTimeout = 0;
            this.process();
        }, 5000);
    }

    process() {
        if (!this.queue.length || this.processing || this.paused) {
            return;
        }

        this.processing = true;

        let deleteFtpError = (err) => {
            logger.error('RemoteDeleteQueue:', err);
            finished();
        };

        let finished = _.once(() => {
            // Restart this process to see if new items were added to the queue.
            this.processing = false;
            this.process();
        });

        //Delete the symlink on the server
        let deleteFtp = FtpController.newJSFtp();
        deleteFtp.on('error', deleteFtpError);
        deleteFtp.on('timeout', deleteFtpError);

        let queue = this.queue;
        // Just clear our existing queue, another scan will pick them up if there were errors.
        this.queue = [];

        async.mapLimit(queue, 1,
            (file, iterDone) => {
                deleteFtp.raw("dele " + file.actualPath, function (err) {
                    if (err) {
                        logger.error("Error deleting file", file.actualPath, err);
                        iterDone(err);
                    } else {
                        logger.info("Deleted symlink", file.actualPath);
                        iterDone(null, file);
                    }
                });
            }, (err, results) => {
                logger.debug('deleteRemoteFile async.forEach done');

                finished();
            });
    }
}