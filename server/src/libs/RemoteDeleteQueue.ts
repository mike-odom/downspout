import * as winston from "winston";
import { Client as BasicFtpClient } from 'basic-ftp';
import {FtpFile} from "../objects/FtpFile";
import {FtpController} from "./FtpController";
import Timer = NodeJS.Timer;
import logger from "./Logger";
const _ = require("lodash");

export default class RemoteDeleteQueue {
    queue: FtpFile[] = [];
    processing: boolean = false;
    paused: boolean = false;
    delayTimeout: Timer = null;

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

        this.delayTimeout = setTimeout(() => {
            this.delayTimeout = null;
            this.process();
        }, 5000);
    }

    async process() {
        if (!this.queue.length || this.processing || this.paused) {
            return;
        }

        this.processing = true;

        let deleteFtpError = (err) => {
            logger.error('RemoteDeleteQueue: ', err);
            finished();
        };

        let finished = _.once(() => {
            // Restart this process to see if new items were added to the queue.
            this.processing = false;
            this.process();
        });

        let deleteFtp: BasicFtpClient;
        try {
            //Delete the symlink on the server
            deleteFtp = await FtpController.newJSFtp();
        } catch(err) {
            deleteFtpError(err);
            return;
        }


        let queue = this.queue;
        // Just clear our existing queue, another scan will pick them up if there were errors.
        this.queue = [];

        for (let file of queue) {
            try {
                await deleteFtp.remove(file.actualPath);
                logger.info("Deleted symlink: " + file.actualPath);
            } catch(err) {
                logger.error("Error deleting file: " + file.actualPath, err);
            }
        }

        logger.debug('deleteRemoteFile.process done');
                
        finished();
    }
}