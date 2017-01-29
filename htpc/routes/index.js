var express = require('express');
var router = express.Router();

var downloader = require('../libs/downloader');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });

    //downloader.syncRequest(result);
});

module.exports = router;
