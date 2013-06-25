// Requires
var connect = require('connect')
	, express = require('express')
	, http = require('http')
//, redis = require('redis')
	, db = require('mongoose')

	, validator = require('validator');

// Set up the server, app, and other bits and pieces
var app = express()
	, server = http.createServer(app);

if (app.get('env') == 'production') {
	var url = JSON.parse(process.env.VCAP_SERVICES)['mongodb-1.8'][0]['credentials']['url'];
	db.connect(url);
} else {
	db.connect('mongodb://localhost/test');
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
var MongoStore = require('connect-mongo')(express)
	, sessionStore = new MongoStore({mongoose_connection: db.connections[0]})
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

passport.use(new LocalStrategy(Users.strategy));

app.use(passport.initialize());
app.use(passport.session());

// Set up an administrator account
Users.get('admin', function(err, user) {
	if (!user) {
		console.log('No administrator found, generating account.');
		Users.register('admin', 'admin@wigslace', process.env.ADMIN_PASS || 'devadminpass', function(err, success, message) {
			if (!err && success) { console.log('Admin generated sucessfully'); }
		});
	}
});

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
	, info: req.flash('info')
	, user: req.user
	};
}

// Index page
app.get('/', function(req, res) {
	if (req.user) { res.redirect('/chat'); }
	else { res.render('index.html', getContext(req)); }
});

// Chat page
app.get('/chat', function(req, res) {
	if (!req.user) { res.redirect('/'); }
	else { res.render('chat.html', getContext(req)); }
});

// User management
app.get('/register', function(req, res) {
	if (req.user) { res.redirect('/'); }
	else { res.render('register.html', getContext(req)); }
});
app.post('/register', function(req, res) {
	var post = req.body;
	// Make sure the fields are valid
	try {
		validator.check(post.username, 'Please enter a username.').notEmpty();
		validator.check(post.email, 'Please enter a valid email address.').isEmail();
		validator.check(post.password, 'Please ensure your password is at least 6 characters long.').len(6);
		validator.check(post.password, 'Please enter the same password twice.').equals(post.password_confirm);
	}
	catch (e) {
		req.flash('error', e.message);
		res.redirect('/register');
		return;
	}

	// Attempt to register the user
	Users.register(post.username, post.email, post.password, function(err, success, message) {
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

app.get('/recover', function(req, res) {
	if (req.user) { res.redirect('/'); }
	else { res.render('recover.html', getContext(req)); }
});
app.post('/recover', function(req, res) {
	var url = req.protocol + '://' + req.get('host') + '/recover/';

	// Make sure the email is valid
	try { validator.check(req.body.email, 'Please enter a valid email address.').isEmail(); }
	catch (e) {
		req.flash('error', e.message);
		res.redirect('/recover');
		return;
	}

	Users.recover(req.body.email, url, function(err, success, message) {
		if (!success) {
			req.flash('error', message);
			res.redirect('/recover');
		} else {
			req.flash('info', 'A recovery email has been dispatched.');
			res.redirect('/login');
		}
	});
});

app.get('/recover/:token', function(req, res) {
	Users.recoverToID(req.params.token, function(err, id) {
		if (!id) {
			req.flash('error', 'Invalid recovery token.');
			res.redirect('/recover');
		} else {
			var context = getContext(req);
			context.needsPassword = false;
			res.render('reset-password.html', context);
		}
	});
});
app.post('/recover/:token', function(req, res) {
	var token = req.params.token;
	Users.recoverToID(token, function(err, id) {
		if (!id) {
			req.flash('error', 'Invalid recovery token.');
			res.redirect('/recover');
		} else {
			// Make sure the password & confirm match
			try { validator.check(req.body.password, 'Please enter the same password twice.').equals(req.body.password_confirm); }
			catch (e) {
				req.flash('error', e.message);
				res.redirect('/recover');
				return;
			}

			Users.changePassword(id, req.body.password, function(err, success) {
				if (success) {
					Users.deleteRecovery(token);
					req.flash('info', 'Password changed successfully.');
					res.redirect('/login');
				} else {
					req.flash('error', 'Something went wrong.');
					res.redirect('/recover/'+token);
				}
			});
		}
	});
});

app.get('/login', function(req, res) {
	if (req.user) { res.redirect('/'); }
	else { res.render('login.html', getContext(req)); }
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
		message = validator.sanitize(message).escape();

		// broadcast
		io.sockets.emit('broadcast', {user: socket.handshake.user, message: message});
	});
});

// Start the server
server.listen(process.env.VCAP_APP_PORT || 8080);