// Requires
var bcrypt = require('bcrypt');

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

/*
smtp.send({
	text: 'This is a system test'
, from: 'Wigslace <wigslace@ackwell.com.au>'
, to: 'ackwell <saxon@ackwell.com.au>'
, subject: 'Testing Wigslace emailjs'
}, function(err, message) { console.log(err || message); })
*/

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
							.set('users:email:'+email, username)
							.set('users:hash:'+username, hash)
							.hmset('users:data:'+username, {
								'id': username
							, 'email': email
							})
							.exec(function(err, replies) {
								if (err) { return done(err); }
								return done(null, true)
							});
					});
				});
		}

	, recover: function(email, done) {
			// Make sure the email is valid
			client.sismember('users:emails', email, function(err, exists) {
				if (!exists) { return done(null, false, "No user with that email."); }
				// email is valid - get their ID from the user:email:(address) store,
				// reset the password to something random, and send them an email
			});
		}

		// Check if the ID passed in is a valid user
	, is: function(id, done) {
			client.sismember('users:ids', id, done);
		}

		// Return all the data related to a user
	, get: function(id, done) {
			client.hgetall('users:data:'+id, function(err, user) {
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
