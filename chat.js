
// Chat model etc. Will use to log chat, eventually.
module.exports = function(db) {
	var chatLogSchema = db.Schema({
		//stuff goes here
	});

	var onlineUsersSchema = db.Schema({
		id: String
	});
	var OnlineUsers = db.model('OnlineUsers', onlineUsersSchema);

	chatLogSchema.statics.addUser = function(id, done) {
		var model = db.model('Chat');
		model.checkUserOnline(id, function(err, exists) {
			if (exists) { return done(null, true); } // User is already online, so was a success
			var toAdd = new OnlineUsers({id: id});
			toAdd.save(function(err, onlineUser) {
				if (err) { return done(err); }
				return done(null, true);
			});
		});
	}

	chatLogSchema.statics.removeUser = function(id) {
		OnlineUsers.findOneAndRemove({id: id}).exec();
	}

	chatLogSchema.statics.checkUserOnline = function(id, done) {
		OnlineUsers.findOne({id: id}, done);
	}

	chatLogSchema.statics.getAllUsers = function(done) {
		OnlineUsers.find(done);
	}

	return db.model('Chat', chatLogSchema);
}