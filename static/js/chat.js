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

$(function() {
	// Set up a socket.io connection
	var socket = io.connect(window.location.origin);

	/*
	 * User List
	 */
	var Users = {
		users: {}
	, online: []

		// Returns a user object, or requests from server and returns null
	, get: function(userID) {
			if (!Users.users.hasOwnProperty(userID)) {
				socket.emit('getUser', userID);
				return null;
			}
			return Users.users[userID];
		}

		// Server has sent us data about a user :D
	, dataRecieved: function(user) {
			Users.users[user.id] = user;
			// Look through the dom for any pending stuff and sort it out
			$('.pending-'+user.id).each(function() {
				var template = $(this).find('.template').html();
				for (key in user) {
					var re = new RegExp('\\{'+key+'\\}', 'g');
					template = template.replace(re, user[key]);
				}
				$(this).replaceWith(template);
			});
		}

	, join: function(userID) {
			// User has joined, if they are already online (multi client), ignore
			if ($.inArray(userID, Users.online) > -1) { return; }

			Users.online.push(userID);
			
			var user = Users.get(userID);
			var avatar = '';
			if (user) {
				if (user.avatar) { avatar = '<img src="{0}20.png">'.format(user.avatar); }
			} else {
				avatar = '<span class="pending-{0}"><img src="/default/avatars/placeholder/20.png">\
				            <span class="template hide"><img src="{avatar}20.png"></span>\
				          </span>'.format(userID);
			}

			$('.user-list').append(
				'<div class="user user-{0}">{1}&nbsp;{0}</div>'.format(
					userID
				, avatar
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
		add: function(data) {
			// Generate the code for the avatar (might need to get pending...)
			var user = Users.get(data.id);
			var avatar = '';
			if (user) {
				if (user.avatar) { avatar = '<img src="{0}40.png">'.format(user.avatar); }
			} else {
				avatar = '<span class="pending-{0}"><img src="/default/avatars/placeholder/40.png">\
				            <span class="template hide"><img src="{avatar}40.png"></span>\
				          </span>'.format(data.id);
			}

			var chat = $('.chat')
				, wrapper = $('.chat-wrapper')
				, messageHTML = '\
				<div class="message user-{0}">\
					<div class="content">\
						{1}<div class="meta">{0}&nbsp;&bull;&nbsp;{2}</div>\
					</div>\
					<div class="avatar">{3}</div>\
				</div>'.format(
						data.id
					, marked(data.message)
					, moment(data.time).format('h:mm A')
					, avatar
					)
				, shouldScroll = wrapper.scrollTop()>=chat.height()-wrapper.height();
			chat.append(messageHTML);
			// If there are > 100 messages, start culling from the top
			while ($('.message').length > 100) {
				$('.message:first-child').remove();
			}
			// Scroll the box only if the user is at the bottom - needs fix for images etc
			if (shouldScroll) {
				wrapper.scrollTop(chat.height());
			}
		}
	}

	/*
	 * Socket.io
	 */

	// Server has established a connection, ready to go!
	socket.on('ready', function() {
		// Remove 'connecting' messsage
	});

	// If we recieve a message line, add it to the view
	// The messages are sanitised serverside.
	socket.on('message', function(data) {
		Chat.add(data);
	});

	// server sent us userdata
	socket.on('userData', function(userData) {
		Users.dataRecieved(userData);
	});

	// A user has joined
	socket.on('join', function(userID) {
		Users.join(userID);
	});

	// User has left
	socket.on('part', function(userID) {
		UserList.part(userID);
	});

	// If we send a message, send it to the server
	$('.message-input').submit(function() {
		var messageBox = $(this).find('[name="message"]');
		socket.emit('message', messageBox.val());
		messageBox.val('');
	})
});
