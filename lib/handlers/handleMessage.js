const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;
const tools = require('../tools.js');
const globalFuncs = require('../globalFuncs.js');
const robloxActions = require("../robloxActions");

let cooldowns = {
	"!dotrainings": false
};

let commands = {
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
                message.reply("You cannot cite a user at or above your rank.");
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
            message.reply(`Successfully cited ${userCited.displayName}`);
            return true;
        }
    },
    "!uncitate": {
        "usage": "!uncitate [@user]",
        "description": "Removes one citation from  a user. Can only be used by Junior Supervisor+",
        "perm": 8,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userCited = message.mentions.members.first();
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(userCited))) {
                message.reply("You cannot remove a citation from or above your rank.");
                return true;
            }
            let totalCitations = (require("../../data/citations.json")[userCited.id]) ? require("../../data/citations.json")[userCited.id] - 1 : -1;
            if (totalCitations < 0) {
                message.reply("That user does not have any citations.");
                return true;
            }
            let newData = require("../../data/citations.json");
            newData[userCited.id] = totalCitations;
            require('fs').writeFile("./data/citations.json", JSON.stringify(newData, null, 2), function (err) {
                if (err) return console.log(err);
            });
            message.reply(`Successfully removed citation from ${userCited.displayName}`);
            return true;
        }
    },
    "!citations": {
        "usage": "!citations [@user (optional)]",
        "description": "Shows how many citations the specified user has. If no user is specified, it will check the sender.",
        "perm": 0,
        "func": function (message) {
            let subject = (message.content.split(" ").length===2) ? message.mentions.members.first() : message.member;
            if (!subject) return false;
            let totalCitations = (require("../../data/citations.json")[subject.id]) ? require("../../data/citations.json")[subject.id] : 0;
            message.reply(`${subject.displayName} has ${totalCitations} citations.`);
            return true; //Command syntax is correct
        }
    },
    "!suspend": {
        "usage": "!suspend [@user] [hours] [reason]",
        "description": "Suspend a user. Can only be used by Supervisor+",
        "perm": 9,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 4) return false;
            if (isNaN(args[2])) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userSuspended = message.mentions.members.first();
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(userSuspended))) {
                message.reply("You cannot suspend a user at or above your rank.");
                return true;
            }
            let hours = args[2];
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
                message.reply("You cannot unsuspend a user at or above your rank.");
                return true;
            }

            globalFuncs.unsuspendUser(userSuspended);
            message.reply("User unsuspended");
            return true;
        }
    },
    "!approve": {
        "usage": "!approve [@user]",
        "description": "Approves a user to take the Apprentice Test. Can only be used by Senior Inspector+",
        "perm": 6,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userApproved = message.mentions.members.first();
            if (tools.getPermLevel(userApproved) !== 2) {
                message.reply("You can only approve Labour Lotteries.");
                return true;
            }
            let approvedData = require("../../data/testApproved.json");
            if (userApproved.id in approvedData && approvedData[userApproved.id] === true) {
                message.reply(`${userApproved.displayName} is already approved.`);
                return true;
            }
            approvedData[userApproved.id] = true;
            require('fs').writeFile("./data/testApproved.json", JSON.stringify(approvedData, null, 2), function (err) {
                if (err) return console.log(err);
            });
            message.reply(`Successfully approved ${userApproved.displayName}`);
            return true;
        }
    },
    "!approvedlist": {
        "usage": "!approvedlist",
        "description": "Shows the list of users approved to take the Apprentice Test, from oldest to Newest. Can only be used by Head Inspector+",
        "perm": 7,
        "func": function (message) {
            //Command is correct
            let approvedData = require("../../data/testApproved.json");
            let list = "List of approved users: \n\n";
            let changed = false;
            for (let id in approvedData) {
                if (approvedData[id] === true) {
                    if (message.guild.members.get(id)) {
                        list += `${message.guild.members.get(id)}\n`;
                    } else {
                        delete approvedData[id];
                        changed = true;
                    }
                }
            }
            if (changed) {
                require('fs').writeFile("./data/testApproved.json", JSON.stringify(approvedData, null, 2), function (err) {
                    if (err) return console.log(err);
                });
            }
            message.channel.send(list);
            return true;
        }
    },
    "!rankme": {
        "usage": "!rankme",
        "description": "Gives yourself the discord roles according to your group rank.",
        "perm": 0,
        "func": function (message) {
			message.reply("Please wait...")
				.then(waitMessage => {
					robloxActions.getRobloxIdFromDiscordID(message.member.id, function (robloxId) {
						if (robloxId) {
							robloxActions.getRankName(robloxId, function (rankName) {
								if (globalFuncs.setDiscordRankAdmissions(message.member, rankName)) {
									robloxActions.getUsernameFromId(robloxId, (username) => message.member.setNickname(username));
									waitMessage.edit(`${message.author}, Roles given successfully.`);
								} else {
									if (rankName === 'Guest') { //Go through proof stuffs
                                        let awaitingProof = require("../../data/awaitingProof.json");
                                        if (message.member.id in awaitingProof) {
                                            if ([0, 1, 3].includes(awaitingProof[message.member.id])) { //Not sent, waiting, denied
                                                waitMessage.edit(`${message.author}, You cannot do this command right now. Check your previous DMs from me for more information.`);
                                            } else if (awaitingProof[message.member.id] === 2) {
                                                robloxActions.getRobloxIdFromDiscordID(message.member.id, (robloxId) => {
                                                    robloxActions.acceptJoinRequest(robloxId, worked => {
                                                        if (worked) {
                                                            waitMessage.edit(`${message.author}, Attempting to accept into ROBLOX group...`); //Rank user and try again
                                                            commands["!rankme"]["func"](message);
                                                        } else {
                                                            waitMessage.edit(`${message.author}, Please send a join request to the group and try again. https://www.roblox.com/Groups/Group.aspx?gid=${idvariables.robloxGroupId}`);
                                                        }
                                                    });
                                                });
                                            }
                                        } else {
                                            awaitingProof[message.member.id] = 0; //Means awaiting proof message.
                                            require('fs').writeFile("./data/awaitingProof.json", JSON.stringify(awaitingProof, null, 2), function (err) {
                                                if (err) return console.log(err);
                                            });
                                            waitMessage.edit(`${message.author}, Please check your DM's for further instructions`);
                                            message.member.send("To continue, please send me the following screenshot:\n\nJoin the application game [https://www.roblox.com/games/1274256331]" +
                                                " and press escape so your username is visible, then take a screenshot and DM it to me. Please note that I will" +
                                                " only take the screenshot you send, not any text. For this reason, please ensure the image is an attachment, not a link.")
                                        }
									} else {
										waitMessage.edit(`${message.author}, Unable to give roles for rank **${rankName}**`);
									}

								}
							})
						} else {
							waitMessage.edit(`${message.author}, Unable to fetch roblox ID. Ensure you are verified at https://verify.eryn.io/`)
						}
					});
				});
            return true; // Command syntax is correct
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
                    robloxActions.getUsernameFromId(robloxId, function(username) {
                        message.reply(`${subject.displayName} is verified to ${username}`);
                    });
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
    "!doapplications": {
        "usage": "!doapplications [@users]",
        "description": "Spams the specified users to do applications",
        "perm": 11,
        "func": function (message) {
            let args = message.content.split(" ");
            if (message.mentions.members.size < 1) return false;
            if (message.mentions.members.size !== (args.length - 1)) return false;
            //Command is correct
			let usersToTag = "";
			for (let l = 0; l < message.mentions.members.size; l++) {
				usersToTag += message.mentions.members.array()[l];
				usersToTag += " ";
			}
            for (let i = 0; i < 20; i++) {
                setTimeout(function () {
                    message.channel.send(usersToTag + "DO APPS!");
                }, (i * 3000))
            }
            return true; //Command syntax is correct
        }
    },
    "!resolve": {
        "usage": "!resolve [ID] [approved/redo/denied]",
        "description": "Resolves a proof request. Approve = User will be accepted into the group. Redo = The user will be prompted to redo the proof request. Denied = The user will be exiled.",
        "perm": 10,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 3) return false;
            let awaitingProof = require("../../data/awaitingProof.json");
            if (!(["approved", "redo", "denied"].includes(args[2].toLowerCase()))) return false;
            //Command is correct

            if (!(args[1] in awaitingProof) || awaitingProof[args[1]] !== 1) {
                message.reply("That is not a valid request ID.");
                return true; //Command syntax is correct.
            }
            client.channels.get(idvariables.channels.proofapprovalchannel).fetchMessages().then(messages => {
                messages.forEach(message => {
                    if (message.content.includes(args[1])) message.delete();
                })
            });

            if (args[2].toLowerCase() === "approved") {
                awaitingProof[args[1]] = 2;
                robloxActions.getRobloxIdFromDiscordID(args[1], (robloxId) => {
                    robloxActions.acceptJoinRequest(robloxId, worked => {
                        if (worked) {
                            globalFuncs.setDiscordRankAdmissions(client.guilds.get(idvariables.serverId).members.get(args[1]), "Awaiting Verification");
                            client.guilds.get(idvariables.serverId).members.get(args[1]).send("Your request has been **accepted**. Please check the pinned messages in #train-requests for your next steps.");
                        } else {
                            client.guilds.get(idvariables.serverId).members.get(args[1]).send(`Your request has been **accepted**. Please send a join request to the group and do !rankme in the Admissions Discord Server. https://www.roblox.com/Groups/Group.aspx?gid=${idvariables.robloxGroupId}`);
                        }
                    });
                });

            } else if (args[2].toLowerCase() === "redo") {
                awaitingProof[args[1]] = 0;
                client.guilds.get(idvariables.serverId).members.get(args[1]).send("Your request has been **denied** for lack of evidence." +
                    " You will need to try again and follow the instructions carefully:\n\n\n\n" +
                    "To continue, please send me the following screenshot:\n\nJoin the application game [https://www.roblox.com/games/1274256331]" +
                    " and press escape so your username is visible, then take a screenshot and DM it to me. Please note that I will" +
                    " only take the screenshot you send, not any text. For this reason, please ensure the image is an attachment, not a link.")

            } else if (args[2].toLowerCase() === "denied") {
                awaitingProof[args[1]] = 3;
                client.guilds.get(idvariables.serverId).members.get(args[1]).send("Your request has been **denied**.")
                client.channels.get(idvariables.channels.hicomchannel).send(`Please exile <@${args[1]}>`)
            }

            require('fs').writeFile("./data/awaitingProof.json", JSON.stringify(awaitingProof, null, 2), function (err) {
                if (err) return console.log(err);
            });
            message.reply("Request resolved");

            return true; //Command syntax is correct.
        }
    }

};

