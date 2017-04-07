import * as React from 'react';
import {ProgressBar} from "./ProgressBar";

interface IDownloadItemProps {
    download: any;
}

interface IDownloadItemState {

}

class DownloadItem extends React.Component<IDownloadItemProps, IDownloadItemState> {
    render() {
        var download = this.props.download;

        console.log(download.key);
        return (
            <div className="item">
                <header>{download.path}/{download.filename}</header>
                <div className="transferInfo">
                    <ProgressBar download={download} />
                </div>
                <div className="itemInfo">
                    <div className="source">
                        from: {download.source_root}
                    </div>
                    <div className="dest">
                        to: {download.dest_root}
                    </div>
                    {download.date_added}
                    {download.key}
                </div>
            </div>
        );
    }
}

export { DownloadItem };