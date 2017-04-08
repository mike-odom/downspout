import { UserNotification } from "./UserNotifications";
import { EventEmitter } from 'fbemitter'

const API_CALLBACK = '/status/ui';

class NetworkController {
    static readonly NetworkEvents = {
        downloads: "downloads",
        stats: "stats",
        notifications: "notifications"
    };

    private static _instance = new NetworkController();

    public static instance() {
        return NetworkController._instance;
    }
    
    private timer;

    private timeoutNotification: UserNotification;

    private emitter: EventEmitter = new EventEmitter();

    constructor() {
        this.updateData();
    }

    public registerListener(event, callback) {
        this.emitter.addListener(event, callback);
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
                console.log('got response', response);
                var json = response.json().then(function(json){
                    console.log('got json', json);

                    for (let key in json) {
                        if (!json.hasOwnProperty(key)) {
                            continue;
                        }

                        self.emitter.emit(key, json[key]);
                    }
                });

                self.clearTimeout();
            })
            .catch(function (error) {
                console.log(error);

                self.showTimeout();
            })
            .then(function() {
                console.log('timer set');
                self.timer = setTimeout(self.updateData.bind(self), 1000);
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