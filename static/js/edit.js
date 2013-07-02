$(function() {
	$('#password-modal form').submit(function(e) {
		e.preventDefault();
		var saveButton = $('#password-modal button[type="submit"]');
		saveButton.button('loading');
		$(this).ajaxSubmit(function(response) {
			$('#password-modal .alert').alert('close');
			var error = response.type == 'error';
			$('#password-modal .modal-body').prepend('<div class="alert '+(error?'alert-error':'alert-info')+'"><button type="button" class="close" data-dismiss="alert">&times;</button>'+(error?'<strong>Error!</strong> ':'')+response.message+'</div>');
			saveButton.button('reset');
			if (!error) {
				$('#password-modal input').val('');
			}
		});
		return false;
	});
});