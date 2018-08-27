const client = require('../../index.js').client;
const idvariables =  require('../../config/idvariables.json');

module.exports = function(dm) {
    let awaitingProof = require("../../data/awaitingProof.json");
    if (dm.author.id in awaitingProof) {
        if (awaitingProof[dm.author.id] === 0) {
            let attachments = [];
            dm.attachments.forEach((a) => {
                attachments.push(a.url);
            });
            if (attachments.length > 0) {
                awaitingProof[dm.author.id] = 1; //Means proof message sent.
                require('fs').writeFile("./data/awaitingProof.json", JSON.stringify(awaitingProof, null, 2), function (err) {
                    if (err) return console.log(err);
                });
                client.channels.get(idvariables.channels.proofapprovalchannel).send(`User: ${dm.author}, ID: ${dm.author.id}`, {files: attachments});
                dm.reply(`Thank you, your request will be reviewed shortly. In the meantime, please send a join request to the group. https://www.roblox.com/Groups/Group.aspx?gid=${idvariables.robloxGroupId}`);
            } else {
                dm.reply("To continue, please send me the following screenshot:\n\nJoin the application game [https://www.roblox.com/games/1274256331]" +
                    " and press escape so your username is visible, then take a screenshot and DM it to me. Please note that I will" +
                    " only take the screenshot you send, not any text.");
            }
        } else if (awaitingProof[dm.author.id] === 1) {
            dm.reply("Your request has already been submitted and will be reviewed shortly.");
        }
    }
};