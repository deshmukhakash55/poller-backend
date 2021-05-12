const socketIO = require('socket.io');

let io = null;

exports.setIO = (server) => {
	io = socketIO(server, { cors: '*' });
	exports.io = io;

	console.log('io set up successfully');

	io.use((socket, next) => {
		const uid = socket.handshake.auth.uid;
		if (!uid) {
			return next(new Error('Invalid uid'));
		}
		socket.uid = uid;
		next();
	});
};

exports.getSocketFor = (userId) => {
	const sockets = [...io.sockets.sockets.values()];
	return sockets.find((socket) => {
		return socket.uid === userId;
	});
};
