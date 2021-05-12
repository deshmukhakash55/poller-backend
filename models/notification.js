const mongoose = require('mongoose');

const Connection = require('../models/connection');
const { getSocketFor } = require('../socketio');

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
	{
		message: {
			type: String,
			required: true
		},
		isRead: {
			type: Boolean,
			required: true,
			default: false
		},
		receiver: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

notificationSchema.post('save', { document: true }, async function (document) {
	const socket = getSocketFor(document.receiver._id.toString());
	if (!socket) {
		return;
	}
	socket.emit('new_notification', {
		message: document.message,
		isRead: document.isRead,
		createdDate: document.createdAt
	});
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
