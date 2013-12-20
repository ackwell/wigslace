
function Permissions(db) {
	this.db = db;

	this.setUpSchemas();
}

Permissions.prototype.setUpSchemas = function() {
	var permissionSchema = this.db.Schema({
	  user: {type: this.db.Schema.ObjectId, ref: 'User'}
	, chat: Boolean
	, site: Boolean
	, admin: {
		  profile: Boolean
		, users: Boolean
		, mutes: Boolean
		, bans: Boolean
		}
	});
	this.Permission = this.db.model('Permission', permissionSchema);
}

Permissions.prototype.hasPermission = function(id, permission, done) {

}

Permissions.prototype.adminPermissions = function(id, done) {

}

module.exports = Permissions;
