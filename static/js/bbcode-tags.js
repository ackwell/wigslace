function HTMLLinkBBCode() {
	this.getCodeName = function() { return 'Link'; }
	this.getDisplayName = function() { return 'url'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return true; }
	this.mustHaveArgument = function() { return true; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return true; }
	this.isValidParent = function(settings, parent) { return parent !== this.getDisplayName(); }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) {
		return '<a href="' + PHPC.htmlspecialchars(argument) + '">';
	}
	this.close = function(settings, argument, closingCode) {
		return '</a>';
	}
}
HTMLLinkBBCode.prototype = new BBCode;

function MarkdownQuoteBBCode() {
	this.getCodeName = function() { return 'Quote'; }
	this.getDisplayName = function() { return 'quote'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return false; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return true; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '>'; }
	this.close = function(settings, argument, closingCode) { return ''; }
}
MarkdownQuoteBBCode.prototype = new BBCode;

function CodeBBCode() {
	this.getCodeName = function() { return 'Code'; }
	this.getDisplayName = function() { return 'code'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return true; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return true; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '<code>'; }
	this.close = function(settings, argument, closingCode) { return '</code>'; }
}
CodeBBCode.prototype = new BBCode;

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
		return '<div class="youtube"><iframe src="//www.youtube.com/embed/'+argument+'" frameborder="0" allowfullscreen></iframe></div>';
	}
	this.close = function(settings, argument, closingCode) { return ''; }
}
YouTubeBBCode.prototype = new BBCode;

// Spoiler tag
function SpoilerBBCode() {
	this.getCodeName = function() { return 'Spoiler'; }
	this.getDisplayName = function() { return 'spoiler'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return false; }
	this.canHaveArgument = function() { return false; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '<span class="spoiler">'; }
	this.close = function(settings, argument, closingCode) { return '</span>'; }
}
SpoilerBBCode.prototype = new BBCode;

// Line up the BBCode parser.
var bbcode = new BBCodeParser({
	escapeContentOutput: false
, codes: {
		'a': new HTMLLinkBBCode()
	, 'quote': new MarkdownQuoteBBCode()
	, 'code': new CodeBBCode()
	, 'codebox': new CodeBBCode()
	, 'yt': new YouTubeBBCode()
	, 'spoiler': new SpoilerBBCode()
	}
});