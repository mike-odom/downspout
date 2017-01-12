const express = require('express');
const router = express.Router();

const downloader = require('../libs/downloader');

/* GET home page. */
router.get('/', function (request, result, next) {
    result.render('status', { title: 'SeedboxSync Status Page' });
});

router.get('/ui', function (request, result, next) {
    result.json(downloader.status());
});

module.exports = router;
