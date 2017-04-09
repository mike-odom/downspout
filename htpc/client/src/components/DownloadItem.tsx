import * as React from 'react';
import {ProgressBar} from "./ProgressBar";
import {DownloadModel} from "../../../shared/models/DownloadModel";

interface IDownloadItemProps {
    download: DownloadModel;
}

interface IDownloadItemState {

}

class DownloadItem extends React.Component<IDownloadItemProps, IDownloadItemState> {
    render() {
        var download = this.props.download;
        
        return (
            <div className="item">
                <header>{download.path}/{download.filename}</header>
                <div className="transferInfo">
                    <ProgressBar download={download} />
                </div>
                <div className="itemInfo">
                    <div className="source">
                        from: {download.sourceRoot}
                    </div>
                    <div className="dest">
                        to: {download.destRoot}
                    </div>
                    {download.dateAdded}
                    {download.key}
                </div>
            </div>
        );
    }
}

export { DownloadItem };