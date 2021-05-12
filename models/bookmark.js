const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookmarkSchema = new Schema(
	{
		poll: {
			type: Schema.Types.ObjectID,
			required: true,
			ref: 'Poll'
		},
		user: {
			type: Schema.Types.ObjectID,
			required: true,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
