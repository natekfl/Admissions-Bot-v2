const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;
const tools = require('../tools.js');
const globalFuncs = require('../globalFuncs.js');
const robloxActions = require("../robloxActions");


commands = {
    "!citate": {
        "usage": "!citate [@user] [reason]",
        "description": "Citate a user. Can only be used by Chief+",
        "perm": 10,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 3) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userCited = message.mentions.members.first();
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(userCited))) {
                message.reply("You cannot cite a user at or above your rank.")
                return true;
            }
            let reason = args.slice(2).join(" ");
            let totalCitations = (require("../../data/citations.json")[userCited.id]) ? require("../../data/citations.json")[userCited.id] + 1 : 1;
            client.channels.get(idvariables.channels.citatelogchannel).send(`Citation ${totalCitations}/3 for ${userCited}. [${reason}] ${(totalCitations >= 3) ? 'The user has been suspended.' : ''}`);
            if (totalCitations >= 3) {
                globalFuncs.suspendUser(userCited, 24, message.member, "Three Citations", function (success) {
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
    },
    "!suspend": {
        "usage": "!suspend [@user] [hours] [reason]",
        "description": "Suspend a user. Can only be used by Chief+",
        "perm": 10,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 4) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userSuspended = message.mentions.members.first();
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(userSuspended))) {
                message.reply("You cannot suspend a user at or above your rank.")
                return true;
            }
            let hours = args[2]
            let reason = args.slice(3).join(" ");

            globalFuncs.suspendUser(userSuspended, hours, message.member, reason, function (success) {
                if (!success) {
                    message.reply("There was an error when trying to change the user's group rank. The user will still be given the suspended discord role, but will not be roled in the roblox group.");
                } else {
                    message.reply("Successfully suspended the user");
                }
            });
            return true;
        }
    },
    "!unsuspend": {
        "usage": "!unsuspend [@user]",
        "description": "Unuspend a user. Can only be used by Chief+",
        "perm": 10,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userSuspended = message.mentions.members.first();
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(userSuspended))) {
                message.reply("You cannot unsuspend a user at or above your rank.")
                return true;
            }

            globalFuncs.unsuspendUser(userSuspended);
            message.reply("User unsuspended")
            return true;
        }
    },
    "!rankme": {
        "usage": "!rankme",
        "description": "Gives yourself the discord roles according to your group rank.",
        "perm": 0,
        "func": function (message) {
            robloxActions.getRobloxIdFromDiscordID(message.member.id, function (robloxId) {
                if (robloxId) {
                    robloxActions.getRankName(robloxId, function (rankName) {
                        if (globalFuncs.setDiscordRankAdmissions(message.member, rankName)) {
                            message.reply("Roles given successfully.");
                        } else {
                            message.reply(`Unable to give roles for rank **${rankName}**`);
                        }
                    })
                } else {
                    message.reply("Unable to fetch roblox ID. Ensure you are verified at https://verify.eryn.io/")
                }
            });
            return true;
        }
    },
    "!checkverified": {
        "usage": "!checkverified [@user (optional)]",
        "description": "Checks if the specified user is verified. If no user is specified, it will check the sender.",
        "perm": 0,
        "func": function (message) {
            let subject = (message.mentions.members.first()) ? message.mentions.members.first() : message.member;
            robloxActions.getRobloxIdFromDiscordID(message.member.id, function(robloxId) {
                console.log(robloxId);
                if (robloxId) {
                    message.reply(`${subject.displayName} is verified`);
                } else {
                    message.reply(`${subject.displayName} is not verified`);
                }
            });
            return true; //Command syntax is correct
        }
    }
};

module.exports = function (message) {
    if (message.content.startsWith("!")) {
        if (message.content.split(" ")[0] in commands) {
            // Command exists
            let command = commands[message.content.split(" ")[0]];
            if (tools.getPermLevel(message.member) >= command.perm) { // Check perms
                let success = command.func(message); //Do command
                if (!success) {
                    message.reply(`Invalid syntax. The correct syntax is \`${command.usage}\`.`)
                }
            } else {
                message.reply("You do not have the required permission to run that command.");
            }
        } else if (message.content.startsWith("!help")) {
            let args = message.content.split(" ");
            if (args.length === 1) {
                let response = "Here is a list of commands. To get more info on a command, do !help [command name]\n\n";
                for (let command in commands) {
                    response += `\n\`${commands[command].usage}\`\n`;
                }
                message.reply(response);
            } else {
                if (('!' + args[1]) in commands) {
                    message.reply(`**${'!' + args[1]}**
                    
                    \`${commands['!' + args[1]].usage}\`
                    
                    ${commands['!' + args[1]].description}`)
                } else {
                  message.reply("Invalid command. Try !help.");
                }
            }
        } else {
            message.reply("Invalid command. Try !help.")
        }
    }
};
