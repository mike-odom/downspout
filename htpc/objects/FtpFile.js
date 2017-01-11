function FtpFile(path, ftpData) {
    this._path = path;
    this._data = ftpData;

    //TODO: Convert this to a timestamp? Maybe.
    this._timestamp = ftpData.time;

    Object.defineProperty(this, 'name', { value: this._data.name });
    Object.defineProperty(this, 'path', { value: this._path });
    Object.defineProperty(this, 'timestamp', { value: this._timestamp });
    Object.defineProperty(this, 'fullPath', { value: FtpFile.appendSlash(this._path) + this._data.name});
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
    if (path.charAt(path.length -1) == '/') return path;
    return path + '/';
};

module.exports = FtpFile;