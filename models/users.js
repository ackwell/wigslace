
// Requires
var bcrypt = require('bcrypt')
  , emailjs = require('emailjs')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , randomstring = require('randomstring');

function User(db) {
	this.db = db;

	this.setUpSMTP();
	this.setUpSchemas();
	this.setUpInitialUsers();
}

// Set up the email sender
User.prototype.setUpSMTP = function() {
	var config = wigslace.config.email;
	this.smtp = emailjs.server.connect(config);
}

User.prototype.setUpSchemas = function() {
	// Schema for user accounts
	var userSchema = this.db.Schema({
	  name: String
	, email: String
	, hash: String
	, avatar: String
	, permissions: {
		  site: {type: Boolean, default: true}
		, chat: {type: Boolean, default: true}
		, admin: {type: Boolean, default: false}
	  }
	, settings: {
		  useXHR: {type: Boolean, default: false}
	  }
	});
	this.User = this.db.model('User', userSchema);

	// Schema for account recovery keys
	var recoverySchema = this.db.Schema({
	  user: {type: this.db.Schema.ObjectId, ref: 'User'}
	, token: String
	, created: {type: Date, expires: '12h'}
	});
	this.Recovery = this.db.model('Recovery', recoverySchema);
}

// Save users in the config into the database
User.prototype.setUpInitialUsers = function() {
	var users = wigslace.config.defaults.users;
	if (!users) { return; }

	var self = this;

	for (var i = 0; i < users.length; i++) {
		// Function only used to scope because lol async
		(function(details) {
			self.get(details.name, function(err, user) {
				if (!user) {
					console.log('User ' + details.name + ' not found. Generating');
					self.registerRaw(details, function(err, success, message) {
						if (!err && success) { console.log(details.name + ' has been generated.'); }
					});
				}
			})
		})(users[i]);
	}
}

// Set up the passportjs athentication system
User.prototype.setUpPassport = function() {
	var self = this;

	// Passport config
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});
	passport.deserializeUser(function(name, done) {
		self.getBy('_id', name, done);
	});
	passport.use(new LocalStrategy(this.strategy));

	// Tell the app to use it
	wigslace.app.use(passport.initialize());
	wigslace.app.use(passport.session());
}

// Register a new user
User.prototype.register = function(username, email, password, done) {
	var data = {
	  name: username
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

	if (avatars.hasOwnProperty(data.name)) {
		avatar = avatars[data.name];
	} else {
		avatar = avatars.members[Math.floor(Math.random()*avatars.members.length)];
	}

	data.avatar = avatar;

	// Search for users with the same name/email
	this.User.findOne({$or: [{name: data.name}, {email: data.email}]}, function(err, user) {
		if (err) { return done(err); }

		// If the user already exists, chuck a hissy
		if (user) {
			if (user.name == data.username) { return done(null, false, "That username is already taken."); }
			else if (user.email == data.email) { return done(null, false, "That email has already been used."); }
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
	var self = this;
	
	// Get the user with the specified email. If none exists, chuck hissy.
	this.User.findOne({email: email}, function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false, "No user with that email."); }

		// Generate a random string for the token, and form the recovery entry
		var token = randomstring.generate()
		  , newRecovery = new self.Recovery({
		  	  user: user._id
		  	, token: token
		  	, created: new Date
		    });

		// Save the recovery to the database
		newRecovery.save(function(err, newRecovery) {
			if (err) { return done(err); }

			// Render the email template
			wigslace.app.render('email/recover.html', {
			  id: user.name
			, link: returnURL + token
			}, function(err, html) {
				if (err) { return done(err); }

				// Send email
				self.smtp.send({
				  text: html
				, from: 'Wigslace <'+wigslace.config.email.user+'>'
				, to: user.name + ' <'+email+'>'
				, subject: 'Wigslace - Recover your account ('+user.name+').'
				, attachment: [{
					  data: html
					, alternative: true
				  }]
				}, function(err, message) {
					if (err) { return done(err); }
					return done(null, true);
				});
			});
		});
	});
}

// Return the user name of the given recovery token
User.prototype.recoverToID = function(token, done) {
	this.Recovery
		.findOne({token: token})
		.populate('user')
		.exec(function(err, recovery) {
			if (err) { return done(err); }
			if (!recovery) { return done(null, false); }
			return done(null, recovery.user.name);
		})
}

// Delete a recovery token
User.prototype.deleteRecovery = function(token) {
	this.Recovery.findOneAndRemove({token: token}).exec();
}

// Change the password for the specified ID
User.prototype.changePassword = function(name, password, done) {
	var self = this;
	bcrypt.hash(password, 5, function(err, hash) {
		if (err) { return done(err); }
		self.User.findOneAndUpdate({name: name}, {hash: hash}, done);
	});
}

// Modify user data
User.prototype.edit = function(data, done) {
	var _id = data._id;

	delete data._id;
	delete data.hash; // Just in case it got in there somehow

	this.User.findOneAndUpdate({_id: _id}, data, function(err) {
		return done && done(err)
	});
}

User.prototype.setPermission = function(username, permission, setting, done) {
	var data = {};
	data['permissions.' + permission] = setting;
	this.User.findOneAndUpdate({name: username}, data, done);
}

// Passport.js LocalStrategy implementation
User.prototype.strategy = function(username, password, done) {
	// Stupid shennanigans because LocalStrategy overwrites the 'this' context
	var self = wigslace.models.users;
	self.authenticate(username, password, 'site', done);
}

User.prototype.authenticate = function(username, password, permission, done) {
	var self = this;

	// Check correct login details
	self.checkPassword(username, password, function(err, correct, data) {
		if (!correct) {
			var message = "Incorrect password.";
			if (data && data.message) {
				message = data.message;
			}
			return done(null, false, {message: message});
		}

		// Disallow banned people.
		self.get(username, function(err, user) {
			if (err) { return done(err); }

			if (permission && !user.permissions[permission]) {
				return done(null, false, {message: "You have been banned."});
			}

			return done(null, user);
		});
	});
}

// Compare the given password to that of the speficied user
User.prototype.checkPassword = function(username, password, done) {
	this.User.findOne({name: username}).lean().exec(function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false, {message: "That user does not exist."}); }
		bcrypt.compare(password, user.hash, done);
	});
}

// Get the user data for the specified ID
User.prototype.get = function(name, done) {
	return this.getBy('name', name, done);
}

User.prototype.getBy = function(key, value, done) {
	var search = {};
	search[key] = value;
	this.User.findOne(search).lean().exec(function(err, user) {
		if (err) { return done(err); }

		// Get rid of mongo stuff
		if (user) {
			delete user.hash;
			delete user.__v;
		}
		return done(null, user);
	});
}

module.exports = User;