
// Requires
var passport = require('passport')
  , validator = require('validator');

module.exports = {
  // Register new user
  register: function(req, res) {
  	if (req.user) { return res.redirect('/'); }
  	res.render('register.html', wigslace.getContext(req));
  }

  // POST to register form
, register$post: function(req, res) {
  	var post = req.body;
		// Make sure the fields are valid
		try {
			// Username
			validator.check(post.username, {
			  notEmpty: 'Please enter a username.'
			, isAlphanumeric: 'Usernames must be alphanumeric.'
			, len: 'Usernames must be between 2 and 25 characters'
			}).notEmpty().isAlphanumeric().len(2, 25);

			// Email
			validator.check(post.email, 'Please enter a valid email address.').isEmail();

			// Password
			validator.check(post.password, {
			  len: 'Please ensure your password is at least 6 characters long.'
			, equals: 'Please enter the same password twice.'
			}).len(6).equals(post.password_confirm);
		}
		catch (e) {
			// They got something wrong, chuck a hissy
			req.flash('error', e.message);
			res.redirect('/auth/register');
			return;
		}

		// Attempt to register the user
		post.name = post.username;
		wigslace.models.users.registerRaw(post, function(err, success, message) {
			if (success) {
				// Grab user data, log them in, redirect to index
				wigslace.models.users.get(post.username, function(err, user) {
					req.login(user, function(err) {
						res.redirect('/');
					});
				});
			} else {
				// Shove an error at them, refresh
				if (message) { req.flash('error', message); }
				res.redirect('/auth/register');
			}
		});
  }

  // Login page. Redirect to / if already logged in
, login: function(req, res) {
		if (req.user) { return res.redirect('/'); }
		res.render('login.html', wigslace.getContext(req));
  }

  // POST to login form
, login$post: passport.authenticate('local', {
	  successRedirect: '/'
	, failureRedirect: '/auth/login'
	, failureFlash: true
  })
	
	// Log out and redirect to /
, logout: function(req, res) {
		req.logout();
		res.redirect('/');
  }

  // Account recovery
, recover: function(req, res) {
		if (req.user) { return res.redirect('/'); }
		res.render('recover.html', wigslace.getContext(req));
  }

, recover$post: function(req, res) {
		var url = req.protocol + '://' + req.get('host') + '/auth/recover/';

		// Make sure the email is valid
		try { validator.check(req.body.email, 'Please enter a valid email address.').isEmail(); }
		catch (e) {
			req.flash('error', e.message);
			res.redirect('/auth/recover');
			return;
		}

		wigslace.models.users.recover(req.body.email, url, function(err, success, message) {
			if (!success) {
				req.flash('error', message);
				res.redirect('/auth/recover');
			} else {
				req.flash('info', 'A recovery email has been dispatched.');
				res.redirect('/auth/login');
			}
		});
  }

, 'recover/:token': function(req, res) {
  	wigslace.models.users.recoverToID(req.params.token, function(err, id) {
			if (!id) {
				req.flash('error', 'Invalid recovery token.');
				res.redirect('/auth/recover');
			} else {
				var context = wigslace.getContext(req);
				res.render('reset-password.html', context);
			}
		});
  }

, 'recover/:token$post': function(req, res) {
  	var token = req.params.token;
		wigslace.models.users.recoverToID(token, function(err, id) {
			if (!id) {
				req.flash('error', 'Invalid recovery token.');
				res.redirect('/auth/recover');
			} else {
				// Make sure the password & confirm match
				try {
					validator.check(req.body.password, 'Please enter the same password twice.').equals(req.body.password_confirm);
				}
				catch (e) {
					req.flash('error', e.message);
					res.redirect('/auth/recover');
					return;
				}

				wigslace.models.users.changePassword(id, req.body.password, function(err, success) {
					if (success) {
						wigslace.models.users.deleteRecovery(token);
						req.flash('info', 'Password changed successfully.');
						res.redirect('/auth/login');
					} else {
						req.flash('error', 'Something went wrong.');
						res.redirect('/auth/recover/'+token);
					}
				});
			}
		});
  }
}
