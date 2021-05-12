const Bookmark = require('../models/bookmark');
const Following = require('../models/following');
const Poll = require('../models/poll');
const PollResponse = require('../models/pollResponse');
const Report = require('../models/report');
const User = require('../models/user');

exports.getRecommendedPolls = async (req, res, next) => {
	const { userId } = req.body;
	const user = await User.findById(userId);
	if (!user) {
		res.status(422).json('Invalid user');
		return;
	}
	const pollDocuments = await Poll.find().populate('pollee');
	const polls = pollDocuments.map(mapToPoll);
	const responsedToPollDocuments = await PollResponse.find({
		user: userId
	}).populate('poll');
	const userBookmarks = await Bookmark.find({ user: userId }).populate(
		'poll'
	);
	const userReports = await Report.find({ reporter: userId }).populate(
		'poll'
	);
	const updatedPolls = await updatedPollsToIncludeResponseStats(
		polls,
		responsedToPollDocuments,
		userId,
		userBookmarks,
		userReports
	);
	return res.status(200).json({ recommendedPolls: updatedPolls });
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
		if (!hasUserResponded && new Date(poll.endDate) > new Date()) {
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
	const pollResponse = pollResponses.find(
		(pollResponse) => pollResponse.user.id === userId
	);
	if (!pollResponse) {
		return -1;
	}
	return pollResponse.selectedOptionIndex;
};

exports.addNewPoll = async (req, res, next) => {
	const { question, options, endDate, tags, userId } = req.body;
	try {
		await Poll.create({
			question,
			options,
			endDate,
			tags,
			pollee: userId
		});
		res.status(201).json({ message: 'Poll started successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

exports.addPollResponse = async (req, res, next) => {
	const { pollId, selectedOptionIndex, userId } = req.body;
	try {
		const { options, endDate } = await Poll.findById(pollId);
		if (new Date(endDate) > new Date()) {
			res.status(422).json({ message: 'Poll already ended' });
			return;
		}
		await PollResponse.create({
			poll: pollId,
			selectedOptionIndex,
			user: userId
		});
		const pollResponses = await PollResponse.find({
			poll: pollId
		}).populate('user');
		const pollResponseStats = await getPollResponseStatsUsing(
			pollResponses,
			options
		);
		const userResponse = getUserResponseFrom(pollResponses, userId);
		res.status(201).json({
			pollId,
			pollResponseStats,
			userResponse,
			totalResponses: pollResponses.length
		});
	} catch (error) {
		res.status(422).json({ message: 'Invalid response' });
	}
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

exports.getTrendingPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const pollDocuments = await Poll.find().populate('pollee');
		const polls = pollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			polls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByTotalResponses
		);
		return res.status(200).json({ trendingPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'No trending polls.' });
	}
};

const reverseComparatorByTotalResponses = (pollOne, pollTwo) => {
	if (pollOne.totalResponses > pollTwo.totalResponses) {
		return 1;
	} else if (pollOne.totalResponses < pollTwo.totalResponses) {
		return -1;
	}
	return 0;
};

exports.getYourPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const yourPollDocuments = await Poll.find({ pollee: userId }).populate(
			'pollee'
		);
		const yourPolls = yourPollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			yourPolls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByStartDate
		);
		return res.status(200).json({ yourPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error loading your polls.' });
	}
};

const reverseComparatorByStartDate = (pollOne, pollTwo) => {
	if (new Date(pollOne.startDate) > new Date(pollTwo.startDate)) {
		return 1;
	} else if (new Date(pollOne.startDate) < new Date(pollTwo.startDate)) {
		return -1;
	}
	return 0;
};

exports.getFollowingsPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const followingDocuments = await Following.find({
			follower: userId
		}).populate('followee');
		const followeeIds = followingDocuments.map(
			(followingDocument) => followingDocument.followee.id
		);
		const followingsPollDocuments = await Poll.find({
			pollee: { $in: followeeIds }
		}).populate('pollee');
		const followingsPolls = followingsPollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			followingsPolls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByStartDate
		);
		return res.status(200).json({ followingsPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error loading followings polls.' });
	}
};

exports.getRespondedPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const pollResponseDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const pollIdsSet = new Set(
			pollResponseDocuments.map(
				(pollResponseDocument) => pollResponseDocument.poll.id
			)
		);
		const pollIds = [...pollIdsSet];
		const respondedPollDocuments = await Poll.find({
			_id: { $in: pollIds }
		}).populate('pollee');
		const respondedPolls = respondedPollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			respondedPolls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByStartDate
		);
		return res.status(200).json({ respondedPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error loading responded polls.' });
	}
};

exports.getEndedPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const endedPollDocuments = await Poll.find({
			endDate: { $lt: new Date() }
		}).populate('pollee');
		const endedPolls = endedPollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			endedPolls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByStartDate
		);
		return res.status(200).json({ endedPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error loading responded polls.' });
	}
};

exports.bookmarkPoll = async (req, res, next) => {
	try {
		const { userId, pollId } = req.body;
		await Bookmark.create({
			user: userId,
			poll: pollId
		});
		res.status(201).json({ message: 'Bookmarked successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error bookmarking the poll' });
	}
};

exports.unbookmarkPoll = async (req, res, next) => {
	try {
		const { userId, pollId } = req.body;
		await Bookmark.findOneAndRemove(
			{
				user: userId,
				poll: pollId
			},
			{ useFindAndModify: false }
		);
		res.status(201).json({ message: 'Unbookmarked successfully' });
	} catch (error) {
		res.status(500).json({ message: 'Error unbookmarking the poll' });
	}
};

exports.getBookmarkedPolls = async (req, res, next) => {
	try {
		const { userId } = req.body;
		const bookmarkDocuments = await Bookmark.find({
			user: userId
		}).populate('poll');
		const pollIdsSet = new Set(
			bookmarkDocuments.map(
				(bookmarkDocument) => bookmarkDocument.poll.id
			)
		);
		const pollIds = [...pollIdsSet];
		const bookmarkedPollDocuments = await Poll.find({
			_id: { $in: pollIds }
		}).populate('pollee');
		const bookmarkedPolls = bookmarkedPollDocuments.map(mapToPoll);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedUnsortedPolls = await updatedPollsToIncludeResponseStats(
			bookmarkedPolls,
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		const updatedSortedPolls = updatedUnsortedPolls.sort(
			reverseComparatorByStartDate
		);
		return res.status(200).json({ bookmarkedPolls: updatedSortedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error loading responded polls.' });
	}
};

exports.getPollById = async (req, res, next) => {
	try {
		const { pollId } = req.params;
		const { userId } = req.body;
		if (!pollId) {
			res.status(422).json({ message: 'Invalid pollId' });
		}
		const pollDocument = await Poll.findById(pollId);
		const poll = mapToPoll(pollDocument);
		const responsedToPollDocuments = await PollResponse.find({
			user: userId
		}).populate('poll');
		const userBookmarks = await Bookmark.find({
			user: userId
		}).populate('poll');
		const userReports = await Report.find({ reporter: userId }).populate(
			'poll'
		);
		const updatedPolls = await updatedPollsToIncludeResponseStats(
			[poll],
			responsedToPollDocuments,
			userId,
			userBookmarks,
			userReports
		);
		return res.status(200).json({ poll: updatedPolls });
	} catch (error) {
		res.status(500).json({ message: 'Error while loading poll' });
	}
};
