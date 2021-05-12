const mongoose = require('mongoose');

const Following = require('./following');
const Notification = require('./notification');
const User = require('./user');

const Schema = mongoose.Schema;

const pollSchema = new Schema(
	{
		pollee: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		question: {
			type: String,
			required: true
		},
		options: [
			{
				type: String,
				required: true
			}
		],
		tags: [
			{
				type: String
			}
		],
		endDate: {
			type: Schema.Types.Date,
			default: new Date()
		}
	},
	{ timestamps: true }
);

pollSchema.post('save', { document: true }, async function (document) {
	const followingDocuments = await Following.find({
		followee: document.pollee._id.toString()
	}).populate('follower');
	const polleeUser = await User.findById(document.pollee._id.toString());
	const notifications = followingDocuments.map((followingDocument) => ({
		message: `${polleeUser.name} has started new poll`,
		receiver: followingDocument.follower.id
	}));
	await Notification.create(notifications);
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
