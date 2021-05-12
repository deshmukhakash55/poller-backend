const Report = require('../models/report');

exports.reportPoll = async (req, res, next) => {
	try {
		const { userId, reason, pollId } = req.body;
		await Report.create({
			reporter: userId,
			poll: pollId,
			reason
		});
		res.status(200).json({ message: 'Successfullt reported the poll' });
	} catch (error) {
		res.status(500).json({ message: 'Error reporting poll' });
	}
};
