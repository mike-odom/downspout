import * as React from "react";
import * as ReactDOM from "react-dom";
//import { Router, IndexRoute, Route, browserHistory } from 'react-router';
var MyComponent = React.createClass({
    render: function () {
        return (React.createElement("div", null,
            React.createElement("h1", null, "asdf"),
            React.createElement("button", null)));
    }
});
ReactDOM.render(React.createElement(MyComponent, null), document.getElementById('app-container'));
