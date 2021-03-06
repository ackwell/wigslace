/*
 * Plugins/utilities
 */
// String formatting thingo. Creds to http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

/*
 * Chat code
 */
$(function() {
	// Load any settings passed through from the server.
	var settingsElement = $('.user-settings')
	  , settings = {}
	if (settingsElement.length) {
		settings = JSON.parse(settingsElement.text());
	}

	// Set up a socket.io connection
	var socketSettings = {};
	if (settings.useXHR) {
		socketSettings['transports'] = ['xhr-polling'];
	}

	var socket = io.connect(window.location.origin, socketSettings);

	/*
	 * User List
	 */
	var Users = {
		users: {}
	, online: []

		// Returns a user object, or requests from server and returns null
	, get: function(userID) {
			if (!Users.users.hasOwnProperty(userID)) {
				Users.users[userID] = undefined;
				socket.emit('user:get', userID);
				return null;
			}
			return Users.users[userID];
		}

		// Server has sent us data about a user :D
	, dataRecieved: function(user) {
			Users.users[user._id] = user;

			// Look through the dom for any pending stuff and sort it out
			$('.pending-'+user._id).each(function() {
				var template = $(this).find('.template').html();
				for (key in user) {
					var re = new RegExp('\\{'+key+'\\}', 'g');
					template = template.replace(re, user[key]);
				}
				$(this).replaceWith(template);
			});

			// Add/remove their mute status
			var userListEntry = $('.user-list .user-'+user._id);
			if (user.permissions.chat) {
				userListEntry.removeClass('global mute');
			} else {
				userListEntry.addClass('global mute');
			}

		}

	, active: function(userID, active) {
			var userListEntry = $('.user-list .user-'+userID);
			if (active) {
				userListEntry.removeClass('inactive');
			} else {
				userListEntry.addClass('inactive');
			}
		}

	, join: function(userID) {
			// User has joined, if they are already online (multi client), ignore
			if ($.inArray(userID, Users.online) > -1) { return; }

			Users.online.push(userID);
			
			var user = Users.get(userID)
			  , entry = '';
			if (user) {
				avatar = user.avatar? '<img src="{0}20.png">'.format(user.avatar) : '';
				name = user.name? user.name : '';
				entry = '{0}&nbsp;{1}'.format(avatar, name);
			} else {
				entry = '<span class="pending-{0}">\
					<img src="/default/avatars/placeholder/20.png">&nbsp;Pending\
					<span class="template hide">\
						<img src="{avatar}20.png">&nbsp{name}\
					</span>\
				</span>'.format(userID);
			}

			$('.user-list').append(
				'<div class="user user-{0}">{1}</div>'.format(
					userID
				, entry
				)
			);
		}
	, part: function(userID) {
			var index = $.inArray(userID, Users.online);
			if (index > -1) { Users.online.splice(index, 1); }
			var userEntry = $('.user-list').find('.user-'+userID);
			if (userEntry.length) {
				userEntry.remove();
			}
		}
	}

	/*
	 * Chat
	 */
	var Chat = {
	  lastMessage: null
	, lastUser: ''
	, lastTime: null
	, add: function(data) {
			// Generate the code for the avatar (might need to get pending...)
			var user = Users.get(data.user)
			  , avatar = ''
			  , name = '';
			if (user) {
				if (user.avatar) { avatar = '<img src="{0}40.png">'.format(user.avatar); }
				if (user.name) { name = user.name; }
			} else {
				avatar = '<span class="pending-{0}"><img src="/default/avatars/placeholder/40.png">\
					<span class="template hide"><img src="{avatar}40.png"></span>\
				</span>'.format(data.user);
				name = '<span class="pending-{0}">Pending<span class="template hide">{name}</span></span>'.format(data.user);
			}

			var chat = $('.chat')
			  , lastMessage;

			if (Chat.lastUser != data.user || moment(data.time).subtract('minutes', 5) > Chat.lastTime) {
				var messageHTML = '\
					<div class="message user-{0}">\
						<div class="content">\
							<div class="messages">{1}</div>\
							<div class="meta">{4}&nbsp;&bull;&nbsp;<span class="time">{2}</span></div>\
						</div>\
						<div class="avatar">{3}</div>\
					</div>'.format(
						  data.user
						, data.message
						, moment(data.time).format('h:mm A')
						, avatar
						, name
						)
				Chat.lastMessage = $(messageHTML);
				chat.append(Chat.lastMessage);
				lastMessage = chat.children(':last-child').trigger('wl:message:create', [data]);
			} else {
				Chat.lastMessage.find('.messages').append(data.message);
				Chat.lastMessage.find('.time').html(moment(data.time).format('h:mm A'));
				lastMessage = chat.children(':last-child').trigger('wl:message:append', [data]);
			}

			lastMessage.trigger('wl:message:new', [data]);

			Chat.lastUser = data.user;
			Chat.lastTime = moment(data.time);

			// If there are > 100 messages, start culling from the top
			while ($('.message').length > 100) {
				$('.message:first-child')
					.trigger('wl:message:remove')
					.remove();
			}

			Chat.autoScroll();
		}

	, shouldScroll: true
	, justAutoScrolled: false
	, autoScroll: function() {
			if (Chat.shouldScroll) {
				Chat.justAutoScrolled = true;
				$('.chat-wrapper').scrollTop($('.chat').height());
			}
		}
	}

	// Automatically scroll to bottom every .5s, unless they have scrolled away
	// (fixes bug with images and so on)
	setInterval(Chat.autoScroll, 500);
	$('.chat-wrapper').scroll(function() {
		// If this was fired because of .scrollTop, ignore
		if (Chat.justAutoScrolled) {
			Chat.justAutoScrolled = false;
			return;
		}

		var shouldScroll = false
			, wrapper = $(this)
			, chat = $('.chat');

		if (wrapper.scrollTop() >= chat.height()-wrapper.height()) {
			shouldScroll = true;
		}
		Chat.shouldScroll = shouldScroll;
	});

	/*
	 * Socket.io
	 */

	// Server has established a connection, ready to go!
	socket.on('conn:ready', function() {
		$(document).trigger('wl:socket:ready');
	});

	// If we recieve a message line, add it to the view
	// The messages are sanitised serverside.
	socket.on('mesg:out', function(data) {
		$(document).trigger('wl:socket:message:recieve', [data]);
		Chat.add(data);
	});

	// Scrollback is just lots of messages sent at once, to save the massive message spam
	socket.on('mesg:scrollback', function(messages) {
		$(document).trigger('wl:socket:scrollback', [messages]);
		for (var i = 0; i < messages.length; i++) {
			Chat.add(messages[i]);
		}
	});

	// Server sent us userdata
	socket.on('user:data', function(userData) {
		$(document).trigger('wl:socket:userData', [userData]);
		Users.dataRecieved(userData);
	});

	// Someone is now (in)active
	socket.on('user:active', function(active) {
		$(document).trigger('wl:socket:active', [active]);
		Users.active(active.user, active.status);
	});

	// Server has sent a user listing
	socket.on('user:list', function(users) {
		for (var i = 0; i < users.length; i++) {
			var user = users[i];
			Users.join(user.user);
			Users.active(user.user, user.status);
		}
	});

	// A user has joined
	socket.on('user:join', function(userID) {
		$(document).trigger('wl:socket:join', [userID]);
		Users.join(userID);
	});

	// User has left
	socket.on('user:part', function(userID) {
		$(document).trigger('wl:socket:part', [userID]);
		Users.part(userID);
	});

	// If we send a message, send it to the server
	$('.message-input').submit(function() {
		var messageBox = $(this).find('[name="message"]')
		  , message = messageBox.val();
		$(document).trigger('wl:socket:message:send', [message]);
		socket.emit('mesg:in', message);
		messageBox.val('');
	})
});
