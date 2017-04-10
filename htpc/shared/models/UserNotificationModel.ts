import {BaseModel} from "./BaseModel";

class UserNotificationModel extends BaseModel {
    public title;
    public message;
    public uid;

    public postedTime;

    constructor (message?: string) {
        super();

        this.message = message;
    }

    static create(): UserNotificationModel {
        return new UserNotificationModel();
    }
}

export { UserNotificationModel }