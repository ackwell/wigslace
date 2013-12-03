$(function() {
	// Show/hide the modals
	$('.open-modal').click(function() {
		var modal = $($(this).attr('href'))
			, mask = $('.modal-mask');

		modal.fadeIn();
		mask.fadeIn();

		return false;
	});
	$('.modal .close').click(function() {
		var modal = $(this).closest('.modal')
			, mask = $('.modal-mask');

		modal.fadeOut();
		mask.fadeOut();

		return false;
	});

	// Change password modal
	$('#password-modal form').submit(function(e) {
		e.preventDefault();
		var saveButton = $('#password-modal button[type="submit"]');
		$(this).ajaxSubmit(function(response) {
			// Remove existing alerts
			$('.alert .close').click();

			// Add an alert
			var error = response.type == 'error';
			$('#password-modal form').prepend(
				'<div class="alert '+(error?'error':'info')+'">'+
				'<button type="button" class="close icon">&times;</button>'+
				(error?'<strong>Error!</strong> ':'')+response.message+'</div>'
			);
			if (!error) {
				$('#password-modal input').val('');
			}
		});
		return false;
	});

	// Edit avatar button redirection
	$('.button.file').click(function(event) {
		// prevents duplicate click event
		var input = $(this).find('input')[0];
		if (input == event.target) { return; }
		
		input.click();
	});
});