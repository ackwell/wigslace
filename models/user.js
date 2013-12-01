
// Requires
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

function User(db) {
	this.db = db;

	this.setUpSchemas();
}

User.prototype.setUpSchemas = function() {
	// Schema for user accounts
	var userSchema = this.db.Schema({
	  id: String
	, email: String
	, hash: String
	, avatar: String
	});
	this.User = this.db.model('User', userSchema);

	// Schema for account recovery keys
	var recoverySchema = this.db.Schema({
	  id: String
	, token: String
	, created: {type: Date, expires: '12h'}
	});
	this.Recovery = this.db.model('Recovery', recoverySchema);
}

// Register a new user
User.prototype.register = function(username, email, password, done) {
	var data = {
	  id: username
	, email: email
	, password: password
	}

	this.registerRaw(data, done);
}

// Register a new user object
User.prototype.registerRaw = function(data, done) {
	// Try and grab an avatar from the config, else use a default
	var avatar = ''
	  , avatars = wigslace.config.defaults.avatars;

	if (avatars.hasOwnProperrty(data.id)) {
		avatar = avatars[data.id];
	} else {
		avatar = avatars.members[Math.floor(Math.random()*avatars.members.length)];
	}

	// Search for users with the same id/email
	this.User.findOne({$or: [{id: data.id}, {email: data.email}]}, function(err, user) {
		if (err) { return done(err); }

		// If the user already exists, chuck a hissy
		if (user) {
			if (user.id == username) { return done(null, false, "That username is already taken."); }
			else if (user.email == email) { return done(null, false, "That email has already been used."); }
		}

		// Create a password hash
	});
}

module.exports = User;