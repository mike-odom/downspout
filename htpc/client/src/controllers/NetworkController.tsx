import { UserNotification } from "./UserNotifications";
import { EventEmitter } from 'fbemitter'
import {DownloadItem} from "../components/DownloadItem";
import {DownloadModel} from "../../../shared/models/DownloadModel";
import {BaseModel} from "../../../shared/models/BaseModel";

const API_CALLBACK = '/status/ui';

class NetworkController {
    static readonly NetworkEvents = {
        downloads: "downloads",
        stats: "stats",
        notifications: "notifications"
    };

    private static _instance;

    public static instance() {
        if (!NetworkController._instance) {
            NetworkController._instance = new NetworkController();
        }
        return NetworkController._instance;
    }
    
    private timer;

    private timeoutNotification: UserNotification;

    private emitter: EventEmitter = new EventEmitter();

    private dataTransformers = [];

    private constructor() {
        this.updateData();
        this.setupDataTransformers();
    }

    public addListener(event, callback) {
        this.emitter.addListener(event, callback);
    }

    private setupDataTransformers() {
        //TODO: Find some better way to generically process JSON than this copy and paste.

        this.addDataTransformer(NetworkController.NetworkEvents.notifications, function(data) {
            let notifications = BaseModel.fromJsonArray(data, UserNotification.create);

            console.log("transformed notifications", notifications);
            return notifications;
        });

        this.addDataTransformer(NetworkController.NetworkEvents.downloads, function(data) {
            return BaseModel.fromJsonArray(data, DownloadModel.create);
        });
    }

    private addDataTransformer(event: string, callback) {
        this.dataTransformers[event] = callback;
    }

    private getEventKeysToRequest() {
        //This feels hacky since I'm using an emitter library but I want to know what is being listened for so I can make good requests.
        var result = [];
        for (var event in NetworkController.NetworkEvents) {
            console.log('event', event, this.emitter.listeners(event));
            if (this.emitter.listeners(event).length) {
                result.push(event);
            }
        }

        return result;
    }

    updateData() {
        let self = this;



        let url = API_CALLBACK + "?"
            + "requestEvents=" + this.getEventKeysToRequest().join(',');

        console.log('updateData', url);
        
        fetch(url)
            .then(function (response) {

                var json = response.json().then(function(json){
                    console.log('got response', json);
                    
                    for (let key in json) {
                        if (!json.hasOwnProperty(key)) {
                            continue;
                        }
                        let data = json[key];

                        console.log("data", key, data);
                        
                        if (typeof self.dataTransformers[key] !== 'undefined') {
                            data = self.dataTransformers[key](data)
                        }
                        self.emitter.emit(key, data);
                    }
                });

                self.clearTimeout();
            })
            .catch(function (error) {
                console.log(error);

                self.showTimeout();
            })
            .then(function() {
                self.timer = setTimeout(self.updateData.bind(self), 3000);
            })
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

    
}

export { NetworkController }