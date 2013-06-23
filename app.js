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
	if (req.user) {
		res.redirect('/chat');
		return;
	}
	res.render('index.html', getContext(req));
});

// Chat page
app.get('/chat', function(req, res) { res.render('chat.html', getContext(req)); });

// User management
app.get('/register', function(req, res) { res.render('register.html', getContext(req)); });
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

app.get('/login', function(req, res) { res.render('login.html', getContext(req)); });
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
	, passio = require('passport.socketio')
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
io.set('authorization', passio.authorize({
	cookieParser: express.cookieParser
, key: app.get('cookieSessionKey')
, secret: app.get('secretKey')
, store: sessionStore
}));

// Socket stuff
io.sockets.on('connection', function(socket) {
	// We have a connection, tell the client as such
	socket.emit('ready')
	
	// when a message is recieverd, process it, then broadcast to all clients
	socket.on('message', function(message) {
		// sanitise
		message = sanitise(message).escape();

		// broadcast
		console.log(socket.handshake.user);
		io.sockets.emit('broadcast', {user: socket.handshake.user, message: message});
	});
});

// Start the server
server.listen(process.env.VCAP_APP_PORT || 8080);