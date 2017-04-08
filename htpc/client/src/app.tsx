import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {DownloadItemList} from './components/DownloadItemList';
import {UserNotificationContainer} from "./controllers/UserNotifications";

var jsx = (
    <div>
        <DownloadItemList />
        <UserNotificationContainer />
    </div>
);

ReactDOM.render(jsx,
    document.getElementById('app-container')
);