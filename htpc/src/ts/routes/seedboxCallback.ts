import express = require('express');
import bodyParser = require('body-parser');

const router = express.Router();

const downloader = require('../libs/Downloader');

/**
 * New download completed on the seedbox.
 * Parse info and start downloading process if not already running.
 */
router.post('/', bodyParser.json(), function (req, res, next) {
    /**
     req.body will be in the form of
     {
        "torrent": {
            "id": "1234",
            "name": "Small World.avi"),
            "relativeDir": "tv")
        }
    }
     */

    res.json(req.body);

    downloader.syncRequest();
});

/**
 * Debug URL so I can curl this
 */
router.get('/', function (req, res, next) {
    res.json([]);

    downloader.syncRequest();
});

module.exports = router;
