module.exports = {
	// YouTube
	'yt': {
		open: function(token) {
			var argument = token.arguments.tag; 

			// Not a valid ID
			if (!argument || !argument.match(/^[^"&\/ ]{11}$/)) {
				return false;
			}

			return '<div class="youtube"><iframe src="//www.youtube.com/embed/'+argument+'" frameborder="0" allowfullscreen></iframe></div>';
		},
		close: '',
		hasCloseTag: false
	},

	// Spoiler
	'spoiler': {
		open: '<span class="spoiler">',
		close: '</span>'
	},

	// Inline code
	'code' : {
		allowInnerTags: false,
		open: '<code>',
		close: '</code>'
	}
}
