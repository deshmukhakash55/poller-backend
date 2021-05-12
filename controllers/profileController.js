const { uuid } = require('uuidv4');
const admin = require('firebase-admin');
const fs = require('fs');

const User = require('../models/user');

const { defaultAvatarUrl } = require('../configs');

var serviceAccount = require('../keys/poller-e5529-firebase-adminsdk-yaq91-c2c8122576.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	storageBucket: 'poller-e5529.appspot.com'
});

const bucket = admin.storage().bucket();

exports.getUserProfile = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const userDocument = await User.findById(userId);
		const profile = mapToProfile(userDocument);
		return res.status(200).json({ profile });
	} catch (error) {
		res.status(500).json({ message: 'Error loading user profile' });
	}
};

const mapToProfile = (userDocument) => ({
	name: userDocument.name,
	email: userDocument.email,
	interests: userDocument.interests,
	avatar: userDocument.avatar
});

exports.uploadAvatar = async (req, res, next) => {
	try {
		const url = req.file.path;
		const { userId } = req.params;
		const userDocument = await User.findById(userId);
		const existingAvatarUrl = userDocument.avatar;
		if (existingAvatarUrl !== defaultAvatarUrl) {
			await bucket.deleteFiles({ prefix: userId });
		}
		const newUuid = uuid();
		const [file, metadata] = await bucket.upload(url, {
			metadata: { metadata: { firebaseStorageDownloadTokens: newUuid } }
		});
		fs.unlink(url, (error) => {});
		const link = createAvatarUrl(
			metadata.bucket,
			req.file.filename,
			newUuid
		);
		await User.findByIdAndUpdate(userId, { avatar: link });
		res.status(200).json({ avatarUrl: link });
	} catch (error) {
		res.status(500).json({ message: 'Error uploading avatar' });
	}
};

const createAvatarUrl = (bucket, pathToFile, downloadToken) => {
	return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
		pathToFile
	)}?alt=media&token=${downloadToken}`;
};

exports.updateProfile = async (req, res, next) => {
	try {
		const { userId, profile } = req.body;
		await User.findByIdAndUpdate(userId, { ...profile });
		res.status(200).json({ message: 'Profile updated successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error updating profile' });
	}
};
