// Requires
var connect = require('connect')
	, cons = require('consolidate')
	, express = require('express')
	, http = require('http')
	, socketio = require('socket.io')
	, swig = require('swig')
	, sanitise = require('validator').sanitize
	// My stuff
	, routes = require('./routes');

// Set up the server, app, and other bits and pieces
var app = express()
	, server = http.createServer(app)
	, io = socketio.listen(server);

/*
 * Templating engine
 */
app.engine('.html', cons.swig);
app.set('view engine', 'html');
swig.init({
	root: __dirname + '/templates/'
, allowErrors: true
, cache: false // FOR DEV ONLY
});
app.set('views', __dirname + '/templates/');

/*
 * Sessions, etc
 */
var sessionStore = new connect.session.MemoryStore();
app.set('secretKey', process.env.SESSION_SECRET || 'Development secret key.');
app.set('cookieSessionKey', 'sid');

app.use(express.cookieParser(app.get('secretKey')));
app.use(express.session({
	key: app.get('cookieSessionKey')
, store: sessionStore
}));


/*
 * Other middleware and handlers
 */
// Handle post/etc data sent to the server
app.use(express.bodyParser())

// Serve static files
app.use(express.static(__dirname + '/static'));

/*
 * Routing (pulled in from seperate file)
 */
app.get('/', routes.index);
app.all('/login', routes.login);

/*
 * Socket.io
 */
// Set up socket authorisation and session sharing
io.set('authorization', function(handshakeData, callback) {
	if (handshakeData.headers.cookie) {
		var cookie = require('cookie').parse(decodeURIComponent(handshakeData.headers.cookie));
		cookie = connect.utils.parseSignedCookies(cookie, app.get('secretKey'));
		var sessionID = cookie[app.get('cookieSessionKey')];

		sessionStore.get(sessionID, function(err, session) {
			if (err) { callback(err.message, false); }
			else if (!session) { callback('Session not found.', false); }
			else {
				handshakeData.cookie = cookie;
				handshakeData.sessionID = sessionID;
				handshakeData.sessionStore = sessionStore;
				handshakeData.session = new express.session.Session(handshakeData, session);

				callback(null, true);
			}
		});
	}
	else {
		callback('Cookie not found.', false);
	}
});

// Socket stuff
io.sockets.on('connection', function (socket) {
	// We have a connection, tell the client as such
	socket.emit('ready')
	
	// when a message is recieverd, process it, then broadcast to all clients
	socket.on('message', function(message) {
		// sanitise
		message = sanitise(message).escape();
		console.log(message);

		// broadcast
		io.sockets.emit('broadcast', {username: socket.handshake.session.username, message: message});
	});

	// keep the session alive
	var sessionReloadIntervalID = setInterval(function() {
		socket.handshake.session.reload(function() {
			socket.handshake.session.touch().save();
		});
	}, 60 * 2 * 1000);
	socket.on('disconnect', function(message) {
		clearInterval(sessionReloadIntervalID);
	});
});

// Start the server
server.listen(process.env.VCAP_APP_PORT || 8080);