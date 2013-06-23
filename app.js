// Requires
var connect = require('connect')
	, express = require('express')
	, http = require('http')
	, redis = require('redis')

	, sanitise = require('validator').sanitize;

// Set up the server, app, and other bits and pieces
var app = express()
	, server = http.createServer(app);

// Set up production database if this is running live
if (app.get('env') == 'production') {
	var dbCreds = JSON.parse(process.env.VCAP_SERVICES)['redis-2.2'][0]['credentials'];
	var db = redis.createClient(dbCreds['port'], dbCreds['host']);
	db.auth(dbCreds['password']);
} else {
	var db = redis.createClient();
}

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
, cache: (app.get('env') == 'production')
});
app.set('views', __dirname + '/templates/');

/*
 * Sessions, etc
 */
var RedisStore = require('connect-redis')(express)
	, sessionStore = new RedisStore({client:db})
	, flash = require('connect-flash');

app.set('secretKey', process.env.SESSION_SECRET || 'Development secret key.');
app.set('cookieSessionKey', 'sid');

app.use(express.cookieParser(app.get('secretKey')));
app.use(express.bodyParser())
app.use(express.session({
	key: app.get('cookieSessionKey')
, store: sessionStore
}));
app.use(flash());

/*
 * Authentication
 */
var Users = require('./users')(db)
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy; 

passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	Users.get(id, done);
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		Users.is(username, function(err, isUser) {
			if (err) { return done(err); }
			if (!isUser) { return done(null, false, {message: 'Incorrect username.'}); }
			Users.validate(username, password, function(err, correct) {
				if (correct) { Users.get(username, done); }
				else { return done(null, false, {message: 'Incorrect password'}); }
			});
		});
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
	, errors: req.flash('error')
	, user: req.user
	};
}

// Index page
app.get('/', function(req, res) {
	console.log(req.user);
	var data = getContext(req);
	res.render('index.html', data);
});

// Chat page
app.get('/chat', function(req, res) {
	var data = getContext(req);
	data.loggedIn = req.session.username != null;

	res.render('chat.html', data);
});

// User management
app.get('/register', function(req, res) {
	var data = getContext(req);
	res.render('register.html', data);
});
app.post('/register', function(req, res) {
	var post = req.body
	// Make sure the password & confirm match
	if (post.password != post.password_confirm) {
		req.flash('error', 'The passwords do not match.');
		res.redirect('/register');
		return;
	}
	// Attempt to register the user
	Users.register(post.username, post.email, post.password, function(err, success, message) {
		if (err) { console.log(err); } // <== dev
		if (success) {
			// Grab user data, log them in, redirect to index
			Users.get(post.username, function(err, user) {
				req.login(user, function(err) {
					res.redirect('/');
				});
			});
		} else {
			// Shove an error at them, refresh
			if (message) { req.flash('error', message); }
			res.redirect('/register');
		}
	});
});

app.get('/login', function(req, res) {
	var data = getContext(req);

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
, failureFlash: true
}));

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

/*
 * Socket.io
 */
var socketio = require('socket.io')
	, io = socketio.listen(server);
// Config
io.set('log level', 2);
io.configure('production', function() {
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.enable('browser client gzip');
	io.set('log level', 1);
});

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
		
		// socket.handshake.lol += 1;
		// socket.handshake.foo = 'hello'
		//console.log(socket.handshake.lol, socket.handshake.foo);

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