module.exports = function (message) {
    if (message.content.startsWith("!")) {
        if (message.content.split(" ")[0] in commands) {
            // Command exists
            let command = commands[message.content.split(" ")[0]];
            if (message.member != null && tools.getPermLevel(message.member) >= command.perm) { // Check perms
				if ((message.content.split(" ")[0] in cooldowns) && cooldowns[message.content.split(" ")[0]] === true){ //Check if on cooldown
					message.reply("That command is currently on cooldown.");
				} else {
					let success = command.func(message); //Do command
					if (!success) {
						message.reply(`Invalid syntax. The correct syntax is \`${command.usage}\`.`)
					}
				}
            } else {
                message.reply("You do not have the required permission to run that command.");
            }
        } else if (message.content.startsWith("!help")) {
            let args = message.content.split(" ");
            let showAll = (args[1].toLowerCase() === "all");
            if ((args.length === 2 && args[1].toLowerCase() === "all") || args.length === 1) { //If it is not asking for a specific command
                let response = "Here is a list of commands. To get more info on a command, do !help [command name]\n\n";
                if (!showAll) response += "Please note that these are only the commands you can use. To see all the commands, do !help all.\n\n";
                for (let command in commands) {
                    if (tools.getPermLevel(message.member) >= command.perm || showAll) {
                        response += `\n\`${commands[command].usage}\`\n`;
                    }
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
	if (message.channel.id === idvariables.channels.rolereqchannel) {
        setTimeout(function() {message.delete()}, 120000)// Delete messages in #role-requests after 2 minutes.
    }
};
