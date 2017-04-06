var React = require('react');
var ReactDOM = require('react-dom');

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

ReactDOM.render(<MyComponent />,
    document.getElementById('app-container')
);