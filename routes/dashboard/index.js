
module.exports = function(req, res) {
	if (!req.user) { return res.redirect('/'); }
	res.render('dashboard/index.html', wigslace.getContext(req));
}
