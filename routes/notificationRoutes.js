const express = require('express');

const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/get-notifications', notificationController.getNotifications);

router.post(
	'/read-all-notifications',
	notificationController.readAllNotifications
);

router.get(
	'/get-all-notifications',
	notificationController.getAllNotifications
);

module.exports = router;
