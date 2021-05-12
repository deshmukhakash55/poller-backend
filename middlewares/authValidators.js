const jsonwebtoken = require('jsonwebtoken');
const { JWT_SECRET } = require('../configs');
const User = require('../models/user');

exports.validateNewUser = async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!!user) {
		res.status(422).json({
			message:
				'User with this email already exists. Please try logging in.'
		});
		return;
	}
	next();
};

exports.validateLogin = async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		res.status(422).json({
			message:
				'User with this email does not exists. Please try registering.'
		});
		return;
	}
	if (!user.isVerified) {
		res.status(422).json({
			message: 'Email not verified. Please verify your email.'
		});
		return;
	}
	next();
};

exports.validateTokens = async (req, res, next) => {
	const { authorization } = req.headers;
	if (!authorization) {
		res.status(401).json({ message: 'Invalid token' });
		return;
	}
	const token = authorization.split(' ')[1];
	if (!authorization) {
		res.status(401).json({ message: 'Invalid token' });
		return;
	}
	try {
		const decodedToken = jsonwebtoken.verify(token, JWT_SECRET);
		req.body.userId = decodedToken.userId;
		next();
	} catch (error) {
		res.status(401).json({ message: 'Invalid token' });
	}
};
