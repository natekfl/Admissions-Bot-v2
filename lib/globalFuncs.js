const robloxActions = require("./robloxActions");
const client = require('../index.js').client;
const idvariables =  require('../config/idvariables.json');

module.exports = {
    suspendUser: function (userToSuspend, callback) {
        robloxActions.getRobloxIdFromDiscordID(userToSuspend.id, function (robloxId) {
            if (robloxId) {
                robloxActions.changeRank(robloxId, 'Suspended');
                callback(true);
            } else {
                callback(false);
            }
        });

        userToSuspend.removeRoles(userToSuspend.roles);
        userToSuspend.addRole(client.guilds.get(idvariables.serverId).roles.get(idvariables.roles.suspended));
    }
};