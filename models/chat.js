
function Chat(db) {
	this.db = db;

	this.setUpSchemas();

	// Drop OnlineUsers on server boot.
	// Socket.IO clients auto-rejoining screw up the count otherwise.
	this.OnlineUsers.remove({}).exec();
}

Chat.prototype.setUpSchemas = function() {
	// Schema for the chatlog
	var chatLogSchema = this.db.Schema({
	  user: {type: this.db.Schema.ObjectId, ref: 'User'}
	, message: String
	, time: Date
	}, {capped: {
		// Limit the size to 5mb of log
		size: 5242880
	}});
	this.ChatLog = this.db.model('Chat', chatLogSchema);

	// Schema for keeping track of currently active users
	var onlineUsersSchema = this.db.Schema({
	  user: {type: this.db.Schema.ObjectId, ref: 'User', unique: true}
	, clients: Number
	});
	this.OnlineUsers = this.db.model('OnlineUsers', onlineUsersSchema);
}

// Save a message to the log
Chat.prototype.log = function(data, done) {
	var log = new this.ChatLog(data);
	log.save(done);
}

// Get the latest n messages from the log
Chat.prototype.getLog = function(n, done) {
	// If no done was passed, but n is a function, default to n=100
	if (typeof done == 'undefined' && typeof n == 'function') {
		done = n;
		n = 100;
	}

	this.ChatLog
		.find()
		.sort('-time')
		.limit(n)
		.exec(function(err, results) {
			// Need to reverse the results due to -time sort
			results.reverse()
			done(err, results);
		});
}

// Set a user as being currently online
Chat.prototype.addUser = function(user, done) {
	// Attempt to set the user as being a new join.
	var self = this
	  , toAdd = new self.OnlineUsers({user: user, clients: 1});
	toAdd.save(function(err, onlineUser) {
		if (err) {
			if (err.code == 11000) {
				// If it was error 11000, they already exist in the db.
				// Increment their client count instead.
				self.OnlineUsers.update({user: user}, {$inc: {clients: 1}}, function(err) {
					if (err) { return done(err); }
					return done(null, true);
				});
			} else {
				// It wasn't 11000, so something actually did bork.
				return done(err);
			}
		} else {
			// No error thrown, return success.
			return done(null, true);
		}
	});
}

// A client has disconnected. Decrease user's client no, and remove if none left.
Chat.prototype.removeUser = function(user, done) {
	this.OnlineUsers.findOneAndUpdate({user: user}, {$inc: {clients: -1}}, function(err, onlineUser) {
		// An offline user disconnected? Let's just pretend they disconnected anyway.
		if (!onlineUser) { return done(null, true); }

		if (onlineUser.clients <= 0) {
			// No clients left, remove them from db and tell() as such
			onlineUser.remove(function(err) {
				if (err) { return done(err); }
				return done(null, true);
			});
		} else {
			// Still have clients. All done here.
			return done(null, false);
		}
	})
}

// Check if the specified user is online
Chat.prototype.checkUserOnline = function(user, done) {
	this.OnlineUsers.findOne({user: user}, done);
}

// Get the full list of online users
Chat.prototype.getAllUsers = function(done) {
	this.OnlineUsers
		.find()
		.populate('user')
		.exec(done);
}

module.exports = Chat;
