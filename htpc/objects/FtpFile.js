/**
 * @class
 *
 * @param basePath
 * @param relativePath
 * @param ftpData {FtpData}
 * @constructor
 */
function FtpFile(basePath, relativePath, ftpData) {
    const _basePath = basePath;
    const _relativePath = relativePath;
    const _data = ftpData;
    let _targetData;

    //TODO: Convert this to a timestamp? Maybe.
    this._timestamp = _data.time;

    Object.defineProperty(this, 'name', { value: _data.name });

    //TODO: Change this to relativeDirectory
    Object.defineProperty(this, 'fullRelativePath', { value: FtpFile.appendSlash(_relativePath) });
    Object.defineProperty(this, 'timestamp', { value: this._timestamp });
    Object.defineProperty(this, 'fullPath', {
        value: (_data.hasOwnProperty("target")) ?
            //Use target if it's a symlink
            FtpFile.appendSlash(_basePath) + FtpFile.appendSlash(_relativePath) + _data.target
            : FtpFile.appendSlash(_basePath) + FtpFile.appendSlash(_relativePath) + _data.name
    });

    Object.defineProperty(this, 'transferred', { writable: true, value: 0 } );

    Object.defineProperty(this, 'isSymLink', { value: _data.type == 2});

    Object.defineProperty(this, 'downloading', { value: false });

    this.setTargetData = function (data) {
        _targetData = data;
    };

    this.json = function () {
        console.log("target data", _data.name, _targetData ? _targetData.size : _data.size);
        return {
            "filename": _data.name,
            "source_root": "/home/odie/deluge-scripts/toUpload",
            "dest_root": "~/microverse/library/seedbox",
            "path": _relativePath,
            "size": _targetData ? _targetData.size : _data.size,
            "downloaded": this.transferred,
            "download_rate": this.transferred > 0 ? 56.3 : 0,
            "status": this.downloading > 0 ? "downloading" : "queued",
            "date_added": _data.time,
            "uid": "Some unique identifier string per row"
        }
    }
}

/**
 *
 * @param {FtpFile} a
 * @param {FtpFile} b
 */
FtpFile.sortNewestFirst = function (a, b) {
    if (a._timestamp > b._timestamp) {
        return -1;
    }

    if (a._timestamp < b._timestamp) {
        return 1;
    }

    return 0;
};

FtpFile.appendSlash = function(path) {
    if (!path.length) return "";

    if (path.charAt(path.length -1) == '/') return path;
    return path + '/';
};

module.exports = FtpFile;