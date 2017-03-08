"use strict";

const logger = require('./libs/logger');

import express = require('express');

//import * as express from 'express';

const exphbs = require('express-handlebars');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();

const config = require('./../../config');

const index = require('./routes/index');
const users = require('./routes/users');
const seedboxCallback = require('./routes/seedboxCallback');
const status = require('./routes/status');

if ("testFtpServer" in config) {
    const ftpd = require('ftpd');

    //override our settings if the test server is going to be up
    config.seedboxFTP.host = "127.0.0.1";
    config.seedboxFTP.user = config.testFtpServer.user;
    config.seedboxFTP.password = config.testFtpServer.password;

    // // Path to your FTP root
    // ftpd.fsOptions.root = config.testFtpServer.root;
    //
    // // Start listening on port 21 (you need to be root for ports < 1024)
    // ftpd.listen(21);

    var server = new ftpd.FtpServer("127.0.0.1", {
        getInitialCwd: function () {
            return '/';
        },
        getRoot: function () {
            return process.cwd() + "\\" + config.testFtpServer.localRoot;
        }
    });

    server.on('error', function(error) {
        logger.error('FTP Server error:', error);
    });

    server.on('client:connected', function(connection) {
        let username = null;
        logger.info('client connected: ' + connection.remoteAddress);
        connection.on('command:user', function(user, success, failure) {
            if (user) {
                username = user;
                success();
            } else {
                failure();
            }
        });

        connection.on('command:pass', function(pass, success, failure) {
            if (pass) {
                success(username);
            } else {
                failure();
            }
        });
    });

    server.debugging = 4;
    server.listen(21);
}

const downloader = require('./libs/downloader');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/seedboxCallback', seedboxCallback);
app.use('/status', status);


class HttpError extends Error {
    status: number;

    constructor(message, status) {
        super(message);
        this.message = message;
        this.name = 'HttpError';
        this.status = status;
    }
}
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new HttpError('Not Found', 404);
    
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.log(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//Ghetto for now, don't try to syncRequest if no password is setup yet.
if (config.seedboxFTP.password != "[Somepassword]") {
    downloader.syncRequest();
}

module.exports = app;
