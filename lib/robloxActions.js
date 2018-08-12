const https = require('https');
const config =  require('../config/config.json');
const idvariables =  require('../config/idvariables.json');
const Roblox  = require('roblox-js');

Roblox.login(config.robloxuser, config.robloxpass)
    .then(function () {
        console.log('Logged in to roblox account')
    }).catch(function (err) {
    console.error(err.stack);
});

module.exports = {
    getRobloxIdFromDiscordID: function(discordId, callback) {
        https.get(`https://verify.eryn.io/api/user/${discordId}`, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            resp.on('end', () => {
                if ("robloxId" in JSON.parse(data)) {
                    callback(JSON.parse(data).robloxId);
                } else {
                    callback(false);
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    },
    changeRank: function (robloxId, roleName) {
        return Roblox.setRank({group: idvariables.robloxGroupId, target: robloxId, name: roleName});
    },
    getRankName: function (robloxId, callback) {
        Roblox.getRankNameInGroup(idvariables.robloxGroupId, robloxId).then(rankName => { callback(rankName) });
    },
    getUsernameFromId: function (robloxId, callback) {
        Roblox.getUsernameFromId(parseInt(robloxId)).then(username => { callback(username) });
    },
    acceptJoinRequest: function(robloxId, callback) {
        Roblox.getUsernameFromId(parseInt(robloxId)).then(username => {
            Roblox.handleJoinRequest({group: idvariables.robloxGroupId, username: username, accept: true}).then(() => callback(true)).catch(() => callback(false));
        });
    },
    checkAppStatus: function(robloxId, callback) {
        Roblox.getUsernameFromId(parseInt(robloxId)).then(username => {
			try {
				https.get({host: 'terabyte.services', path: `/dashboard/app/tbsSearch.php?id=78866&user=${username}`, headers: {Cookie: 'tbsKeepSECRET=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvdGVyYWJ5dGUuc2VydmljZXMiLCJleHAiOjE1MzQyMDA4MzAsImlhdCI6MTUzMzg0NDUwMSwidXNyIjoibmF0ZWtmbCIsInVpZCI6IjIyODE5NTk5MCIsInRpZXIiOiIxIiwic2VjMSI6IjQ3LjE5Ny4zMS4xODMiLCJ0ZmEiOmZhbHNlLCJsb2dnZWRpbiI6dHJ1ZX0.VK9KwTzGhFYf51OGLYOgEiCCLO_9u9r2uQ4q-DCyF0I'}}, (resp) => {
					let data = '';

					// A chunk of data has been recieved.
					resp.on('data', (chunk) => {
						data += chunk;
					});

					// The whole response has been received.
					resp.on('end', () => {
						try {
							let accepted = false;
							console.log(JSON.parse(data));
							JSON.parse(data).forEach((application) => {
								if (application.status === '3') accepted = true;
							});
						callback(accepted);
						} catch(error) {
							callback(false);
						}
					});

				}).on("error", (err) => {
					callback(false);
					console.log("Error: " + err.message);
				});
			} catch(error) {
				callback(false);
			}
        }).then().catch(() => callback(false));
    }
};