
var config = require('./config')
  , mongoose = require('mongoose')
  , requireDir = require('require-dir');

// Wigslace object
// This is the core 'class' of the server
function Wigslace(app) {
	this.app = app;

	this.config = config;
	this.routes = requireDir('./routes', {recurse: true});

	this.setUpDatabase();
}

// Load the database, require the modules, as set them up.
Wigslace.prototype.setUpDatabase = function() {
	// Connect to the DB
	this.db = mongoose;
	this.db.connect(this.config.server.database);

	// Pull in all the models
	this.models = requireDir('./models');

	// Instanciate all the models
	for (var key in this.models) {
		this.models[key] = this.models[key](this.db);
	}
}

// Route requests based on the request's path
Wigslace.prototype.routeRequest = function(req, res) {
	// If the request was not a GET, append _(type) to the path
	var path = req.path;
	if (req.route.method !== 'get') { path += '_' + req.route.method; }

	var path = path.split('/')
	  , route = this.routes;

	// Skip first index, always empty
	for (var i = 1; i < path.length; i++) {
		var segment = path[i];

		// If the segment is blank, try to access 'index' instead
		if (segment.split('_')[0] === '') { segment = 'index' +  segment; }

		// If the current route doesn't have that segment avaliable, 404.
		if (!route.hasOwnProperty(segment)) {
			this.throw404(req, res);
			return;
		}

		// Has an avaliable route, so filter down
		route = route[segment];
	}

	// If the final route isn't a function, 404.
	if (typeof route !== 'function') {
		this.throw404(req, res);
		return;
	}

	// We finally got there - pass the request/response on to the route function.
	route(req, res);
}

// Throws an HTTP404 error to the client.
Wigslace.prototype.throw404 = function(req, res) {
	res.send(404, "This is a 404");
}

module.exports = Wigslace;
