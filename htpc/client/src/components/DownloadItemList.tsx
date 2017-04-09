import * as React from 'react'
import {DownloadItem} from "./DownloadItem";
import {UserNotification} from "../controllers/UserNotifications";
import {NetworkController} from "../controllers/NetworkController";
import {DownloadModel} from "../../../shared/models/DownloadModel";

interface IDownloadItemListProps {

}
interface IDownloadItemListState {
    downloads: DownloadModel[]
}

class DownloadItemList extends React.Component<IDownloadItemListProps, IDownloadItemListState> {
    constructor(props: IDownloadItemListProps) {
        super(props);

        this.state = {
            downloads: []
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

    onDownloadList(downloads) {
        this.setState({
            downloads: downloads
        });
    }

    private networkEmitterSubscription;

    componentDidMount() {
        this.networkEmitterSubscription = NetworkController.instance().addListener(
            NetworkController.NetworkEvents.downloads,
            this.onDownloadList.bind(this)
        );
    }

    componentWillUnmount() {
        this.networkEmitterSubscription.remove();
    }


}

export { DownloadItemList }