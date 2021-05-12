const Bookmark = require('../models/bookmark');
const Following = require('../models/following');
const Poll = require('../models/poll');
const PollResponse = require('../models/pollResponse');
const Report = require('../models/report');
const User = require('../models/user');

exports.search = async (req, res, next) => {
	try {
		const { searchText, userId } = req.body;
		const lowercasedSearchTokens = searchText
			.trim()
			.split(' ')
			.map((searchToken) => searchToken.toLowerCase());
		const pollDocuments = await Poll.find().populate('pollee');
		const searchedPolls = pollDocuments
			.filter((pollDocument) =>
				ifPollMatchesSearchCriteria(
					pollDocument,
					lowercasedSearchTokens
				)
			)
			.map(mapToPoll)
			.sort(reverseComparatorByStartDate);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedSortedSearchedPolls =
			await updatedPollsToIncludeResponseStats(
				searchedPolls,
				responsedToPollDocuments,
				userId,
				userBookmarks,
				userReports
			);
		const userDocuments = await User.find({ _id: { $ne: userId } });
		const followingDocuments = await Following.find({
			follower: userId
		}).populate('followee');
		const searchedUsers = userDocuments
			.filter((userDocument) =>
				ifUserMatchesSearchCriteria(
					userDocument,
					lowercasedSearchTokens
				)
			)
			.map(mapToUser)
			.map((user) => addIsFollowingData(user, followingDocuments))
			.sort(reverseComparatorByStartDate);
		res.status(200).json({
			searchedPolls: updatedSortedSearchedPolls,
			searchedUsers
		});
	} catch (error) {
		res.status(500).json({ message: 'Error searching for polls' });
	}
};

const mapToPoll = (pollDocument) => ({
	id: pollDocument.id,
	question: pollDocument.question,
	options: pollDocument.options,
	endDate: pollDocument.endDate,
	pollee: pollDocument.pollee.name,
	avatar: pollDocument.pollee.avatar,
	startDate: pollDocument.createdAt
});

const updatedPollsToIncludeResponseStats = async (
	polls,
	responsedToPollDocuments,
	userId,
	userBookmarks,
	userReports
) => {
	const pollIds = polls.map((poll) => poll.id);
	const pollResponsesForPollIds = await PollResponse.find({
		poll: { $in: pollIds }
	})
		.populate('poll')
		.populate('user');
	return polls.map((poll) => {
		const hasUserResponded =
			responsedToPollDocuments.filter(
				(responsedToPollDocument) =>
					responsedToPollDocument.poll.id === poll.id
			).length > 0;
		const hasUserBookmarkedPoll = !!userBookmarks.find(
			(userBookmark) => userBookmark.poll.id === poll.id
		);
		const hasUserReportedPoll = !!userReports.find((userReport) => {
			return userReport.poll.id === poll.id;
		});
		if (!hasUserResponded) {
			return { ...poll, hasUserBookmarkedPoll, hasUserReportedPoll };
		}
		const { options } = poll;
		const pollResponses = pollResponsesForPollIds.filter(
			(pollResponsesForPollId) =>
				pollResponsesForPollId.poll.id === poll.id
		);
		const pollResponseStats = getPollResponseStatsUsing(
			pollResponses,
			options
		);
		const userResponse = getUserResponseFrom(pollResponses, userId);
		return {
			...poll,
			pollResponseStats,
			userResponse,
			hasUserBookmarkedPoll,
			hasUserReportedPoll,
			totalResponses: pollResponses.length
		};
	});
};

const getUserResponseFrom = (pollResponses, userId) => {
	return pollResponses.find((pollResponse) => pollResponse.user.id === userId)
		.selectedOptionIndex;
};

const ifPollMatchesSearchCriteria = (pollDocument, lowercasedSearchTokens) => {
	const questionTokens = pollDocument.question
		.split(' ')
		.map((token) => token.toLowerCase());
	const isPollQuestionMatchingSearchCriteria = questionTokens.some((token) =>
		lowercasedSearchTokens.includes(token)
	);
	if (isPollQuestionMatchingSearchCriteria) {
		return true;
	}
	const polleeNameTokens = pollDocument.pollee.name.toLowerCase().split(' ');
	const isPolleeNameMatchingSearchCriteria = polleeNameTokens.some((token) =>
		lowercasedSearchTokens.includes(token)
	);
	const isPolleeEmailMatchingSearchCriteria = lowercasedSearchTokens.includes(
		pollDocument.pollee.email.toLowerCase()
	);
	if (
		isPolleeNameMatchingSearchCriteria ||
		isPolleeEmailMatchingSearchCriteria
	) {
		return true;
	}
	const pollTags = pollDocument.tags.map((tag) => tag.toLowerCase());
	return pollTags.some((tag) => lowercasedSearchTokens.includes(tag));
};

const ifUserMatchesSearchCriteria = (userDocument, lowercasedSearchTokens) => {
	const userNameTokens = userDocument.name.toLowerCase().split(' ');
	const isUserNameMatchingSearchCriteria = userNameTokens.some((token) =>
		lowercasedSearchTokens.includes(token)
	);
	const isUserEmailMatchingSearchCriteria = lowercasedSearchTokens.includes(
		userDocument.email.toLowerCase
	);
	if (isUserNameMatchingSearchCriteria || isUserEmailMatchingSearchCriteria) {
		return true;
	}
	const userInterests = userDocument.interests.map((tag) =>
		tag.toLowerCase()
	);
	return userInterests.some((tag) => lowercasedSearchTokens.includes(tag));
};

const mapToUser = (userDocument) => ({
	id: userDocument.id,
	name: userDocument.name,
	email: userDocument.email,
	interests: userDocument.interests,
	joinedOn: userDocument.createdAt,
	avatar: userDocument.avatar
});

const addIsFollowingData = (user, followingDocuments) => {
	const following = followingDocuments.find(
		(followingDocument) => followingDocument.followee.id === user.id
	);
	let followingId = null;
	if (!!following) {
		followingId = following.id;
	}
	return { ...user, followingId };
};

const getPollResponseStatsUsing = (pollResponses, options) => {
	const totalResponsesCount = pollResponses.length;
	const optionCountPercentages = options.map((option, index) => {
		const optionPollResponsesCount = pollResponses.filter(
			(pollResponse) => pollResponse.selectedOptionIndex === index
		).length;
		const optionPollResponsesPercentage =
			(optionPollResponsesCount / totalResponsesCount) * 100;
		return {
			optionIndex: index,
			percentage: optionPollResponsesPercentage
		};
	});
	return optionCountPercentages;
};

const reverseComparatorByStartDate = (pollOne, pollTwo) => {
	if (new Date(pollOne.startDate) > new Date(pollTwo.startDate)) {
		return 1;
	} else if (new Date(pollOne.startDate) < new Date(pollTwo.startDate)) {
		return -1;
	}
	return 0;
};
