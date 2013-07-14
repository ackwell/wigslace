function MarkdownBoldBBCode() {
	this.getCodeName = function() { return 'Bold'; }
	this.getDisplayName = function() { return 'b'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return false; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return false; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '**'; }
	this.close = function(settings, argument, closingCode) { return '**'; }
}
MarkdownBoldBBCode.prototype = new BBCode;

function MarkdownItalicBBCode() {
	this.getCodeName = function() { return 'Italic'; }
	this.getDisplayName = function() { return 'i'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return false; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return false; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '*'; }
	this.close = function(settings, argument, closingCode) { return '*'; }
}
MarkdownItalicBBCode.prototype = new BBCode;

function MarkdownStrikeThroughBBCode() {
	this.getCodeName = function() { return 'StrikeThrough'; }
	this.getDisplayName = function() { return 's'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return true; }
	this.canHaveArgument = function() { return false; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return false; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '~~'; }
	this.close = function(settings, argument, closingCode) { return '~~'; }
}
MarkdownStrikeThroughBBCode.prototype = new BBCode;

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

function MarkdownCodeBBCode() {
	this.getCodeName = function() { return 'Code'; }
	this.getDisplayName = function() { return 'code'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return false; }
	this.canHaveArgument = function() { return true; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return true; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) { return '`'; }
	this.close = function(settings, argument, closingCode) { return '`'; }
}
MarkdownCodeBBCode.prototype = new BBCode;

var MarkdownCodeBoxBBCode = MarkdownCodeBBCode;

function MarkdownLinkBBCode() {
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
	this.open = function(settings, argument, closingCode) { return '['; }
	this.close = function(settings, argument, closingCode) { return ']('+PHPC.htmlspecialchars(argument)+')'; }
}
MarkdownLinkBBCode.prototype = new BBCode;

function MarkdownImageBBCode() {
	this.getCodeName = function() { return 'Image'; }
	this.getDisplayName = function() { return 'img'; }
	this.needsEnd = function() { return true; }
	this.canHaveCodeContent = function() { return false; }
	this.canHaveArgument = function() { return true; }
	this.mustHaveArgument = function() { return false; }
	this.getAutoCloseCodeOnOpen = function() { return null; }
	this.getAutoCloseCodeOnClose = function() { return null; }
	this.isValidArgument = function(settings, argument) { return true; }
	this.isValidParent = function(settings, parent) { return true; }
	this.escape = function(settings, content) { return PHPC.htmlspecialchars(content); }
	this.open = function(settings, argument, closingCode) {
		return '!['+PHPC.htmlspecialchars(argument)+'](';
	}
	this.close = function(settings, argument, closingCode) { return ')'; }
}
MarkdownImageBBCode.prototype = new BBCode;

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
		'b': new MarkdownBoldBBCode()
	, 'i': new MarkdownItalicBBCode()
	, 's': new MarkdownStrikeThroughBBCode()
	, 'quote': new MarkdownQuoteBBCode()
	, 'code': new MarkdownCodeBBCode()
	, 'codebox': new MarkdownCodeBoxBBCode()
	, 'url': new MarkdownLinkBBCode()
	, 'img': new MarkdownImageBBCode()
	, 'yt': new YouTubeBBCode()
	}
});