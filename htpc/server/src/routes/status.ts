import express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('status', { title: 'SeedboxSync Status Page' });
});

module.exports = router;
