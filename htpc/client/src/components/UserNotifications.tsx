import * as React from 'react'
import * as NotificationSystem from "react-notification-system"
import { EventEmitter } from 'fbemitter'

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
            level: notification.level
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
        var controller = UserNotificationsController.instance();

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
            this._instance = new UserNotificationsController;
        }
        return this._instance;
    }

    private eventEmitter: EventEmitter = new EventEmitter();

    post(notification: UserNotification) {
        console.log('post UserNotification');
        this.eventEmitter.emit(EVENTS.notification, notification);
    }

    clear(key) {
        console.log('clear UserNotification');
        this.eventEmitter.emit(EVENTS.clearAll, key);
    }

    clearAll() {
        console.log('clearAll UserNotification');
        this.eventEmitter.emit(EVENTS.clearAll);
    }

    addListener(event, listener) {
        console.log('addListener', event);
        return this.eventEmitter.addListener(event, listener);
    }
}

class UserNotification {
    public title;
    public message;
    public uid;
    public level = UserNotification.LEVELS.info;

    static readonly LEVELS = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    constructor(message) {
        this.message = message;
    }

    show() {
        UserNotificationsController.instance().post(this);

        return this;
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



}

export { UserNotificationContainer, UserNotificationsController, UserNotification }