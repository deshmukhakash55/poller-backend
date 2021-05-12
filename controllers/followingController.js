const Following = require('../models/following');
const User = require('../models/user');

exports.getRecommendedFollowings = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const { pageNo } = req.params;
		const maxPageFollowings = 5;
		const currentUserDocument = await User.findById(userId);
		const followingDocuments = await Following.find({
			follower: userId
		}).populate('followee');
		const followedUserIds = followingDocuments.map(
			(followingDocument) => followingDocument.followee.id
		);
		const allUserDocuments = await User.find({
			email: { $ne: currentUserDocument.email },
			_id: { $nin: followedUserIds }
		}).skip((+pageNo - 1) * maxPageFollowings);
		const recommendedFollowings = allUserDocuments
			.filter((userDocument) =>
				doInterestsMatch(
					currentUserDocument.interests,
					userDocument.interests
				)
			)
			.map(mapToRecommendedFollowing);
		const hasMoreRecommendedFollowings =
			recommendedFollowings.length - maxPageFollowings > 0 ? true : false;
		const truncatedRecommendedFollowings = recommendedFollowings.slice(
			0,
			maxPageFollowings
		);
		return res.status(200).json({
			recommendedFollowings: truncatedRecommendedFollowings,
			hasMoreRecommendedFollowings
		});
	} catch (error) {
		res.status(500).json({ message: 'No recommended followings' });
	}
};

const doInterestsMatch = (interestsOne, interestsTwo) => {
	return (
		interestsOne.filter((interest) => interestsTwo.includes(interest))
			.length > 0
	);
};

const mapToRecommendedFollowing = (userDocument) => ({
	userId: userDocument.id,
	name: userDocument.name,
	avatar: userDocument.avatar
});

exports.addNewFollowing = async (req, res, next) => {
	try {
		const { userId, followee } = req.body;
		await Following.create({
			followee,
			follower: userId
		});
		res.status(201).json({ message: 'Following added successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error occured will following user' });
	}
};

exports.removeFollowing = async (req, res, next) => {
	try {
		const { userId, followee } = req.body;
		await Following.findOneAndRemove(
			{
				followee,
				follower: userId
			},
			{ useFindAndModify: false }
		);
		res.status(201).json({ message: 'Following deleted successfully' });
	} catch (error) {
		res.status(500).json({
			message: 'Error occured will unfollowing user'
		});
	}
};

exports.getFollowings = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const followingDocuments = await Following.find({
			follower: userId
		}).populate('followee');
		const followings = followingDocuments.map(mapToFollowing);
		const followerDocuments = await Following.find({
			followee: userId
		}).populate('follower');
		const followers = followerDocuments.map(mapToFollower);
		res.status(200).json({ followings, followers });
	} catch (error) {
		res.status(500).json({ message: 'Error loading followings' });
	}
};

const mapToFollowing = (followingDocument) => ({
	id: followingDocument.followee.id,
	name: followingDocument.followee.name,
	interests: followingDocument.followee.interests,
	joinedOn: followingDocument.followee.createdAt,
	avatar: followingDocument.followee.avatar,
	followingId: followingDocument.id
});

const mapToFollower = (followingDocument) => ({
	id: followingDocument.follower.id,
	name: followingDocument.follower.name,
	interests: followingDocument.follower.interests,
	joinedOn: followingDocument.follower.createdAt,
	avatar: followingDocument.follower.avatar,
	followingId: null
});
