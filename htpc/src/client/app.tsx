import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {DownloadItemList} from './Components/DownloadItemList';

//import { Router, IndexRoute, Route, browserHistory } from 'react-router';

var MyComponent = React.createClass({
    render: function () {
        return (
            <div>
                <h1>asdf</h1><button />
            </div>
        );
    }
});

ReactDOM.render(<DownloadItemList />,
    document.getElementById('app-container')
);