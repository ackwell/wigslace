// App routes file

// Create a base data object for template context
function getContext(req) {
	var host = req.protocol + '://' + req.get('host');

	return {
		site_url: host,
		page_url: host + req.url
	};
}

// Index page
function index(req, res) {
	data = getContext(req);

	data.loggedIn = req.session.username != null;

	res.render('chat.html', data);
}

// Login page
function login(req, res) {
	data = getContext(req);
	console.log(req.body, req.query, req.session);

	// If already logged in, redirect to (edit)? profile page (once i have users lol)

	// If there is username postdata, save it to the session and redirect
	if (req.body.username != null) {
		req.session.username = req.body.username;
		var url = '/';

		if (req.query.redirect != null) 
			var url = req.query.redirect;
		res.redirect(url);
	}

	res.render('login.html', data);
}

function setup(app) {
	app.get('/', index);
	app.all('/login', login);
}

module.exports.setup = setup;