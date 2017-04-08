import * as React from 'react'
import {DownloadItem} from "./DownloadItem";
import {UserNotification} from "./UserNotifications";

const jsonAPI = '/status/ui';

interface IDownloadItemListProps {

}
interface IDownloadItemListState {
    stats: any;
    downloads: any[]
}

class DownloadItemList extends React.Component<IDownloadItemListProps, IDownloadItemListState> {
    private timer;

    private timeoutNotification: UserNotification;

    constructor(props: IDownloadItemListProps) {
        super(props);

        this.state = {
            downloads: [],
            stats: []
        }
    }

    render() {
        console.log('rendering', this.state);
        let items = Array();

        for (let download of this.state.downloads) {
            let item = <DownloadItem download={download} key={download.key}/>;

            items.push(item);
        }
        return <div className="downloads">{items}</div>
    }

    componentDidMount() {
        this.updateData();
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    updateData() {
        let self = this;

        console.log('updateData');

        fetch(jsonAPI)
            .then(function (response) {
                console.log('got response', response);
                var json = response.json().then(function(json){
                    console.log('got json', json);
                    self.setState({
                        stats: json["stats"],
                        downloads: json["downloads"]
                    });
                });

                new UserNotification("got response").show();
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

export { DownloadItemList }