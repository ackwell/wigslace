$(function() {
// Alert handler
	$('body').on('click', '.alert .close', function() {
		$(this).closest('.alert').remove();
	});
})
