
// Requires
var passport = require('passport');

module.exports = {
  // Login page. Redirect to / if already logged in
  login: function(req, res) {
		if (req.user) { res.redirect('/'); }
		else { res.send('Login page'); }
  }

  // POST to login form
, login$post: passport.authenticate('local', {
	  successRedirect: '/'
	, failureRedirect: '/login'
	, failurFlash: true
  })
	
	// Log out and redirect to /
, logout: function(req, res) {
		req.logout();
		res.redirect('/');
  }
}
