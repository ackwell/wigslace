
// Requires
var connectFlash = require('connect-flash')
  , connectMongo = require('connect-mongo')
  , express = require('express')
  , less = require('less-middleware')
  , mongoose = require('mongoose')
  , requireDir = require('require-dir')
  , swig = require('swig');

// Wigslace object
// This is the core 'class' of the server
function Wigslace(app) {
	this.app = app;
	this.config = requireDir('./config');

	this.dir = require('path').dirname(require.main.filename);
}

// Set up the various bits and pieces of the server
Wigslace.prototype.setUp = function() {
	this.setUpTemplating();
	this.setUpDatabase();
	this.setUpSessions();
	this.models.users.setUpPassport();
	this.setUpRoutes();
}

// Set up templating engine
Wigslace.prototype.setUpTemplating = function() {
	// Swig init
	this.app.engine('html', swig.renderFile);
	this.app.set('view engine', 'html');
	this.app.set('views', __dirname + '/templates');
	swig.setDefaults({cache: this.config.server.production});

	// LESS init
	this.app.use(less({
	  src: __dirname + '/static'
	, compress: true
	}));
}

// Load the database, require the modules, as set them up.
Wigslace.prototype.setUpDatabase = function() {
	// Connect to the DB
	mongoose.connect(this.config.server.database);

	// Pull in all the models
	this.models = requireDir('./models');

	// Instanciate all the models
	for (var key in this.models) {
		this.models[key] = new this.models[key](mongoose);
	}
}

// Set up session handling
Wigslace.prototype.setUpSessions = function() {
	var MongoStore = connectMongo(express)
	this.sessionStore = new MongoStore({mongoose_connection: mongoose.connections[0]});

	this.app.set('secretKey', this.config.sessions.key);
	this.app.set('cookieSessionKey', 'sid');

	this.app.use(express.cookieParser(this.app.get('secretKey')));
	this.app.use(express.bodyParser());
	this.app.use(express.session({
	  key: this.app.get('cookieSessionKey')
	, store: this.sessionStore
	}));
	this.app.use(connectFlash());
}

// Set up the server's routing
Wigslace.prototype.setUpRoutes = function() {
	// Handle static files
	this.app.use(express.favicon(__dirname + '/static/favicon.ico'));
	this.app.use(express.static(__dirname + '/static'));

	// Dynamically set up routes
	this.routes = requireDir('./routes', {recurse: true});
	this.recurseRoutes('/', this.routes);

	// Catch any remaining requests, and 404 them.
	this.app.all('/*', function(req, res) {
		wigslace.throw404(req, res);
	});
}

Wigslace.prototype.recurseRoutes = function(path, route) {
	// Loop over current tier of routes
	for (var key in route) {
		// Grab the URL segment we'll be using (index is blank)
		var segment = key;
		var split = segment.split('$');
		if (split[0] === 'index') {
			split[0] = '';
			segment = split.join('$')
		}

		// If the route is a function, add it to the route and gtfo
		if (typeof route[key] === 'function') {
			var method = 'get';

			// Check if a request method was given
			if (split.length == 2) {
				segment = split[0];
				method = split[1];
			}

			this.app[method](path+segment, route[key]);
			console.log('Added '+method+' route: '+path+segment);

			continue;
		}

		// Otherwise, it's another level of routing, recurse.
		this.recurseRoutes(path+segment+'/', route[key]);
	}
}

// Creates a context object from the request
Wigslace.prototype.getContext = function(req) {
	var host = req.protocol + '://' + req.get('host');

	return {
	  siteURL: host
	, pageURL: host + req.url
	, page: 'page' + req.url.split('/').join('-')
	, errors: req.flash('error')
	, info: req.flash('info')
	, user: req.user
	};
}

// Throws an HTTP404 error to the client.
Wigslace.prototype.throw404 = function(req, res) {
	res.send(404, 'This is a 404<br/><a href="/">Go to the home page</a>');
}

module.exports = Wigslace;
