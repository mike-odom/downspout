function FtpFile(basePath, relativePath, ftpData) {
    this._basePath = basePath;
    this._relativePath = relativePath;
    this._data = ftpData;

    //TODO: Convert this to a timestamp? Maybe.
    this._timestamp = ftpData.time;

    Object.defineProperty(this, 'name', { value: this._data.name });

    //TODO: Change this to relativeDirectory
    Object.defineProperty(this, 'fullRelativePath', { value: FtpFile.appendSlash(this._relativePath) });
    Object.defineProperty(this, 'timestamp', { value: this._timestamp });
    Object.defineProperty(this, 'fullPath', {
        value: (this._data.hasOwnProperty("target")) ?
            //Use target if it's a symlink
            FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.target
            : FtpFile.appendSlash(this._basePath) + FtpFile.appendSlash(this._relativePath) + this._data.name
    });
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