import * as React from 'react';
import {DownloadObject} from "../models/DownloadObject";

const SIZES = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

interface IProgressBarProps {
    download: DownloadObject;
}

interface IProgressBarState {

}

class ProgressBar extends React.Component<IProgressBarProps, IProgressBarState> {
    render() {
        return (
            <div className="transferInfo">
                <div className="progressBar">
                    <div className="bar" style={{width: this.progress()}}>
                        <div className="progressPct">{this.progress()}</div>
                    </div>
                </div>
                <div className="transferProgress">{this.downloadedUnits()} / {this.sizeUnits()} - {this.speedUnits()}/s</div>
            </div>
        )
    }

    progress() {
        var pctDone = this.props.download.downloaded / this.props.download.size * 100;
        return pctDone.toFixed(2) + "%";
    }

    //I'm sorry for this, but scope is weird in Vue components, so I couldn't figure out how to do a utility function to handle the byte unit conversion. Also, I'm still learning Vue. Someday, this will be very embarassing.
    downloadedUnits() {
        var bytes = this.props.download.downloaded;
        if (bytes == 0) return '0 bytes';
        var k = 1000,
            dm = 1;

        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + SIZES[i];
    }

    sizeUnits() {
        var bytes = this.props.download.size;
        if (bytes == 0) return '0 bytes';
        var k = 1000,
            dm = 1;

        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + SIZES[i];
    }

    speedUnits() {
        var bytes = this.props.download.downloadRate;
        if (bytes == 0) return '0 bytes';
        var k = 1000,
            dm = 1;

        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + SIZES[i];
    }
}

export { ProgressBar };

