$(function() {
	// Used to store information about other users
	var users = {};

	// Set up a socket.io connection
	var socket = io.connect(window.location.origin);

	// Server has established a connection, ready to go!
	socket.on('ready', function() {
		// Remove 'connecting' messsage
	});

	// If we recieve a message line, add it to the view
	// The messages are sanitised serverside.
	socket.on('message', function(data) {
		var message = data.message;
		// Parse it with markdown.
		message = marked(message);

		$('#chat-container .scroll-box').append(
			'<div><strong>'+data.user+':&nbsp;</strong>'+message+'</div>'
		);
	});

	// A user has joined
	socket.on('join', function(user) {
		$('#chat-container .users').append(
			'<div class="user user-'+user.id+'">'+(user.avatar?'<img src="'+user.avatar+'20.png">':'')+user.id+'</div>'
		);
	});

	// User has left
	socket.on('part', function(userID) {
		$('#chat-container .users .user-'+userID).remove();
	});

	// If we send a message, send it to the server
	$('#message-input').submit(function() {
		var messageBox = $(this).find('[name="message"]');
		socket.emit('message', messageBox.val());
		messageBox.val('');
	})
});