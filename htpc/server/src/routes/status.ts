import express = require('express');
const router = express.Router();

const downloader = require('../libs/SyncController');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('status', { title: 'SeedboxSync Status Page' });
});

router.get('/status/ui', function (req, res, next) {
    res.json(downloader.status());
});

module.exports = router;
