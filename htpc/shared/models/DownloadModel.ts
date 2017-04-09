import {BaseModel} from "./BaseModel";

class DownloadModel extends BaseModel {
    public key;
    public path;
    public filename;
    public sourceRoot;
    public destRoot;
    public dateAdded;
    public downloaded;
    public size;
    public downloadRate;
    public status;

    static create(): DownloadModel {
        return new DownloadModel();
    }
}

export { DownloadModel }