var express = require('express');
var router = express.Router();

var downloader = require('../libs/downloader');

/* GET home page. */
router.get('/', function (request, result, next) {
    //res.render('index', { title: 'Express' });

    //downloader.sync(result);
});

module.exports = router;
