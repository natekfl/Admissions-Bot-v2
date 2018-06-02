const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;

commands = {
    "!citate": {
        "usage": "!citate [@user] [reason]",
        "description": "Citate a user. Can only be used by Chief+",
        "perm": 0,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 3) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userCited = message.mentions.members.first();
            let reason = args.slice(2).join(" ");
            let totalCitations = (require("../../data/citations.json")[userCited.id]) ? require("../../data/citations.json")[userCited.id] + 1 : 1;
            client.channels.get(idvariables.channels.citatelogchannel).send(`Citation ${totalCitations}/3 for ${userCited}. [${reason}] ${(totalCitations >= 3) ? 'The user has been suspended.' : ''}`);
            if (totalCitations >= 3) {
                require('../globalFuncs.js').suspendUser(userCited, 24, message.member, "Three Citations", function (success) {
                    if (!success) {
                        message.reply("There was an error when trying to change the user's group rank. The user will still be given the suspended discord role, but will not be roled in the roblox group.");
                    }
                });
                totalCitations = 0;
            }
            let newData = require("../../data/citations.json");
            newData[userCited.id] = totalCitations;
            require('fs').writeFile("./data/citations.json", JSON.stringify(newData, null, 2), function (err) {
                if (err) return console.log(err);
            });
            message.reply(`Successfully cited ${userCited.displayName}`)
            return true;
        }
    }
};

module.exports = function (message) {
    if (message.content.startsWith("!")) {
        if (message.content.split(" ")[0] in commands) {
            let command = commands[message.content.split(" ")[0]];
            let success = command.func(message);
            if (!success) {
                message.reply(`Invalid syntax. The correct syntax is \`${command.usage}\`.`)
            }
        } else if (message.content === ("!help")) {
            //todo Help command
        } else {
            message.reply("Invalid command. Try !help.")
        }
    }
};
