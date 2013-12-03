
module.exports = {
	index: function(req, res) {
		if (!req.user) { res.redirect('/'); }
		else { res.render('chat.html', wigslace.getContext(req)); }
	}
}
