import express = require('express');
import bodyParser = require('body-parser');

const router = express.Router();

const syncController = require('../libs/SyncController');

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

    syncController.syncRequest();
});

/**
 * Debug URL so I can curl this
 */
router.get('/', function (req, res) {
    res.json([]);

    syncController.syncRequest();
});

module.exports = router;
