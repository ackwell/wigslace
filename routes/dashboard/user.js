var fs = require('fs')
  , gm = require('gm')
  , mkdirp = require('mkdirp')
  , validator = require('validator');

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
	password$post: function(req, res) {
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
	},

	// Change avatar
	avatar$post: function(req, res) {
		if (!req.user) { return res.send({type: 'error', message: 'You are not logged in.'}); }

		var avatar = req.files.avatar
		  , valid = true;

		// Only process avatar if new one uploaded.
		if (avatar.size) {

			// Make sure it's an image
			try {
				validator.check(avatar.type, 'File uploaded was not an image.').contains('image');
			} catch (e) {
				// req.flash('error', e.message);
				response = {type: 'error', message: e.message};
				valid = false;
			}

			// Limit file size to 4mb (pretty generous really)
			if (avatar.size/1024/1024 > 4) {
				// req.flash('error', 'File is larger than 4mb.');
				response = {type: 'error', message: 'File is larger than 4Mb.'};
				valid = false;
			}

			var response = {}

			// If it's valid, resize, move into place, save to user object
			if (valid) {
				var buf = fs.readFileSync(avatar.path)
					, path = '/uploads/avatars/'+req.user.name+'/'
					, sizes = [200, 40, 20];

				sizes.forEach(function(size) {
					var localPath = wigslace.dir+'/static'+path;

					mkdirp.sync(localPath);
					gm(buf, avatar.name)
						.resize(size, size)
						.write(localPath+size.toString()+'.png', function(err) {
							if (err) {
								console.log(err);
								valid = false;
							}
						});
				});

				if (valid) {
					req.user.avatar = path;
					response = {type:'info', message:'Avatar updated. (Might take a few seconds to be visible site-wide)'};
				} else { response = {type:'error', message:'Something went wrong.'}; }
			}
		}
		// Delete the temp file
		fs.unlink(avatar.path);

		// Save the (possibly) edited user object back to the db
		if (valid) {
			wigslace.models.users.edit(req.user, function(err) {
				if (err) { return res.send({type: 'error', message: 'Avatar could not be saved. Please try again at a later time.'}); }
				res.send(response);
			});
		}
	},

	chat$post: function(req, res) {
		if (!req.user) { return res.send({type: 'error', message: 'You are not logged in.'}); }
		var post = req.body
		  , settings = {};

		settings.useXHR = post.useXHR == 'true';

		req.user.settings = settings;
		wigslace.models.users.edit(req.user, function(err) {
			if (err) { return res.send({type: 'error', message: 'Settings could not be saved. Please try again at a later time.'}); }
			res.send({type: 'success', message: 'Settings saved.'});
		});
	}
}
