
module.exports = function(req, res) {
	if (!req.user) { return res.redirect('/'); }
	var context = wigslace.getContext(req);
	context.pjaxContent = 'Loading...'; // Temp
	res.render('dashboard/index.html', context);
}
