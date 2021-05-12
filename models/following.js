const mongoose = require('mongoose');

const Notification = require('./notification');
const User = require('./user');

const Schema = mongoose.Schema;

const followingSchema = new Schema(
	{
		// One who is being followed
		followee: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		// One who is following
		follower: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

followingSchema.post('save', { document: true }, async function (document) {
	const receiver = document.followee._id.toString();
	const followerId = document.follower._id.toString();
	const followerUserDocument = await User.findById(followerId);
	const followerUserName = followerUserDocument.name;
	const message = `${followerUserName} followed you`;
	await Notification.create({
		message,
		receiver
	});
});

const Following = mongoose.model('Following', followingSchema);

module.exports = Following;
