
// Requires
var config = require('./config')
  , express = require('express')
  , marked = require('marked')
  , passio = require('passport.socketio')
  , socketio = require('socket.io')
  , validator = require('validator');

function setUpSocketIO(server) {
	var io = socketio.listen(server);

	// Configuration
	io.set('log level', 2);
	if (config.server.production) {
		io.enable('browser client minification');
		io.enable('browser client etag');
		io.enable('browser client gzip');
		io.set('log level', 1);
	}

	// Session sharing/socket auth
	io.set('authorization', passio.authorize({
	  cookieParser: express.cookieParser
	, key: wigslace.app.get('cookieSessionKey')
	, secret: wigslace.app.get('secretKey')
	, store: wigslace.sessionStore
	}));

	// Let the logic begin
	io.sockets.on('connection', function(socket) {
		var user = socket.handshake.user;

		// Add the user to the onlineusers list, respond with a ready
		wigslace.models.chat.addUser(user._id, function(err, success) {
			socket.emit('ready');
			// Tell the other clients that the new client has joined
			socket.broadcast.emit('join', user._id);
			// Send the new client a join for each current user
			wigslace.models.chat.getAllUsers(function(err, users) {
				users.forEach(function(user) {
					// Only send ID, client will request additional data later
					socket.emit('join', user.user._id);
				});
			});
		});

		// Send them the backlog
		wigslace.models.chat.getLog(function(err, log) {
			socket.emit('scrollback', log);
		});

		// If the client requests data on a user, send it through
		socket.on('getUser', function(userID) {
			wigslace.models.users.getBy('_id', userID, function(err, userData) {
				if (err) { return console.log(err); }
				if (!userData) { return console.log('Client requested details for non-existant user '+userID); }

				delete userData.email;
				socket.emit('userData', userData);
			});
		});

		// Process incoming messages, then broadcast to clients
		socket.on('message', function(message) {
			// Does the job, but mucks up markdown quotes. Meh.
			message = validator.sanitize(message).escape();

			// Trim whitespace, ignore if empty
			message = message.trim();
			if (!message.length) { return; }

			// Do the formatting server side because fukkit
			message = marked(message);

			// Form the message object to save/send
			var data = {
			  user: user._id
			, message: message
			, time: new Date
			}

			// Save to db
			wigslace.models.chat.log(data, function(err, logEntry) {
				io.sockets.emit('message', data);

				// Apbot goes here eventually. Or something.
			});
		});

		// Client disconnected. Decrease client count and send part if required
		socket.on('disconnect', function() {
			wigslace.models.chat.removeUser(user.name, function(err, shouldPart) {
				if (shouldPart) { socket.broadcast.emit('part', user._id); }
			})
		})
	});
}

// Because I hate the look of `require('stuff')(args)`
module.exports = {setUp: setUpSocketIO}
