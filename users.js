
// Need reference to the database object
module.exports = function(client) {
	// Users model
	var Users = {
		// Check if the ID passed in is a valid user
		is: function(uid, done) {
			return client.sismember('users:ids', uid, done);
		}

		// Return all the data related to a user
	, get: function(id, done) {
			this.is(id, function(err, reply) {
				if (!reply) { return done(null, false); }
				test = client.hgetall('users:data:'+id, function(err, user) {
					user.id = id
					return done(null, user);
				});
			});

			// if (!this.is(id)) { return done(null, false); }
			// var user = client.hgetall('users:data:'+id);
			// user.id = id;
			// //console.warn(user); //<===============
			// return done(null, user);
		}
	};

	return Users;
}