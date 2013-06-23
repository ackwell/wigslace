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

	, recover: function(email, returnURL, done) {
			// Grab the email
			client.get('users:email:'+email, function(err, username) {
				// If the email isn't used, chuck a hissy
				if (!username) { return done(null, false, "No user with that email."); }
				// Generate a random string to serve their recover page with
				var token = randomstring.generate();
				// Expires after 12 hours
				client.setex('users:recover:'+token, 43200, username, function(err, success) {
					// Woo more comments. Send them their recovery email
					var link = returnURL + token;
					smtp.send({
						text: 'If you did not request this password reset, please ignore this email, the link will expire in 12 hours. To reset your wigslace password, please visit the following link: '+link
					, from: 'Wigslace <wigslace@ackwell.com.au>'
					, to: username+' <'+email+'>'
					, subject: 'Wigslace - Recover your account.'
					, attachment: [{
							data:'<html><p>If you did not request this password reset, please ignore this email, the link will expire in 12 hours.</p><p>To reset your wigslace password, please visit the following link: <a href="'+link+'">'+link+'</a></p></html>'
						, alternative: true
						}]
					}, function(err, message) {
						if (err) { return done(err, false); }
						return done(null, true);
					});
				}); 
			});
		}

		// Return the user id of the given recovery token
	, recoverToID: function(token, done) {
			client.get('users:recover:'+token, done);
		}

	, deleteRecover: function(token) {
			client.del('users:recover:'+token);
		}

	, changePassword: function(id, password, done) {
			bcrypt.hash(password, 5, function(err, hash) {
				if (err) { return done(err); }
				client.set('users:hash:'+id, hash, done);
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
