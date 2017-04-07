const UUID = require('uuid/v1');

class FtpFile {
    public static FTP_TYPE_FILE = 0;
    public static FTP_TYPE_DIRECTORY = 1;
    public static FTP_TYPE_SYM_LINK = 2;

    private _basePath: string;
    private _relativePath: string;
    private _timestamp: number;

    private _destinationRoot: string;

    private _key: string;

    /** @type FtpData */
    private _data: any;

    /** @type FtpData */
    private _targetData: any;

    private _transferred: number = 0;

    private _downloading: boolean = false;

    get directory(): string {
        return FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath)
    }

    get actualPath(): string {
        return FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.name;
    }

    get relativeDirectory(): string {
        return FtpFile.appendSlash(this._relativePath);
    }

    get fullPath(): string {
        return (this._data.hasOwnProperty("target")) ?
            //Use target if it's a symlink
            FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.target
            : this.actualPath
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

    get name(): string {
        return this._data.name;
    }

    get isSymLink(): boolean {
        return this._data.type == 2;
    }

    get downloading(): boolean {
        return this._downloading;
    }

    set downloading(val: boolean) {
        this._downloading = val;

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
        this._timestamp = this._data.time;
        this._key = UUID();
    }

    json() {
        //TODO: Finish this data structure.
        return {
            "filename": this._data.name,
            "source_root": this._basePath,
            "dest_root": this._destinationRoot,
            "path": this._relativePath,
            "size": this._targetData ? this._targetData.size : this._data.size,
            "downloaded": this.transferred,
            //TODO: Calculate the actual speed
            "download_rate": this.transferred > 0 ? 1.21 : 0,
            "status": this.downloading ? "downloading" : "queued",
            "date_added": this._data.time,
            "key": this._key,
        }
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

module.exports = FtpFile;