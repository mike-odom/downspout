import {BaseModel} from "./BaseModel";

class UserNotificationModel extends BaseModel {
    public title;
    public message;
    public uid;

    static create(): UserNotificationModel {
        return new UserNotificationModel();
    }
}

export { UserNotificationModel }