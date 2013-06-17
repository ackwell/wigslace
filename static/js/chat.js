// var socket = io.connect('{{ pageURL }}');
// socket.on('news', function(data) {
// 	console.log(data);
// 	socket.emit('my other event', {my: 'data'});
// });

$(function() {
	// Set up a socket.io connection
	var socket = io.connect(window.location.origin)

	// Server has established a connection, ready to go!
	socket.on('ready', function() {
			// temp for testing
	socket.emit('message', 'i have connected (need to move this to client side)');
	});

	// If we recieve a message line, add it to the view
	// The messages are sanitised serverside.
	socket.on('broadcast', function(data) {
		var message = data.message;
		// Parse it with markdown.
		message = marked(message);
		console.log(message)

		$('#chat .messages').append(
			'<div><strong>'+data.username+':&nbsp;</strong>'+message+'</div>'
		);
	});

	// If we send a message, send it to the server
	$('#chat .message-input').submit(function() {
		var messagebox = $(this).find('[name="message"]');
		socket.emit('message', messagebox.val());
		messagebox.val('');
	})
});