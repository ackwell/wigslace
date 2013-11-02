
module.exports = function(db) {
	/*
	 * Schema
	 */
	var botReplySchema = db.Schema({
	  search: String
	, reply: String
	});

	// Takes an incoming message data object, then
	// apbottifies it. That's a techincal term.
	botReplySchema.statics.getReply = function(data, done) {
		// Get all the bot replies form the db
		var model = db.model('BotReply');
		model.find(function(err, replies) {
			var responses = [];
			for (var i = 0; i < replies.length; i++) {
				var reply = replies[i];
				if (data.message.search(reply.search) != -1) {
					responses.push(reply.reply);
				}
			}

			if (responses.length == 0) {
				return done(null, false);
			}

			var result = responses[Math.floor(Math.random() * responses.length)];
			return done(null, {
			  id: 'bot'
			, message: result
			, time: new Date
			});
		});
	}

	return model = db.model('BotReply', botReplySchema);
}

