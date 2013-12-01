
// Requires
var passport = require('passport');

module.exports = {
  // Login page. Redirect to / if already logged in
  login: function(req, res) {
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
}
