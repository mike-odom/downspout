import * as React from 'react'
import * as NotificationSystem from 'react-notification-system'
import { EventEmitter } from 'fbemitter'
import {NetworkController} from "./NetworkController";
import {UserNotificationModel} from "../../../shared/models/UserNotificationModel";
import {NetworkEvent} from "../../../shared/NetworkConstants";

const EVENTS = {
    notification: "notification",
    removeNotification: "removeNotification",
    clearAll: "clearAll"
};

interface IUserNotificationsProps {

}

interface IUserNotificationsState {

}

/**
 * The JSX compnent to put in your view
 */
class UserNotificationContainer extends React.Component<IUserNotificationsProps, IUserNotificationsState> {

    private notificationSystem;

    private listenerSubscriptions: any[] = [];
    
    constructor(props) {
        super(props);

    }

    private onNotification(notification: UserNotification) {
        console.log('got notification', notification);

        this.notificationSystem.addNotification({
            title: notification.title,
            message: notification.message,
            uid: notification.uid,
            level: notification.level,
            autoDismiss: notification.sticksAround ? 0 : 5, //Stay on screen for X seconds
            dismissible: !notification.sticksAround
        })
    }

    private onRemoveNotification(key) {
        this.notificationSystem.removeNotification(key);
    }

    private onClearAll() {
        this.notificationSystem.clearNotifications();
    }

    componentWillMount() {
        var controller = UserNotificationsController.instance();

        this.listenerSubscriptions.push(controller.addListener(EVENTS.notification, this.onNotification.bind(this)));
        this.listenerSubscriptions.push(controller.addListener(EVENTS.removeNotification, this.onRemoveNotification.bind(this)));
        this.listenerSubscriptions.push(controller.addListener(EVENTS.clearAll, this.onClearAll.bind(this)));
    }

    componentWillUnmount() {
        this.listenerSubscriptions.forEach(function (subscription) {
            subscription.remove();
        })
    }

    render() {
        return <NotificationSystem ref={ns => this.notificationSystem = ns} />
    }
}

class UserNotificationsController {
    static _instance: UserNotificationsController;

    static instance() {
        if (!this._instance) {
            this._instance = new UserNotificationsController();
        }
        return this._instance;
    }

    private eventEmitter: EventEmitter = new EventEmitter();

    private constructor() {
        NetworkController.instance().addListener(NetworkEvent.NOTIFICATIONS, this.onNetworkNotifications.bind(this));
    }

    onNetworkNotifications(notifications: UserNotification[]) {
        console.log('got notifications', notifications);
        
        notifications.forEach(notification => notification.show());
    }

    post(notification: UserNotification) {
        console.log('post UserNotification');
        this.eventEmitter.emit(EVENTS.notification, notification);
    }

    remove(key: UserNotification | string) {
        this.eventEmitter.emit(EVENTS.removeNotification, key);
    }

    clearAll() {
        this.eventEmitter.emit(EVENTS.clearAll);
    }

    addListener(event, listener) {
        return this.eventEmitter.addListener(event, listener);
    }
}

class UserNotification extends UserNotificationModel {
    public sticksAround: boolean;
    public level = UserNotification.LEVELS.info;

    static readonly LEVELS = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    constructor(message?: string) {
        super();

        this.message = message;
    }

    show() {
        UserNotificationsController.instance().post(this);

        return this;
    }

    remove() {
        UserNotificationsController.instance().remove(this);
    }

    setUid(uid) {
        this.uid = uid;
        return this;
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }

    setLevel(level) {
        this.level = level;
        return this;
    }

    setSticksAround(sticksAround) {
        this.sticksAround = sticksAround;
        return this;
    }

    static create() {
        return new UserNotification();
    }
}

export { UserNotificationContainer, UserNotificationsController, UserNotification }