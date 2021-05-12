const express = require('express');
const multer = require('multer');

const profileController = require('../controllers/profileController');

const router = express.Router();

const localStoragePath = './avatars/';
const storage = multer.diskStorage({
	destination: localStoragePath,
	filename: (req, file, callback) => {
		let extension = '';
		if (file.mimetype === 'image/png') {
			extension = '.png';
		}
		if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
			extension = '.jpg';
		}
		const name = req.params.userId + extension;
		callback(null, name);
	}
});

const upload = multer({
	storage,
	fileFilter: (req, file, callback) => {
		if (
			file.mimetype == 'image/png' ||
			file.mimetype == 'image/jpg' ||
			file.mimetype == 'image/jpeg'
		) {
			callback(null, true);
		} else {
			callback(null, false);
			return callback(
				new Error('Only .png, .jpg and .jpeg format allowed!')
			);
		}
	}
});

router.post(
	'/upload-avatar/:userId',
	upload.single('avatar'),
	profileController.uploadAvatar
);

router.post('/update-profile', profileController.updateProfile);

router.get('/profile', profileController.getUserProfile);

module.exports = router;
