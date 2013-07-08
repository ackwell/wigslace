
// Chat model etc. Will use to log chat, eventually.
module.exports = function(db) {
	var chatLogSchema = db.Schema({
		//stuff goes here
	});

	var onlineUsersSchema = db.Schema({
		id: String
	, clients: Number
	});
	var OnlineUsers = db.model('OnlineUsers', onlineUsersSchema);

	// Drop the OnlineUsers data on server start - the rejoining clients tend to fuck shit up otherwise
	OnlineUsers.remove({}).exec();

	chatLogSchema.statics.addUser = function(id, done) {
		var model = db.model('Chat');
		model.checkUserOnline(id, function(err, exists) {
			if (exists) {
				// User is already online, need to increment their client count
				OnlineUsers.update({id: id}, {$inc: {clients: 1}}, function(err) {
					return done(null, true);
				});
			}
			var toAdd = new OnlineUsers({id: id, clients: 1});
			toAdd.save(function(err, onlineUser) {
				if (err) { return done(err); }
				return done(null, true);
			});
		});
	}

	chatLogSchema.statics.removeUser = function(id, done) {
		var model = db.model('Chat');
		model.checkUserOnline(id, function(err, user) {
			// A user who is not online just disconnected... wat? Send out the part message anyway
			if (!user) { return done(null, true); }
			if (user.clients <= 1) {
				// Last client left, remove from list and send part message
				OnlineUsers.findOneAndRemove({id: id}, function(err, removed) {
					return done(null, true);
				});
			} else {
				// Still got clients online, decrement the number
				OnlineUsers.update({id: id}, {$inc: {clients: -1}}, function(err) {
					return done(null, false);
				});
			}
		});
	}

	chatLogSchema.statics.checkUserOnline = function(id, done) {
		OnlineUsers.findOne({id: id}, done);
	}

	chatLogSchema.statics.getAllUsers = function(done) {
		OnlineUsers.find(done);
	}

	return db.model('Chat', chatLogSchema);
}