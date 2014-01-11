
module.exports = function(req, res) {
	if (!req.user) { return res.redirect('/'); }
	var context = wigslace.getContext(req);
	context.pjaxContent = '<span class="loading">Loading...</span>';
	res.render('dashboard/index.html', context);
}
