// Requires
var connect = require('connect')
	, express = require('express')
	, http = require('http')
	, socketio = require('socket.io')
	, redis = require('redis')

	, sanitise = require('validator').sanitize;

// Set up the server, app, and other bits and pieces
var app = express()
	, server = http.createServer(app)
	, io = socketio.listen(server)
	, db = redis.createClient(/* need env vars in here for production server*/);

/*
 * Templating engine
 */
var swig = require('swig')
	, cons = require('consolidate')

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
var RedisStore = require('connect-redis')(express)
	, sessionStore = new RedisStore({client:db});

app.set('secretKey', process.env.SESSION_SECRET || 'Development secret key.');
app.set('cookieSessionKey', 'sid');

app.use(express.cookieParser(app.get('secretKey')));
app.use(express.bodyParser())
app.use(express.session({
	key: app.get('cookieSessionKey')
, store: sessionStore
}));

/*
 * Authentication
 */
var passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy; 

passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	// check if is user, get data, blah.
	// Need to delegate users and so on to a db model
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		// Check if the user exists
		db.sismember('userinfo:users', username); //<-- obviously temp
		done(null, 'lolhi');
	}
));

app.use(passport.initialize());
app.use(passport.session());

/*
 * Other middleware and handlers
 */
// Serve static files
app.use(express.static(__dirname + '/static'));

/*
 * Routing
 */
 // Get basic variables for templates
function getContext(req) {
	var host = req.protocol + '://' + req.get('host');

	return {
		pageURL: host + req.url
	};
}

// Index page
app.get('/', function(req, res) {
	data = getContext(req);
	res.render('index.html', data);
});

// Chat page
app.get('/chat', function(req, res) {
	data = getContext(req);
	data.loggedIn = req.session.username != null;

	res.render('chat.html', data);
});

// Login page
app.get('/login', function(req, res) {
	data = getContext(req);

	// If already logged in, redirect to (edit)? profile page (once i have users lol)

	// If there is username postdata, save it to the session and redirect
	// if (req.body.username != null) {
	// 	req.session.username = req.body.username;
	// 	var url = '/';

	// 	if (req.query.redirect != null) {
	// 		var url = req.query.redirect;
	// 	}
	// 	res.redirect(url);
	// }

	res.render('login.html', data);
});
app.post('/login', passport.authenticate('local', {
	successRedirect: '/'
, failureRedirect: '/login'
}));

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

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
io.sockets.on('connection', function(socket) {
	// We have a connection, tell the client as such
	socket.emit('ready')
	
	// when a message is recieverd, process it, then broadcast to all clients
	socket.on('message', function(message) {
		// sanitise
		message = sanitise(message).escape();
		
		socket.handshake.lol += 1;
		socket.handshake.foo = 'hello'
		console.log(socket.handshake.lol, socket.handshake.foo);

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