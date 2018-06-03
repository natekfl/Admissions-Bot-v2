const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;
const robloxActions = require("../robloxActions.js");
const globalFuncs = require("../globalFuncs.js");

module.exports = function (member) {
    if (member.guild.id === idvariables.serverId) {
        member.setRoles([client.guilds.get(idvariables.serverId).roles.get(idvariables.miscRoles.awaitingVerification)])
        robloxActions.getRobloxIdFromDiscordID(member.id, function (robloxId) {
            if (robloxId) {
                robloxActions.getRankName(robloxId, function (rankName) {
                    if (!globalFuncs.setDiscordRankAdmissions(member, rankName)) {
                        client.channels.get(idvariables.channels.rolereqchannel).send(`${member}, Welcome to the admissions discord. Please do !rankme`);
                    }
                });
            } else {
                client.channels.get(idvariables.channels.rolereqchannel).send(`${member}, Unable to fetch roblox ID. Ensure you are verified at https://verify.eryn.io/. Then do !rankme`);
            }
        });
    }
}