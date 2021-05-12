const express = require('express');
const pollsController = require('../controllers/pollsController');

const router = express.Router();

router.get('/recommended-polls', pollsController.getRecommendedPolls);

router.get('/trending-polls', pollsController.getTrendingPolls);

router.get('/your-polls', pollsController.getYourPolls);

router.get('/followings-polls', pollsController.getFollowingsPolls);

router.get('/responded-polls', pollsController.getRespondedPolls);

router.get('/ended-polls', pollsController.getEndedPolls);

router.get('/bookmarked-polls', pollsController.getBookmarkedPolls);

router.get('/get-poll/:pollId', pollsController.getPollById);

router.post('/new-poll', pollsController.addNewPoll);

router.post('/add-poll-response', pollsController.addPollResponse);

router.post('/bookmark-poll', pollsController.bookmarkPoll);

router.post('/unbookmark-poll', pollsController.unbookmarkPoll);

module.exports = router;
