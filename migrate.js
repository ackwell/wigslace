
// Set up some vars
var mongoose = require('mongoose')
  , marked = require('marked')
  , bboxed = require('bboxed')
  , requireDir = require('require-dir')
  , config = requireDir('./config')
  , oldDB = mongoose.createConnection('mongodb://localhost/wigslace')
  , newDB = mongoose.createConnection('mongodb://localhost/wigslace2');

// User models
var oldUsers = oldDB.model('User', mongoose.Schema({
  id: String
, email: String
, hash: String
, avatar: String
}));

var newUsers = newDB.model('User', mongoose.Schema({
  name: String
, email: String
, hash: String
, avatar: String
, permissions: {
	  site: {type: Boolean, default: true}
	, chat: {type: Boolean, default: true}
	, admin: {type: Boolean, default: false}
	}
}));

// Chat models
var oldChat = oldDB.model('Chat', mongoose.Schema({
  id: String
, message: String
, time: Date
}, {capped: { // Limit the length so I don't have to prune it myself
  size: 5242880 // generous max size of 5MB
}}));

var newChat = newDB.model('Chat', mongoose.Schema({
  user: {type: mongoose.Schema.ObjectId, ref: 'User'}
, message: String
, time: Date
}, {capped: {
	// Limit the size to 5mb of log
	size: 5242880
}}));

function callWhenComplete(done, toDo, callback, args) {
	console.log(done + ' of ' + toDo);
	if (done != toDo) { return; }
	callback.apply(this, args);
}

function migrateUsers() {
	console.log('Migrating users:');
	var toDo = 0
	  , done = 0
	  , users = {};
	oldUsers.find({}, function(err, users) {
		toDo = users.length;
		users.forEach(function(user) {
			var newUser = newUsers({
				name: user.id,
				email: user.email,
				hash: user.hash,
				avatar: user.avatar
			});
			newUser.save(function(err, user) {
				done++;
				users[user.name] = user;
				callWhenComplete(done, toDo, migrateChat, [users]);
			});
		});
	});
}

function migrateChat(users) {
	console.log('Migrating chat:');
	var toDo = 0
	  , done = 0;

	oldChat
		.find()
		// Only preserving 1k logs because I don't have that much time thanks all the same
		// .sort('-time')
		// .limit(1000)
		.exec(function(err, messages) {
			console.log('Result obtained');
			toDo = messages.length;
			for (var i = 0; i < toDo; ++i) {
				var message = messages[i]
				  , user = users[message.id]
				  , text = message.message
				  , text = marked(text)
				  , text = bboxed(text)
				  , newMessage = newChat({
					user: user._id,
					message: text,
					time: message.time
				});
				// done++;
				// callWhenComplete(done, toDo, complete);
				newMessage.save(function(err, message) {
					done++
					callWhenComplete(done, toDo, complete);
				});
			}
		});
}

function complete() {
	console.log('done');
	process.exit();
}

// Start migrating
migrateUsers();
