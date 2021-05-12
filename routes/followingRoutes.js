const express = require('express');

const followingController = require('../controllers/followingController');

const router = express.Router();

router.get(
	'/recommended-followings/:pageNo',
	followingController.getRecommendedFollowings
);

router.post('/new-following', followingController.addNewFollowing);

router.post('/remove-following', followingController.removeFollowing);

router.get('/followings', followingController.getFollowings);

module.exports = router;
