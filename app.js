// Requires
var express = require('express')
	, cons = require('consolidate')
	, http = require('http')
	, socketio = require('socket.io')
	, swig = require('swig')
	// my stuff
	, routes = require('./routes')
	, sockets = require('./sockets');

// Set up the server, app, etc
var app = express()
	, server = http.createServer(app)
	, io = socketio.listen(server);

// Initiate the templating engine
app.engine('.html', cons.swig);
app.set('view engine', 'html');
swig.init({
	root: __dirname + '/templates/',
	allowErrors: true,
	cache: false // FOR DEV ONLY
});
app.set('views', __dirname + '/templates/');

// Enable cookie-based sessions
app.use(express.cookieParser());
app.use(express.cookieSession({secret: 's1@J&Pa#6CePl1FA7FMa'}));

// Handle post/etc data sent to the server
app.use(express.bodyParser())

// Serve static files
app.use('/static', express.static(__dirname + '/public'));

// Import the path routes
routes.setup(app);

// Sockets
sockets.setup(io);

// Start the server
server.listen(8080);