const mongoose = require('mongoose');

const { defaultAvatarUrl } = require('../configs');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true
		},
		password: {
			type: String,
			required: true
		},
		isVerified: {
			type: Boolean,
			required: true,
			default: false
		},
		verifiedDate: {
			type: Schema.Types.Date
		},
		verificationToken: {
			type: String
		},
		passwordResetToken: {
			type: String
		},
		interests: [
			{
				type: String
			}
		],
		avatar: {
			type: String,
			default: defaultAvatarUrl
		}
	},
	{ timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
