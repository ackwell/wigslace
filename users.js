// Requires
var bcrypt = require('bcrypt');

// Need reference to the database object
module.exports = function(client) {
	// Users model
	var Users = {
		// Register a new user
		register: function(username, email, password, done) {
			// Make sure the user doesn't exist already
			client.multi()
				.sismember('users:ids', username)
				.sismember('users:emails', email)
				.exec(function(err, replies) {
					if (err) { return done(err); }
					if (replies[0]) { return done(null, false, "That username is already taken."); }
					if (replies[1]) { return done(null, false, "That email has already been used."); }
					// Create a password hash
					bcrypt.hash(password, 5, function(err, hash) {
						if (err) { return done(err); }
						// Save the user to the database
						client.multi()
							.sadd('users:ids', username)
							.sadd('users:emails', email)
							.set('users:hash:'+username, hash)
							.exec(function(err, replies) {
								if (err) { return done(err); }
								return done(null, true)
							});
					});
				});
		}

		// Check if the ID passed in is a valid user
	, is: function(id, done) {
			client.sismember('users:ids', id, done);
		}

		// Return all the data related to a user
	, get: function(id, done) {
			client.hgetall('users:data:'+id, function(err, user) {
				if (!user) { user = {}; }
				user.id = id;
				return done(err, user);
			});
		}

		// Validate a user's password
	, validate: function(id, password, done) {
			client.get('users:hash:'+id, function(err, hash) {
				bcrypt.compare(password, hash, done);
			});
		}
	};

	return Users;
}
