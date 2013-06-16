// App routes file

function setup(app) {
	// Index page
	app.get('/', function (req, res) {
		res.render('chat.html');
	});

	// Login page
	app.get('/login', function (req, res) {
		res.render('login.html');
	});
}

module.exports.setup = setup