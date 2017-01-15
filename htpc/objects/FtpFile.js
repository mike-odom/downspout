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

    Object.defineProperty(this, 'transferred', { writable: true } );

    this.json = function () {
        return {
            "filename": _data.name,
            "source_root": "/home/odie/deluge-scripts/toUpload",
            "dest_root": "~/microverse/library/seedbox",
            "path": _relativePath,
            "size": _data.size,
            "downloaded": this.transferred,
            "download_rate": this.transferred > 0 ? 56.3 : 0,
            "status": this.transferred > 0 ? "downloading" : "queued",
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