
// Requires
var config = require('./config')
  , express = require('express')
  , http = require('http')
  , requireDir = require('require-dir');

// Set up the server
var app = express()
  , server = http.createServer(app);

// Wigslace object
// This is the core 'class' of the server
function Wigslace(app) {
	this.app = app;
	this.routes = requireDir('./routes', {recurse: true});
}

// Routes requests based on the  url path
Wigslace.prototype.routeRequest = function(req, res) {
	// If the request is to '/', redirect to the index controller
	// TODO

	var path = req.path.split('/');
	// Skip first index, always empty
	// TODO
}

// Instantiate the core class
var wl = new Wigslace(app);

// Catch all requests to the server and route them via the Wigslace object
app.all('/*', function(req, res) {
	res.send(req.path);
});

// Start the server
server.listen(config.server.port);
