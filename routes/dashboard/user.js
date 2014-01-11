var validator = require('validator');

module.exports = {
	':pane': function(req, res) {
		if (!req.user) { return res.redirect('/'); }
		var template = 'dashboard/user/'+req.params.pane+'.html';
		res.render(template, wigslace.getContext(req), function(err, html) {
			if (err) {
				return wigslace.throw404(req, res);
			}

			// pjax it up
			if (req.headers['x-pjax']) {
				res.send(html);
			} else {
				var context = wigslace.getContext(req);
				context.pjaxContent = html;
				res.render('dashboard/index.html', context);
			}
		});
	},

	// Change passwords
	'password$post': function(req, res) {
		if (!req.user) { return res.send({type: 'error', message: 'You are not logged in.'}); }
		var post = req.body;

		// Validate passwords
		try {
			validator.check(post.password, {
				len: 'Please ensure your password is at least 6 characters long.'
			, equals: 'Please enter the same password twice.'
			}).len(6).equals(post.password_confirm);
		}
		catch (e) {
			return res.send({type: 'error', message: e.message});
		}

		wigslace.models.users.checkPassword(req.user.name, post.password_original, function(err, correct) {
			if (err) { return res.send({type: 'error', message: 'Something went wrong checking your password.'}); }
			if (!correct) { return res.send({type: 'error', message: 'Your old password is incorrect.'}); }
			// All the checks have passed, we can finally change their password
			wigslace.models.users.changePassword(req.user.name, post.password, function(err) {
				if (err) { return res.send({type: 'error', message: 'Something went wrong saving your new password.'}); }
				res.send({type: 'success', message: 'New password set.'});
			});
		});
	}
}
