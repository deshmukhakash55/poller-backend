const express = require('express');

const reportController = require('../controllers/reportController');

const router = express.Router();

router.post('/report-poll', reportController.reportPoll);

module.exports = router;
