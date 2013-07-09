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
	/*
	 * User List
	 */
	var UserList = {
		users: {}
	, add: function(userData) {
			UserList.users[userData.id] = userData;
			UserList.remove(userData.id);
			$('.user-list').append(
				'<div class="user user-{0}">{1}&nbsp;{0}</div>'.format(
					userData.id
				, (userData.avatar? '<img src="{0}20.png">'.format(userData.avatar) : '')
				)
			);
		}
	, remove: function(userID) {
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
			var chat = $('.chat')
				, wrapper = $('.chat-wrapper')
				, user = data.user
				, messageHTML = '\
				<div class="message user-{0} {4}">\
					<div class="content">\
						{1}<div class="meta">{0}&nbsp;&bull;&nbsp;{2}</div>\
					</div>\
					<div class="avatar">{3}</div>\
				</div>'.format(
						user.id
					, marked(data.message)
					, moment(data.time).format('h:mm A')
					, (user.avatar? '<img src="{0}40.png">'.format(user.avatar) : '')
					, (user.offline? 'offline' : '')
					)
				, shouldScroll = wrapper.scrollTop()>=chat.height()-wrapper.height();
			chat.append(messageHTML);
			// If there are > 100 messages, start culling from the top
			while ($('.message').length > 100) {
				$('.message:first-child').remove();
			}
			// Scroll the box only if the user is at the bottom
			// console.log(wrapper.scrollTop(), chat.height()-wrapper.height(), wrapper.scrollTop() >= chat.height() - wrapper.height());
			if (shouldScroll) {
				wrapper.scrollTop(chat.height());
			}
		}
	}

	/*
	 * Socket.io
	 */
	// Set up a socket.io connection
	var socket = io.connect(window.location.origin);

	// Server has established a connection, ready to go!
	socket.on('ready', function() {
		// Remove 'connecting' messsage
	});

	// If we recieve a message line, add it to the view
	// The messages are sanitised serverside.
	socket.on('message', function(data) {
		console.log(data);
		var user = UserList.users[data.id];
		if (!user) {
			console.log('User "{0}" does not seem to be online...'.format(data.id));
			user = {id: data.id, offline: true};
		}
		data.user = user;
		Chat.add(data);
	});

	// A user has joined
	socket.on('join', function(user) {
		UserList.add(user);
	});

	// User has left
	socket.on('part', function(userID) {
		UserList.remove(userID);
	});

	// If we send a message, send it to the server
	$('.message-input').submit(function() {
		var messageBox = $(this).find('[name="message"]');
		socket.emit('message', messageBox.val());
		messageBox.val('');
	})
});
