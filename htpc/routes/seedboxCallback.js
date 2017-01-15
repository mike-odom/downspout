const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

const downloader = require('../libs/downloader');

/* GET home page. */
router.post('/', bodyParser.json(), function (req, res, next) {
    //downloader.seedboxCallback();

    res.json(req.body);
    //res.send("Sync initiated");

    downloader.sync();

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
});

module.exports = router;
