const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;

module.exports = function (member) {
    if (member.guild.id === idvariables.serverId) {
        member.setRoles([client.guilds.get(idvariables.serverId).roles.get(idvariables.miscRoles.awaitingVerification)])
    }
}