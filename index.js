const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');

const configs = require('./configs');
const { setIO } = require('./socketio');
const authRoutes = require('./routes/authRoutes');
const pollsRoutes = require('./routes/pollsRoutes');
const followingRoutes = require('./routes/followingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const searchRoutes = require('./routes/searchRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { validateTokens } = require('./middlewares/authValidators');

const app = express();
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());

app.use(authRoutes);

app.use('/', validateTokens);
app.use(pollsRoutes);
app.use(followingRoutes);
app.use(notificationRoutes);
app.use(reportRoutes);
app.use(searchRoutes);
app.use(profileRoutes);

mongoose
	.connect(configs.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		const port = process.env.PORT || 8000;
		const server = app.listen(port);
		setIO(server);
		console.log('Listening at port: ' + port);
	})
	.catch((error) => {
		console.log('Error connecting database server : ' + error);
	});
