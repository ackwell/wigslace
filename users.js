// Requires
var bcrypt = require('bcrypt');

// Need reference to the database object
module.exports = function(client) {
	// Users model
	var Users = 
		// Register a new user
	{ register: function(username, email, password, done) {

		}

		// Check if the ID passed in is a valid user
	, is: function(id, done) {
			client.sismember('users:ids', id, done);
		}

		// Return all the data related to a user
	, get: function(id, done) {
			client.hgetall('users:data:'+id, function(err, user) {
				user.id = id;
				return done(err, user);
			});
		}

		// Validate a user's password
	, validate: function(id, password, done) {
			client.get('users:hash'+id, function(err, hash) {
				bcrypt.compare(password, hash, done);
			});
		}
	};

	return Users;
}
