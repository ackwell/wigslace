
// Site home page
module.exports = function(req, res) {
	if (req.user) { return res.redirect('/chat/'); }
	res.render('index.html', wigslace.getContext(req));
}
