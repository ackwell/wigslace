
// Requires
var bcrypt = require('bcrypt')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

function User(db) {
	this.db = db;

	this.setUpSchemas();
	this.setUpInitialUsers();
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

// Save users in the config into the database
User.prototype.setUpInitialUsers = function() {
	if (!wigslace.config.users) { return; }

	var self = this;

	for (var i = 0; i < wigslace.config.users.length; i++) {
		// Function only used to scope because lol async
		(function(details) {
			self.get(details.id, function(err, user) {
				if (!user) {
					console.log('User ' + details.id + ' not found. Generating');
					self.registerRaw(details, function(err, success, message) {
						if (!err && success) { console.log(details.id + ' has been generated.'); }
					});
				}
			})
		})(wigslace.config.users[i]);
	}
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
	  , avatars = wigslace.config.defaults.avatars
	  , self = this;

	if (avatars.hasOwnProperty(data.id)) {
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
		bcrypt.hash(data.password, 5, function(err, hash) {
			if (err) { return done(err); }

			// Create new user and save it to the database
			data.hash = hash;
			var newUser = new self.User(data);
			newUser.save(function(err, newUser) {
				if (err) { return done(err); }
				return done(null, true);
			});
		});
	});
}

// Password recovery
User.prototype.recover = function(email, returnURL, done) {
	// NEED TO DO EMAIL SHIT HERE AND STUFF
}

// Return the user id of the given recovery token
User.prototype.recoverToID = function(token, done) {
	this.Recovery.fineOne({token: token}, function(err, recovery) {
		if (err) { return done(err); }
		if (!recovery) { return done(null, false); }
		return done(null, recovery.id);
	})
}

// Delete a recovery token
User.prototype.deleteRecovery = function(token) {
	this.Recovery.findOneAndRemove({token: token}).exec();
}

// Change the password for the specified ID
User.prototype.changePassword = function(id, password, done) {
	var self = this;
	bcrypt.hash(password, 5, function(err, hash) {
		if (err) { return done(err); }
		self.User.findOneAndUpdate({id: id}, {hash: hash}, done);
	});
}

// Modify user data
User.prototype.edit = function(data) {
	var id = data.id;

	delete user.id;
	delete user.hash; // Just in case it got in there somehow

	this.User.findOneAndUpdate({id: id}, user, function(err) {
		if (err) { console.log(err); }
	});
}

// Passport.js LocalStrategy implementation
User.prototype.strategy = function(username, password, done) {
	var self = this;
	this.checkPassword(username, password, function(err, correct, data) {
		if (correct) { return self.get(username, done); }

		var message = "Incorrect password.";
		if (data && data.message) {
			message = data.message;
		}
		return done(null, false, {message: message});
	});
}

User.prototype.checkPassword = function(username, password, done) {
	this.User.findOne({id: username}).lean().exec(function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false, {message: "That user does not exist."}); }
		bcrypt.compare(password, user.hash, done);
	});
}

// Get the user data for the specified ID
User.prototype.get = function(id, done) {
	this.User.findOne({id: id}).lean().exec(function(err, user) {
		if (err) { return done(err); }

		// Get rid of mongo stuff
		if (user) {
			delete user.hash;
			delete user._id;
			delete user.__v;
		}
		return done(null, user);
	});
}

module.exports = User;