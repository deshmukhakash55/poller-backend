const express = require('express');

const {
	validateNewUser,
	validateLogin,
	validateTokens
} = require('../middlewares/authValidators');
const {
	register,
	verifyUser,
	login,
	refreshToken,
	sendResetPasswordLink,
	resetPassword,
	logout
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', [validateNewUser], register);

router.post('/login', [validateLogin], login);

router.post('/refresh-token', [validateTokens], refreshToken);

router.post('/send-reset-password-link', sendResetPasswordLink);

router.post('/reset-password', resetPassword);

router.post('/logout', logout);

router.post('/verify', verifyUser);

module.exports = router;
