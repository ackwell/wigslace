
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
	}
}
