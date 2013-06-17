// var socket = io.connect('{{ pageURL }}');
// socket.on('news', function(data) {
// 	console.log(data);
// 	socket.emit('my other event', {my: 'data'});
// });

$(function() {
	// Set up a socket.io connection
	var socket = io.connect(window.location.origin)

	// If we recieve a message line, add it to the view
	socket.on('broadcast', function(data) {
		$('#chat .messages').append(
			'<p><strong>'+data.username+':&nbsp;</strong>'+data.message+'</p>'
		)
	});

	// If we send a message, send it to the server
	$('#chat .message-input').submit(function() {
		var messagebox = $(this).find('[name="message"]');
		socket.emit('message', messagebox.val());
		messagebox.val('');
	})
});