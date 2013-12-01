
// Requires
var config = require('./config')
  , express = require('express')
  , http = require('http')
  , Wigslace = require('./wigslace');

// Set up the server
var app = express()
  , server = http.createServer(app);

// Instantiate the core class
global.wigslace = new Wigslace(app);
wigslace.setUp();

// Catch any remianing requests, and 404 them.
app.all('/*', function(req, res) {
	wigslace.throw404(req, res);
});

// Start the server
server.listen(config.server.port);
