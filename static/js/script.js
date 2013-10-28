$(function() {
// Alert handler
	$('body').on('click', '.alert .close', function() {
		console.log('test');
		$(this).closest('.alert').remove();
	});
})
