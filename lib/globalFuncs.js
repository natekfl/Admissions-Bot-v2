const robloxActions = require("./robloxActions");
const client = require('../index.js').client;
const idvariables =  require('../config/idvariables.json');

module.exports = {
    suspendUser: function (userToSuspend, length, suspendor, reason, callback) {
        let rank = undefined;
        robloxActions.getRobloxIdFromDiscordID(userToSuspend.id, function (robloxId) {
            if (robloxId) {
                robloxActions.changeRank(robloxId, 'Suspended');
                rank = robloxActions.getRankName(robloxId, function(rankName) {
                    rank = rankName;
                    finalSuspend();
                });
                callback(true);
            } else {
                callback(false);
                finalSuspend();
            }

            function finalSuspend() {
                userToSuspend.removeRoles(userToSuspend.roles);
                userToSuspend.addRole(client.guilds.get(idvariables.serverId).roles.get(idvariables.roles.suspended));

                client.channels.get(idvariables.channels.suspendlogchannel).send(`Name of suspended: ${userToSuspend.displayName}
Rank of suspended: ${rank}
Name of suspendor: ${suspendor.displayName}
Reason: ${reason}
Time of suspension: ${length} hours`);
            }
        });
    }
};