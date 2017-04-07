import * as React from 'react'
import * as NotificationSystem from "react-notification-system"
import { EventEmitter } from 'fbemitter'

interface IUserNotificationsProps {

}

interface IUserNotificationsState {

}

/**
 * The JSX compnent to put in your view
 */
class UserNotificationContainer extends React.Component<IUserNotificationsProps, IUserNotificationsState> {

    private notificationSystem;

    private listenerSubscription;
    
    constructor(props) {
        super(props);

    }

    notificationListener(notification: UserNotification) {
        console.log('got notification', notification);

        this.notificationSystem.addNotification({
            title: notification.title,
            message: notification.message,
            uid: notification.uid,
            level: notification.level
        })
    }

    componentWillMount() {
        this.listenerSubscription = UserNotificationsController.instance().registerListener(this.notificationListener.bind(this));
    }

    componentWillUnmount() {
        this.listenerSubscription.remove();
    }

    render() {
        return <NotificationSystem ref={ns => this.notificationSystem = ns} />
    }
}

class UserNotificationsController {
    static readonly EVENT = 'notification';
    static _instance: UserNotificationsController;

    static instance() {
        if (!this._instance) {
            this._instance = new UserNotificationsController;
        }
        return this._instance;
    }

    private emitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

    post(notification: UserNotification) {
        this.emitter.emit(UserNotificationsController.EVENT, notification);
        console.log('post');
    }

    registerListener(listener) {
        console.log('register');
        return this.emitter.addListener(UserNotificationsController.EVENT, listener);
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