import express = require('express');
const router = express.Router();

const downloader = require('../libs/Downloader');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });

    //downloader.syncRequest(result);
});

module.exports = router;
