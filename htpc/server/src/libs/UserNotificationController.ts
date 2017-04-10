import {UserNotificationModel} from "../../../shared/models/UserNotificationModel";

class UserNotificationController {
    static readonly notificationTTL = 6000;

    static _instance;

    static getInstance() {
        if (!this._instance) {
            this._instance = new UserNotificationController();
        }

        return this._instance;
    }

    notifications: UserNotificationModel[] = [];

    getNotifications() {
        this.clearOldNotifications();

        return this.notifications;
    }

    clearOldNotifications() {
        this.notifications = this.notifications.filter(function (notification) {
            return notification.postedTime > Date.now() + UserNotificationController.notificationTTL;
        });
    }

    postNotification(notification: UserNotificationModel) {
        this.clearOldNotifications();

        notification.postedTime = Date.now();

        this.notifications.push(notification);
    }
}

export { UserNotificationController }