// Requires
var bcrypt = require('bcrypt')
	, randomstring = require('randomstring');

/*
 * Email services
 */
var email = require('emailjs')
	, smtp = email.server.connect({
			user: 'wigslace@ackwell.com.au'
		, password: process.env.EMAIL_PASSWORD
		, host: 'smtp.gmail.com'
		, ssl: true
		});

// Need reference to the database object
module.exports = function(db) {
	// User account schema
	var userSchema = db.Schema({
		id: String
	, email: String
	, hash: String
	});

	// Recovery key schema
	recoverySchema = db.Schema({
		id: String
	, token: String
	, created: {type: Date, expires: '12h'}
	});
	var Recovery = db.model('Recovery', recoverySchema)

	// Register a new user
	userSchema.statics.register = function(username, email, password, done) {
		var model = db.model('User');
		// Search for users with the same id/email
		model.findOne({$or: [{id: username}, {email: email}]}, function(err, user) {
			if (err) { return done(err); }
			// If the user exists, chuck a hissy
			if (user) {
				if (user.id == username) { return done(null, false, "That username is already taken."); }
				else if (user.email == email) { return done(null, false, "That email has already been used."); }
			}
			// Create a password hash
			bcrypt.hash(password, 5, function(err, hash) {
				if (err) { return done(err); }
				// Create a new user and save it to the db
				var newUser = new model({
					id: username
				, email: email
				, hash: hash
				});
				newUser.save(function(err, newUser) {
					if (err) { return done(err); }
					return done(null, true);
				});
			});
		});
	}

	// Password recovery stuff
	userSchema.statics.recover = function(email, returnURL, done) {
		var model = db.model('User');
		// Get user with specified email, if none exists, chuck a hissy
		model.findOne({email: email}, function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false, "No user with that email."); }
			// Generate a random string to serve the recovery page with
			var token = randomstring.generate();
			var newRecovery = new Recovery({
				id: user.id
			, token: token
			, created: new Date
			});
			newRecovery.save(function(err, newRecovery) {
				if (err) { return done(err); }
				var link = returnURL + token;
				smtp.send({
					text: 'If you did not request this password reset, please ignore this email, the link will expire in 12 hours. To reset your wigslace password, please visit the following link: '+link
				, from: 'Wigslace <wigslace@ackwell.com.au>'
				, to: user.id+' <'+email+'>'
				, subject: 'Wigslace - Recover your account.'
				, attachment: [{
						data:'<html><p>If you did not request this password reset, please ignore this email, the link will expire in 12 hours.</p><p>To reset your wigslace password, please visit the following link: <a href="'+link+'">'+link+'</a></p></html>'
					, alternative: true
					}]
				}, function(err, message) {
					if (err) { return done(err); }
					return done(null, true);
				});
			});
		});
	}

	// Return the user id of the given recovery token
	userSchema.statics.recoverToID = function(token, done) {
		Recovery.findOne({token: token}, function(err, recovery) {
			if (err) { return done(err); }
			if (!recovery) { return done(null, false); }
			return done(null, recovery.id);
		});
	}

	userSchema.statics.deleteRecovery = function(token) {
		Recovery.findOneAndRemove({token: token}).exec();
	}

	userSchema.statics.changePassword = function(id, password, done) {
		var model = db.model('User');
		bcrypt.hash(password, 5, function(err, hash) {
			if (err) { return done(err); }
			model.findOneAndUpdate({id: id}, {hash: hash}, done);
		})
	}

	// Used for Passport.js LocalStrategy implementation
	userSchema.statics.strategy = function(username, password, done) {
		var model = db.model('User');
		model.findOne({id: username}).lean().exec(function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false, {message: 'That user does not exist.'}); }
			bcrypt.compare(password, user.hash, function(err, correct) {
				if (correct) { model._getUser(user, done); }
				else { return done(null, false, {message: 'Incorrect password.'}); }
			});
		});
	}

	// Return data related to a user
	userSchema.statics.get = function(id, done) {
		var model = db.model('User');
		model.findOne({id: id}).lean().exec(function(err, user) {
			if (err) { return done(err); }
			model._getUser(user, done);
		});
	}

	// Given a JS object of a user, callback with the user object expected.
	userSchema.statics._getUser = function(user, done) {
		// Currently just using this to get rid of the hash attribute
		if (user) {
			delete user.hash;
		}
		return done(null, user);
	}

	return db.model('User', userSchema);
}