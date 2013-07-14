function YouTubeBBCode() {
	this.getCodeName = function() { return 'YouTube'; }
	this.getDisplayName = function() { return 'yt'; }
	this.needsEnd = function() { return false; }
	this.canHaveCodeContent = function() { return false; }
	this.canHaveArgument = function() { return true; }
	this.mustHaveArgument = function() { return true; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return !!argument.match(/^[^"&\/ ]{11}$/); }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { 
		return '<iframe width="640" height="360" src="//www.youtube.com/embed/'+argument+'" frameborder="0" allowfullscreen></iframe>';
	}
	this.close = function(settings, argument, closingCode) { return ''; }
}
YouTubeBBCode.prototype = new BBCode;

// Line up the BBCode parser.
var bbcode = new BBCodeParser({
	escapeContentOutput: false
, codes: {
		'yt': new YouTubeBBCode()
	}
});