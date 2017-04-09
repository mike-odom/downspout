class DownloadObject {
    public key;
    public path;
    public filename;
    public sourceRoot;
    public destRoot;
    public dateAdded;
    public downloaded;
    public size;
    public downloadRate;

    static fromJson(json): DownloadObject {
        var obj = new DownloadObject();

        for (let key in json) {
            if (!json.hasOwnProperty(key)) {
                continue;
            }

            obj[key] = json[key];
        }

        return obj;
    }

}

export { DownloadObject }