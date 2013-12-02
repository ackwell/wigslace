
// Requires
var config = require('./config')
  , express = require('express')
  , passio = require('passport.socketio')
  , socketio = require('socket.io')

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

		//
	});
}

// Because I hate the look of `require('stuff')(args)`
module.exports = {setUp: setUpSocketIO}
