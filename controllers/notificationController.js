const Notification = require('../models/notification');

exports.getNotifications = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const { truncatedNotification } = await getNotificationsAndDetailsFor(
			userId
		);
		res.status(200).json({
			notifications: truncatedNotification
		});
	} catch (error) {
		res.status(500).json({ message: 'Error loading unread notifications' });
	}
};

const getNotificationsAndDetailsFor = async (userId) => {
	const notificationDocuments = await Notification.find({
		receiver: userId,
		isRead: false
	}).sort({ createdAt: -1 });
	const notifications = notificationDocuments.map(mapToNotification);
	const truncatedNotification = notifications.slice(0, 5);
	return { truncatedNotification };
};

const mapToNotification = (notificationDocument) => ({
	message: notificationDocument.message,
	isRead: notificationDocument.isRead,
	createdDate: notificationDocument.createdAt
});

exports.readAllNotifications = async (req, res, next) => {
	try {
		const { userId } = req.body;
		await Notification.updateMany(
			{
				receiver: userId,
				isRead: false
			},
			{ isRead: true }
		);
		const { truncatedNotification } = await getNotificationsAndDetailsFor(
			userId
		);
		res.status(200).json({
			notifications: truncatedNotification
		});
	} catch (error) {
		res.status(500).json({ message: 'Error reading all notifications' });
	}
};

exports.getAllNotifications = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const allNotificationDocuments = await Notification.find({
			receiver: userId
		});
		const allNotifications = allNotificationDocuments.map(
			mapToNotification
		);
		res.status(200).json({ allNotifications });
	} catch (error) {
		res.status(500).json({ message: 'Error getting all notifications' });
	}
};
