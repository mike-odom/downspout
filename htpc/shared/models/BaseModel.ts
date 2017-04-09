import {DownloadModel} from "./DownloadModel";

class BaseModel {
    toJson() {
        return JSON.stringify(this);
    }

    static fromJsonArray(arr, constructorFunc) {
        let result = [];

        arr.forEach(function(data) {
            let obj = BaseModel.fromJson(data, constructorFunc);
            result.push(obj);
        });

        return result;
    }

    static fromJson(data, constructorFunc) {
        var obj = constructorFunc();

        Object.assign(obj, data);

        return obj;
    }

    test() {
        BaseModel.fromJsonArray("asdf", DownloadModel.fromJson);
    }
}

export { BaseModel }