const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const User = require('../models/user');
const sgMail = require('../utility/mail');
const { JWT_SECRET } = require('../configs');
const RefreshToken = require('../models/refreshTokens');

exports.register = async (req, res, next) => {
	const { name, email, password } = req.body;
	let user;
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const rawVerificationToken = await bcrypt.hash(email, 12);
		const verificationToken =
			Buffer.from(rawVerificationToken).toString('base64');
		user = await User.create({
			name,
			email,
			password: hashedPassword,
			verificationToken
		});
		await sendVerificationMail(user);
		res.status(201).json({
			message:
				'Registration successfully. Please verify your email to login.'
		});
	} catch (error) {
		try {
			await User.findByIdAndRemove(user._id, { useFindAndModify: true });
		} catch (err) {}
		if (error.response.status === 500) {
			res.status(500).json({
				message:
					'Error while registering. Please try again after some time.'
			});
		}
	}
};

const sendVerificationMail = (user) => {
	const { email, verificationToken } = user;
	const msg = {
		to: email,
		from: 'deshmukhakash9689750481@gmail.com',
		subject: 'Welcome to Poller! Confirm your email',
		html: `
			<div>
				<div>You're on your way! Let's confirm your email address</div>
				<a style="border: 1px solid #264c77; color: white: background-color: #264c77; height: '2em'; width: '5em'; text-align: center"
					href="https://poller-e5529.web.app/verify/${verificationToken}">Confirm Email Address</a>
			</div>
		`
	};

	return sgMail.send(msg);
};

exports.verifyUser = async (req, res, next) => {
	const token = req.body.token;
	try {
		const user = await User.findOne({ verificationToken: token });
		if (!user) {
			res.status(422).json({
				message: 'Invalid link. Please try again to register'
			});
			return;
		}
		await User.findByIdAndUpdate(
			user._id,
			{
				isVerified: true,
				verificationToken: '',
				verifiedDate: new Date()
			},
			{ useFindAndModify: false }
		);
		res.status(200).json({
			message: 'Email is verified. Please try logging in.'
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error while verifying. Please try again later'
		});
	}
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		res.status(422).json({ message: 'Invalid email or password.' });
		return;
	}
	const expiryTime = 3600000;
	const token = jsonwebtoken.sign(
		{
			userId: user.id,
			expiryTime: new Date(new Date().getTime() + expiryTime)
		},
		JWT_SECRET
	);
	const refreshToken = jsonwebtoken.sign(
		{
			time: new Date().getTime()
		},
		JWT_SECRET
	);
	await RefreshToken.create({ userId: user._id, token: refreshToken });
	res.status(200).json({ token, refreshToken, expiryTime, _uid: user.id });
};

exports.refreshToken = async (req, res, next) => {
	const { refreshToken, _uid } = req.body;
	const user = await User.findById(_uid);
	const refreshTokenDocuments = await RefreshToken.find({
		userId: user.id
	});
	const currentRefreshTokenDocument = refreshTokenDocuments.find(
		(document) => document.token === refreshToken
	);
	if (!!currentRefreshTokenDocument) {
		const newRefreshToken = jsonwebtoken.sign(
			{
				time: new Date().getTime()
			},
			JWT_SECRET
		);
		currentRefreshTokenDocument.token = newRefreshToken;
		currentRefreshTokenDocument.save();
		const expiryTime = 3600000;
		const token = jsonwebtoken.sign(
			{
				userId: user.id,
				expiryTime: new Date(new Date().getTime() + expiryTime)
			},
			JWT_SECRET
		);
		res.status(200).json({
			token,
			refreshToken: newRefreshToken,
			expiryTime,
			_uid: user.id
		});
	} else {
		res.status(401).json({
			message: 'Token is corrupted. Try deleting it.'
		});
	}
};

exports.resetPassword = async (req, res, next) => {
	const { userId, password, passwordResetToken } = req.body;
	const user = await User.findById(userId);
	if (!user) {
		req.status(422).json({ message: 'Invalid link.' });
	}
	if (user.passwordResetToken !== passwordResetToken) {
		req.status(422).json({ message: 'Invalid link.' });
	}
	const newPassword = await bcrypt.hash(password, 12);
	await User.findByIdAndUpdate(
		userId,
		{
			password: newPassword,
			passwordResetToken: ''
		},
		{ useFindAndModify: false }
	);
	res.status(201).json({ message: 'Password reset successfully' });
};

exports.sendResetPasswordLink = async (req, res, next) => {
	const { email } = req.body;
	const user = await User.findOne({ email });
	if (!user) {
		res.status(422).json({ message: 'Invalid request' });
	}
	const passwordResetToken = jsonwebtoken.sign(
		{
			time: new Date().getTime()
		},
		JWT_SECRET
	);
	await User.findByIdAndUpdate(
		user.id,
		{
			passwordResetToken
		},
		{ useFindAndModify: false }
	);
	await sendResetPasswordMail(email, user.id, passwordResetToken);
	res.status(200).json({
		message: 'Password reset link is send to user email'
	});
};

const sendResetPasswordMail = (to, userId, passwordResetToken) => {
	const msg = {
		to,
		from: 'deshmukhakash9689750481@gmail.com',
		subject: 'Password reset for your Poller account',
		html: `
			<div>
				<div>Click on below link to reset your password</div>
				<a style="border: 1px solid #264c77; color: white: background-color: #264c77; height: '2em'; width: '5em'; text-align: center"
					href="https://poller-e5529.web.app/resetPassword/${passwordResetToken}/${userId}">Reset password</a>
			</div>
		`
	};

	return sgMail.send(msg);
};

exports.logout = async (req, res, next) => {
	const { refreshToken, userId } = req.body;
	const refreshTokenDocument = await RefreshToken.findOne({
		userId,
		token: refreshToken
	});
	if (!refreshTokenDocument) {
		res.status(422).json({ message: 'User already logged out.' });
	}
	await refreshTokenDocument.delete();
	res.status(200).json({ message: 'User logged out.' });
};
