
// Requires
var config = require('./config')
  , express = require('express')
  , http = require('http')
  , requireDir = require('require-dir');

// Set up the server
var app = express()
  , server = http.createServer(app);

// Test - catchall route so i can possibly dynamically run routes
var routes = requireDir('./routes', {recurse: true});
app.get('/*', function(req, res) {
	console.log(routes);
	res.send(req.path);
});

// Start the server
server.listen(config.server.port);
