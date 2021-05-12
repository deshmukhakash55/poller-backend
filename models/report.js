const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reportSchema = new Schema(
	{
		reporter: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		poll: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Poll'
		},
		reason: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
