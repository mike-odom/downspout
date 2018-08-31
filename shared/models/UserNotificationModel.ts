import {BaseModel} from "./BaseModel";
const UUID = require('uuid/v1');

class UserNotificationModel extends BaseModel {
    public title;
    public message;
    public uid;

    public postedTime;

    constructor (message?: string) {
        super();

        this.message = message;

        this.uid = UUID();
    }

    static create(): UserNotificationModel {
        return new UserNotificationModel();
    }
}

export { UserNotificationModel }