import { FileInfo as BasicFtpFileInfo } from 'basic-ftp';
import {DownloadModel} from "../../../shared/models/DownloadModel";
import moment = require("moment");
const pathPosix = require('path').posix;
const UUID = require('uuid/v1');

class FtpFile {

    private _basePath: string;
    private _relativePath: string;
    private _timestamp: number;

    private _destinationRoot: string;

    private _key: string;

    private _data: BasicFtpFileInfo;

    // If symlink
    private _targetData: BasicFtpFileInfo;

    private _transferred: number = 0;

    private _downloadRate: number = 0;

    private _downloading: boolean = false;

    get actualPath(): string {
        const path = FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.name;
        return pathPosix.normalize(path);
    }

    get relativeDirectory(): string {
        return FtpFile.appendSlash(this._relativePath);
    }

    get fullPath(): string {
        if (this._data.link) {
            if (this._data.link[0] == '/') {
                return this._data.link;
            }
            // symlink path
            const path = FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.link;
            return pathPosix.normalize(path);
        }
        return this.actualPath;
    }

    get destinationRoot(): string {
        return this._destinationRoot;
    }

    set destinationRoot(destinationRoot: string) {
        this._destinationRoot = destinationRoot;
    }

    get timestamp(): number {
        return this._timestamp;
    }
    
    get transferred(): number {
        return this._transferred;
    }

    set transferred(val: number) {
        this._transferred = val;
    }

    set downloadRate(val: number) {
        this._downloadRate = val;
    }

    get name(): string {
        return this._data.name;
    }

    get isSymLink(): boolean {
        return this._data.isSymbolicLink;
    }

    get downloading(): boolean {
        return this._downloading;
    }

    set downloading(val: boolean) {
        this._downloading = val;

    }

    get size(): number {
        return this._targetData ? this._targetData.size : this._data.size
    }

    set targetData(data) {
        this._targetData = data;
    }

    get targetData(): any {
        return this._targetData;
    }

    constructor(basePath, relativePath, ftpData) {
        this._basePath = basePath;
        this._relativePath = relativePath;
        this._data = ftpData;
        this._timestamp = this.parseUnixDate(this._data.date); 
        this._key = UUID();
    }

    parseUnixDate(dateStr) {
        // Unix should be one of these two formats:
        //  Jul 31  2017
        //  Apr  7 17:20 (If less than 6 months ago)
        let date;
        if (dateStr.includes(":")) {
            date = moment(dateStr, "MMM D hh:mm");

            var currentMonth = moment().month();
            var month = date.month();
            var year = moment().year() - (currentMonth < month ? 1 : 0);
            date.year(year);
        } else {
            date = moment(dateStr, "MMM D YYYY");
        }
        console.log("parseUnixDate", dateStr, date);
        return date.unix();
    }

    toModel() {
        //TODO: Finish this data structure.
        var model = new DownloadModel();
        model.filename = this._data.name;
        model.sourceRoot = this._basePath;
        model.destRoot = this._destinationRoot;
        model.path = this._relativePath;
        model.size = this.size;
        model.downloaded = this.transferred;
        model.downloadRate = this._downloadRate;
        model.status = this.downloading ? "downloading" : "queued";
        model.dateAdded = this._timestamp;
        model.key = this._key;

        return model;
    }

    public equals(otherFile: FtpFile) : boolean {
        return this.fullPath == otherFile.fullPath;
    }

    /**
     *
     * @param {FtpFile} a
     * @param {FtpFile} b
     */
    static sortNewestFirst = function (a, b) {
        if (a._timestamp > b._timestamp) {
            return -1;
        }

        if (a._timestamp < b._timestamp) {
            return 1;
        }

        return 0;
    };
    
    static appendSlash(path) {
        if (!path.length) return "";

        if (path.charAt(path.length - 1) == '/') return path;
        return path + '/';
    };
}

export { FtpFile }