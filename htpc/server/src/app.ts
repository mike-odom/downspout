import winston = require('winston');
const logger : winston.LoggerInstance = require('./libs/Logger');

const appConfig = require('./Config');

import express = require('express');

const exphbs = require('express-handlebars');
const path = require('path');

const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();

var webpack = require('webpack');

//This feels ghetto, it's because we're deep into the build folders.
const clientRoot = "../../../../client/";

var webpackConfig = require(path.join(clientRoot, 'webpack.config.js'));

//working
//var webpackConfig = require('../../../../client/webpack.config.js');

const users = require('./routes/users');
const seedboxCallback = require('./routes/seedboxCallback');
const status = require('./routes/status');

if ("testFtpServer" in appConfig) {
    const ftpd = require('ftpd');

    //override our settings if the test server is going to be up
    appConfig.seedboxFtp.host = "127.0.0.1";
    appConfig.seedboxFtp.user = appConfig.testFtpServer.user;
    appConfig.seedboxFtp.password = appConfig.testFtpServer.password;

    // // Path to your FTP root
    // ftpd.fsOptions.root = config.testFtpServer.root;
    //
    // // Start listening on port 21 (you need to be root for ports < 1024)
    // ftpd.listen(21);

    const server = new ftpd.FtpServer("127.0.0.1", {
        getInitialCwd: function () {
            return '/';
        },
        getRoot: function () {
            return process.cwd() + "\\" + appConfig.testFtpServer.localRoot;
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

const downloader = require('./libs/SyncController');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, clientRoot, 'public', 'favicon.ico')));

// Log all HTTP traffic. Disabled as this gets to be too much with the polling.
//app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, clientRoot, 'public')));

app.use('/', status);
app.use('/users', users);
app.use('/seedboxCallback', seedboxCallback);

var compiler = webpack(webpackConfig);

app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
}));

// app.get('/css/bootstrap.min.css', function (req, res) {
//     res.sendFile(path.join(__dirname, '../../dist/css/bootstrap.min.css'));
// });

// app.get('*', function (req, res) {
//     res.sendFile(path.join(__dirname, '../../dist/index.html'));
// });

class HttpError extends Error {
    status: number;

    constructor(message, status) {
        super(message);
        this.message = message;
        this.name = 'HttpError';
        this.status = status;
    }
}

app.use('/favicon.ico', function(req, res) {
   res.status(404).end();
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new HttpError('Not Found - ' + req.url, 404);

    logger.error(err.message);
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    logger.error(err);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//Do an automatic sync request on launch.
downloader.syncRequest();

module.exports = app;