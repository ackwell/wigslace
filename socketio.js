
// Requires
var bboxed = require('bboxed')
  , express = require('express')
  , marked = require('marked')
  , passio = require('passport.socketio')
  , socketio = require('socket.io');

function SocketServer(server) {
	this.io = socketio.listen(server);

	this.activityChecker = new ActivityChecker(this.io);
	this.socketIDs = {};

	this.setConfig();
	this.io.set('authorization', this.authorization);
	// Need to .bind() this to get js to preserve the namespace.
	// I mean like what the actual fuck guys come on
	this.io.sockets.on('connection', this.onConnection.bind(this));
}

SocketServer.prototype.setConfig = function() {
	this.io.set('log level', 2);
	if (wigslace.config.server.production) {
		this.io.enable('browser client minification');
		this.io.enable('browser client etag');
		this.io.enable('browser client gzip');
		this.io.set('log level', 1);
	}
}

SocketServer.prototype.authorization = function(data, accept) {
	// Attempt to authorize with passport.socketio (for web clients)
	passio.authorize({
	  cookieParser: express.cookieParser
	, key: wigslace.app.get('cookieSessionKey')
	, secret: wigslace.app.get('secretKey')
	, store: wigslace.sessionStore
	})(data, function(err, accepted) {
		if (err) { return accept(err, accepted); }

		// If they were rejected, set the handshake.user to false
		if (!accepted) {
			data.user = false;
		}

		// Always accept clients. Just using above to check for
		// existing sessions
		accept(err, true);
	});
}

SocketServer.prototype.onConnection = function(socket) {
	if (socket.id in this.socketIDs && this.socketIDs[socket.id]) {
		console.log(socket.id + ': Duplicate socket.io connection ID, ignoring.')
		return
	}

	client = new SocketClient(socket, this);
	this.socketIDs[socket.id] = true;
}

SocketServer.prototype.onDisconnection = function(socket) {
	delete this.socketIDs[socket.io];
}


function SocketClient(socket, server) {
	this.socket = socket;
	this.server = server;
	this.activityChecker = server.activityChecker;

	this.beenSetUp = false;

	var user = this.socket.handshake.user;
	if (user) {
		// User has already authenticated (session), set up.
		this.setUp();
	} else {
		// User has not authenticated via session, wait for auth signal
		this.socket.on('authenticate', this.authenticate.bind(this));
	}
}

SocketClient.prototype.authenticate = function(data) {
	wigslace.models.users.authenticate(data.username, data.password, 'chat', function(err, user) {
		if (!user) {
			return
		}

		this.socket.handshake.user = user;
		this.setUp();
	}.bind(this));
}

SocketClient.prototype.setUp = function() {
	if (this.beenSetUp) { return; }
	this.beenSetUp = true;

	// Called when the user has connection and has authenticated if required
	this.joinChat();
	this.sendClientList();
	this.sendBacklog();
	this.bindEvents();
}

SocketClient.prototype.joinChat = function() {
	var user = this.socket.handshake.user;

	// Add the socket into the chat broadcast room
	this.socket.join('chat');

	// Add the user to the onlineusers list, tell it that it's ready.
	wigslace.models.chat.addUser(user._id, function(err, success) {
		this.socket.emit('ready', user._id);

		// Tell the other clients that the new client has joined and is active
		this.server.io.sockets.in('chat').emit('join', user._id);
		this.activityChecker.set(user._id, true);
	}.bind(this));
}

SocketClient.prototype.sendClientList = function() {
	// Send the new client a join for each current user
	wigslace.models.chat.getAllUsers(function(err, users) {
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			// Only send ID, client will request additional data later
			var id = user.user._id;
			this.socket.emit('join', id);
			this.socket.emit('active', {user: id, status: this.activityChecker.get(id)});
		}
	}.bind(this));
}

SocketClient.prototype.sendBacklog = function() {
	// Send them the backlog
	wigslace.models.chat.getLog(function(err, log) {
		this.socket.emit('scrollback', log);
	}.bind(this));
}

SocketClient.prototype.bindEvents = function() {
	var events = ['getUser', 'message', 'disconnect']

	for (var i = 0; i < events.length; i++) {
		var e = events[i]
		this.socket.on(e, this[e].bind(this));
	}
}

SocketClient.prototype.getUser = function(userID) {
	wigslace.models.users.getBy('_id', userID, function(err, userData) {
		if (err) { return console.log(err); }
		if (!userData) { return console.log('Client requested details for non-existant user '+userID); }

		delete userData.email;
		this.socket.emit('userData', userData);
	}.bind(this));
}

SocketClient.prototype.message = function(message) {
	var postTime = new Date
	  , user = this.socket.handshake.user;

	this.activityChecker.seen(user._id, postTime);

	// If they do not have chat permission, ignore.
	if (!user.permissions.chat) { return; }

	// Does the job, but mucks up markdown quotes. Meh.
	message = message
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

	// Trim whitespace, ignore if empty
	message = message.trim();
	if (!message.length) { return; }

	// Do the formatting server side because fukkit
	message = bboxed(message);
	message = marked(message);

	// <a> tags need target="_blank"
	message = message.replace(/<a/g, '<a target="_blank"');

	// Form the message object to save/send
	var data = {
	  user: user._id
	, message: message
	, time: postTime
	};

	// Save to db
	wigslace.models.chat.log(data, function(err, logEntry) {
		this.server.io.sockets.in('chat').emit('message', data)
	}.bind(this));
}

SocketClient.prototype.disconnect = function() {
	var user = this.socket.handshake.user;

	// Tell the DB there's been a part
	wigslace.models.chat.removeUser(user._id, function(err, shouldPart) {
		if (shouldPart) {
			this.socket.broadcast.to('chat').emit('part', user._id);
		}
	}.bind(this))

	// Tell the server that we've disconnected as well
	this.server.onDisconnection(this.socket)
}


function ActivityChecker(io) {
	this.io = io;
	this.statuses = {};

	// Poll every 30 seconds
	setInterval(this.check.bind(this), 30000);
}

ActivityChecker.prototype.check = function() {
	for (id in this.statuses) {
		var status = this.statuses[id];

		// Check if they are inactive (10 minutes since last seen). If they are, set it as such.
		if (status.active && new Date(new Date - status.lastSeen).getMinutes() >= 10) {
			this.set(id, false);
		}
	}
}

ActivityChecker.prototype.set = function(id, active) {
	if (!(id in this.statuses)) {
		this.statuses[id] = {active: true, lastSeen: new Date}
	}
	this.statuses[id].active = active;

	this.io.sockets.in('chat').emit('active', {user: id, status: active});
}

ActivityChecker.prototype.get = function(id) {
	if (!(id in this.statuses)) {
		return false;
	}

	return this.statuses[id].active;
}

ActivityChecker.prototype.seen = function(id, date) {
	if (date == null) {
		date = new Date;
	}

	if (!this.get(id)) {
		this.set(id, true);
	}

	this.statuses[id].lastSeen = date;
}

function setUpSocketIO(server) {
	// Add the custom tags to bboxed
	bboxed.addTags(wigslace.config.tags);

	// Get Socket.io up and running
	io = new SocketServer(server);
}

// Because I hate the look of `require('stuff')(args)`
module.exports = {setUp: setUpSocketIO}
