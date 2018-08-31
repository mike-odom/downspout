import * as io from 'socket.io-client';

import {UserNotification, UserNotificationsController} from "./UserNotifications";
import { EventEmitter } from 'fbemitter'
import {DownloadModel} from "../../../shared/models/DownloadModel";
import {BaseModel} from "../../../shared/models/BaseModel";
import {NetworkEvent} from "../../../shared/NetworkConstants";

const API_CALLBACK = '/status/ui';

const SEEDBOX_CALLBACK = '/seedboxCallback';

class NetworkController {
    private static _instance;

    public static instance() {
        if (!NetworkController._instance) {
            NetworkController._instance = new NetworkController();
        }
        return NetworkController._instance;
    }

    private socket;

    private timer;

    private timeoutNotification: UserNotification;

    private emitter: EventEmitter = new EventEmitter();

    private dataTransformers = [];

    private constructor() {
        this.socket = io.connect(location.protocol + '//' + window.location.host);

        this.setupNetworkMessages();

        this.setupDataTransformers();
    }

    private setupNetworkMessages() {
        this.addNetworkNotification('connected', 'Socket connected');

        //TOOD: Make these stay on the screen and dismiss when appropriate.
        this.addNetworkNotification('disconnected', 'Socket disconnected');
        this.addNetworkNotification('connect_error', 'Socket connect error', UserNotification.LEVELS.error);
        this.addNetworkNotification('connect_timeout', 'Socket connect timeout', UserNotification.LEVELS.error);
        this.addNetworkNotification('error', 'Socket error', UserNotification.LEVELS.error);
        this.addNetworkNotification('reconnecting', 'Socket reconnecting');
    }

    public addListener(event: NetworkEvent, callback) {
        const self = this;

        const eventName = event.name();

        //Setup the socket listener if we don't have one already.
        if (!this.emitter.listeners(eventName).length) {
            this.socket.on(eventName, (data) => {
                console.log("transforming data", event, data);

                //Transform our object before sending it off if we have a data transformer
                if (typeof self.dataTransformers[eventName] !== 'undefined') {
                    data = self.dataTransformers[eventName](data)
                }
                this.emitter.emit(eventName, data);
            });
        }

        this.emitter.addListener(eventName, callback);
    }

    private setupDataTransformers() {
        //TODO: Find some better way to generically process JSON than this copy and paste.

        this.addDataTransformer(NetworkEvent.NOTIFICATIONS, function(data) {
            let notifications = BaseModel.fromJsonArray(data, UserNotification.create);

            console.log("transformed notifications", notifications);
            return notifications;
        });

        this.addDataTransformer(NetworkEvent.DOWNLOADS, function(data) {
            return BaseModel.fromJsonArray(data, DownloadModel.create);
        });
    }

    private addDataTransformer(event: NetworkEvent, callback) {
        const eventName = event.name();

        this.dataTransformers[eventName] = callback;
    }

    private addNetworkNotification(event, message, level = UserNotification.LEVELS.info) {
        this.socket.on('event', function() {
            this.timeoutNotification = new UserNotification(message)
                .setUid("network_" + event)
                .setLevel(level)
                .show();
        });
    }

    private showTimeout() {
        this.timeoutNotification = new UserNotification("No response from server")
            .setUid("no response")
            .setLevel(UserNotification.LEVELS.error)
            .setSticksAround(true)
            .show();
    }

    private clearTimeout() {
        if (this.timeoutNotification) {
            this.timeoutNotification.remove();
            this.timeoutNotification = null;
        }
    }

    requestScan() {
        let notification = new UserNotification("Requesting scan").show();

        fetch(SEEDBOX_CALLBACK).catch().then(() => notification.remove());
    }

    
}

export { NetworkController }