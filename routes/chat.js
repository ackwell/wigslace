
module.exports = {
	'index|post': function(req, res) {
		res.send('Index for chat');
	},

	':test': function(req, res) {
		res.send(req.params.test);
	}
}
