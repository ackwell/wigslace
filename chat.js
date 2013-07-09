
// Chat model etc. Will use to log chat, eventually.
module.exports = function(db) {

	/*
	 * Schemas
	 */
	var chatLogSchema = db.Schema({
		id: String
	, message: String
	, time: Date
	}, {capped: { // Limit the length so I don't have to prune it myself
		size: 1048576 // generous max size of 1MB
	, max: 100
	}});

	var onlineUsersSchema = db.Schema({
		id: {type: String, unique: true}
	, clients: Number
	});
	var OnlineUsers = db.model('OnlineUsers', onlineUsersSchema);


	/*
	 * Chat log
	 */
	chatLogSchema.statics.log = function(data, done) {
		var model = db.model('Chat');
		var log = new model(data);
		log.save(done);
	}

	chatLogSchema.statics.getLog = function(done) {
		var model = db.model('Chat');
		model.find(done);
	}


	/*
	 * Online Users
	 */
	// Drop the OnlineUsers data on server start - the rejoining clients tend to fuck shit up otherwise
	OnlineUsers.remove({}).exec();

	chatLogSchema.statics.addUser = function(id, done) {
		// attempt to save the user as having just joined
		var toAdd = new OnlineUsers({id: id, clients: 1});
		toAdd.save(function(err, onlineUser) {
			if (err) {
				if (err.code == 11000) {
					// If it's error 11000, they already exist, so increment client count instead.
					OnlineUsers.update({id: id}, {$inc: {clients: 1}}, function(err) {
						if (err) { return done(err); }
						return done(null, true);
					});
				} else {
					// If it wasn't 11000, something actually did bork
					return done(err);
				}
			} else {
				return done(null, true);
			}
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