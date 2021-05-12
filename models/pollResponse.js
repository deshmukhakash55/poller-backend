const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pollResponseSchema = new Schema(
	{
		poll: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Poll'
		},
		selectedOptionIndex: {
			type: Number,
			required: true
		},
		user: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

const PollResponse = mongoose.model('PollResponse', pollResponseSchema);

module.exports = PollResponse;
