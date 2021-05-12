const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const connectionSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		connectionId: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
