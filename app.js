
// Requires
var config = require('./config')
  , express = require('express')
  , http = require('http')
  , socketio = require('./socketio')
  , Wigslace = require('./wigslace');

// Set up the server
var app = express()
  , server = http.createServer(app);

// Instantiate the core class. Setup is seperate to allow access to wigslace global
global.wigslace = new Wigslace(app);
wigslace.setUp();

// Set up Socket.IO
socketio.setUp(server);

// Catch any remianing requests, and 404 them.
app.all('/*', function(req, res) {
	wigslace.throw404(req, res);
});

// Start the server
server.listen(config.server.port);
