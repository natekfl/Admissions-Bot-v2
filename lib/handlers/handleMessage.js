const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;
const tools = require('../tools.js');
const globalFuncs = require('../globalFuncs.js');
const robloxActions = require("../robloxActions");


commands = {
    "!citate": {
        "usage": "!citate [@user] [reason]",
        "description": "Citate a user. Can only be used by Junior Supervisor+",
        "perm": 8,
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
        "description": "Suspend a user. Can only be used by Supervisor+",
        "perm": 9,
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
        "description": "Unuspend a user. Can only be used by Supervisor+",
        "perm": 9,
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
            let subject = (message.content.split(" ").length===2) ? message.mentions.members.first() : message.member;
			if (!subject) return false;
            robloxActions.getRobloxIdFromDiscordID(subject.id, function(robloxId) {
                if (robloxId) {
                    message.reply(`${subject.displayName} is verified`);
                } else {
                    message.reply(`${subject.displayName} is not verified`);
                }
            });
            return true; //Command syntax is correct
        }
    },
    "!clear": {
        "usage": "!clear [number]",
        "description": "Deletes the specified number of messages. Can only be used by Junior Supervisor+",
        "perm": 8,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            if (isNaN(args[1])) return false;
            //Command is correct
            message.channel.bulkDelete(args[1])
                .then(messages => {
                    message.reply(`Deleted ${messages.size} messages.`)
                        .then(sentMessage => {
                            setTimeout(function () {
                                sentMessage.delete(); //Deletes reply after 3 seconds
                            }, 3000)
                        })
                });
            return true; //Command syntax is correct
        }
    },
    "!canbetrialed": {
        "usage": "!canbetrialed [@user]",
        "description": "Checks if the specified user can be trialed. Can only be used by Senior Inspector+",
        "perm": 6,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            let subject = message.mentions.members.first();
            if (!subject) return false;
            const trialFailData = require('../../data/failedTrials.json');
            if (tools.getPermLevel(subject) === 2) {
                if (subject.id in trialFailData) {
                    if (trialFailData[subject.id].trialsFailed >= 2) {
                        message.reply(`${subject.displayName} should not be trialed, they have failed ${trialFailData[subject.id].trialsFailed} already.`);
                    } else if ((trialFailData[subject.id].lastTrialTime + 43200000) > (new Date).getTime()) { //If it has been less than 12 hours from last trial
                        message.reply(`${subject.displayName} should not be trialed, they have failed a trial ${Math.round(((new Date).getTime() - trialFailData[subject.id].lastTrialTime) / 3600000)} hours ago.`);
                    } else {
                        message.reply(`${subject.displayName} is good to be trialed!`)
                    }
                } else {
                    message.reply(`${subject.displayName} is good to be trialed!`)
                }
            } else {
                message.reply(`${subject.displayName} should not be trialed, they aren't a Labour Lottery`);
            }
            return true; //Command syntax is correct
        }
    }

};

module.exports = function (message) {
    if (message.content.startsWith("!")) {
        if (message.content.split(" ")[0] in commands) {
            // Command exists
            let command = commands[message.content.split(" ")[0]];
            if (message.member != null && tools.getPermLevel(message.member) >= command.perm) { // Check perms
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
    } else if (message.channel.id === idvariables.channels.trialreportchannel && message.member.id !== client.user.id) {
        require('./handleTrialReport.js').processNewReport(message);
    }
};
