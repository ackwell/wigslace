
module.exports = {
	users: [
		{
			name: 'admin',
			email: 'admin@wigslace',
			password: 'password',
			permissions: {
				admin: true
			}
		},
		{
			name: 'bot',
			email: 'bot@wigslace',
			password: 'password',
			permissions: {
				site: false
			}
		}
	],

	avatars: {
		admin: '/default/avatars/admin/',
		members: [
			'/default/avatars/generic-1/',
			'/default/avatars/generic-2/',
			'/default/avatars/homura/',
			'/default/avatars/kyouko/',
			'/default/avatars/madoka/',
			'/default/avatars/mami/',
			'/default/avatars/sayaka/'
		]
	}
}