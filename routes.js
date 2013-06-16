// App routes file

// Create a base data object for template context
function getContext(req) {
	var host = req.protocol + '://' + req.get('host');

	return {
		siteURL: host
	, pageURL: host + req.url
	};
}

module.exports = {
	// Index page
	index: function(req, res) {
		data = getContext(req);
		data.loggedIn = req.session.username != null;

		res.render('chat.html', data);
	}

	// Login page
, login: function(req, res) {
		data = getContext(req);
		console.log(req.body, req.query, req.session);

		// If already logged in, redirect to (edit)? profile page (once i have users lol)

		// If there is username postdata, save it to the session and redirect
		if (req.body.username != null) {
			req.session.username = req.body.username;
			var url = '/';

			if (req.query.redirect != null) {
				var url = req.query.redirect;
			}
			res.redirect(url);
		}

		res.render('login.html', data);
	}
}