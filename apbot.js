
// Apbot config. I'll move this to the db to allow
// runtime editing eventually. But lazy.
var config = {
  '^!yesno': ['Yes.', 'No.']
};

// Takes an incoming message data object, then
// apbottifies it. That's a techincal term.
module.exports = function(data) {
	var responses = [];
	for (var key in config) {
		// If the message matches the regex, it's a possible response
		if (data.message.search(key) != -1) {
			responses = responses.concat(config[key]);
		}
	}

	if (responses.length == 0) {
		return false;
	}
	
	// Pick a response from those avaliable at random
	var result = responses[Math.floor(Math.random() * responses.length)];
	return {
	  id: 'bot'
	, message: result
	, time: new Date
	};
}
