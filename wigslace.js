
var config = require('./config')
  , mongoose = require('mongoose')
  , requireDir = require('require-dir');

// Wigslace object
// This is the core 'class' of the server
function Wigslace(app) {
	this.app = app;
	this.config = config;

	this.setUpDatabase();
	this.setUpRoutes()
}

// Load the database, require the modules, as set them up.
Wigslace.prototype.setUpDatabase = function() {
	// Connect to the DB
	mongoose.connect(this.config.server.database);

	// Pull in all the models
	this.models = requireDir('./models');

	// Instanciate all the models
	for (var key in this.models) {
		this.models[key] = this.models[key](mongoose);
	}
}

// Load the routes directory as an object, then recurse to generate routes
Wigslace.prototype.setUpRoutes = function() {
	this.routes = requireDir('./routes', {recurse: true});
	this.recurseRoutes('/', this.routes);
}

Wigslace.prototype.recurseRoutes = function(path, route) {
	// Loop over current tier of routes
	for (var key in route) {
		// Grab the URL segment we'll be using (index is blank)
		var segment = key;
		var split = segment.split('|');
		if (split[0] === 'index') {
			split[0] = '';
			segment = split.join('|')
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

// Throws an HTTP404 error to the client.
Wigslace.prototype.throw404 = function(req, res) {
	res.send(404, "This is a 404");
}

module.exports = Wigslace;
