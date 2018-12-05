const idvariables = require('../../config/idvariables.json');
const client = require('../../index.js').client;
const tools = require('../tools.js');
const globalFuncs = require('../globalFuncs.js');
const robloxActions = require("../robloxActions.js");
const checkUserData = require("./handleCheckUserData.js");
const genId = () => { return Math.random().toString(36).substr(2, 9) };

let cooldowns = {
    "!dotrainings": false
};

let commands = {
    "!citate": {
        "usage": "!citate [@user] [reason]",
        "description": "Citate a user. Can only be used by Junior Officer+",
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
            const reason = args.slice(2).join(" ");
            const time = (new Date())
            let citationsData = require("../../data/citationData.json");
            const citationId = genId();

            citationsData[citationId] = {
                userCitated: userCited.id,
                time: time.getTime(),
                citatedBy: message.member.id,
                reason: reason,
                citationMessage: null,
                void: false,
                voidedBy: null,
                voidedTime: null
            };

            let usersData = require("../../data/userData.json");
            let citatedUserData = (userCited.id in usersData) ? usersData[userCited.id] : {};
            if (!("citationsRecieved" in citatedUserData)) citatedUserData["citationsRecieved"] = {};
            let userGivingCitationData = (message.member.id in usersData) ? usersData[message.member.id] : {};
            if (!("citationsGiven" in userGivingCitationData)) userGivingCitationData["citationsGiven"] = {};

            citatedUserData['citationsRecieved'][citationId] = true;
            userGivingCitationData['citationsGiven'][citationId] = true
            usersData[userCited.id] = citatedUserData;
            usersData[message.member.id] = userGivingCitationData;

            let totalCitations = Object.keys(citatedUserData["citationsRecieved"]).length;
            Object.keys(citatedUserData["citationsRecieved"]).forEach((value, number) => {
                if (value in citationsData && citationsData[value].void == true) {
                    totalCitations--;
                }
            })

            if (((totalCitations % 3) === 0) && totalCitations !== 0) {
                globalFuncs.suspendUser(userCited, 24, message.member, "Three Citations", function (success) {
                    if (!success) {
                        message.reply("There was an error when trying to change the user's group rank. The user will still be given the suspended discord role, but will not be roled in the roblox group.");
                    }
                });
            };

            const citationEmbed = {
                "timestamp": time.toISOString(),
                "color": (((totalCitations % 3) === 0) && totalCitations !== 0) ? 12845056 : 15263744,
                "fields": [
                    {
                        "name": "Citation ID",
                        "value": citationId
                    },
                    {
                        "name": "User Citated",
                        "value": userCited.toString()
                    },
                    {
                        "name": "Citated by",
                        "value": message.member.toString()
                    },
                    {
                        "name": "Reason",
                        "value": reason
                    },
                    {
                        "name": "Number of Citations for the user",
                        "value": totalCitations.toString()
                    }
                ]
            };
            client.guilds.get(idvariables.serverId).channels.get(idvariables.channels.citatelogchannel).send({ embed: citationEmbed }).then(messageSent => {
                citationsData[citationId].citationMessage = messageSent.id;

                require('fs').writeFile("./data/citationData.json", JSON.stringify(citationsData, null, 2), function (err) {
                    if (err) return console.log(err);
                });
                require('fs').writeFile("./data/userData.json", JSON.stringify(usersData, null, 2), function (err) {
                    if (err) return console.log(err);
                });
                message.reply(`Successfully cited ${userCited.displayName}`);
            }).catch(() => {
                require('fs').writeFile("./data/citationData.json", JSON.stringify(citationsData, null, 2), function (err) {
                    if (err) return console.log(err);
                });
                require('fs').writeFile("./data/userData.json", JSON.stringify(usersData, null, 2), function (err) {
                    if (err) return console.log(err);
                });
                message.reply(`Successfully cited ${userCited.displayName}`);
            });
            return true
        }
    },
    "!voidcitation": {
        "usage": "!voidcitation [ID]",
        "description": "Voids the specified citation. Can only be used by Senior Officer+",
        "perm": 8,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length !== 2) return false;
            //Command is correct

            const citationId = args[1];
            const citationData = require("../../data/citationData.json");
            let citation = (citationId in citationData) ? citationData[citationId] : null;

            if (!citation) {
                message.reply("Cannot find a citation by that ID");
                return true;
            }

            if (citation.void == true) {
                message.reply("That citation has already been voided.");
                return true;
            }

            const citedUser = client.guilds.get(idvariables.serverId).members.get(citation.userCitated);
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(citedUser))) {
                message.reply("You cannot void a citation from a user at or above your rank.");
                return true;
            }

            const time = new Date()
            citation['void'] = true;
            citation['voidedBy'] = message.member.id;
            citation['voidedTime'] = time.getTime()
            citationData[citationId] = citation;

            require('fs').writeFile("./data/citationData.json", JSON.stringify(citationData, null, 2), function (err) {
                if (err) return console.log(err);
            });

            message.reply("Citation voided.");

            client.channels.get(idvariables.channels.citatelogchannel).fetchMessage(citation.citationMessage) //Edit citation log message
                .then(sentMessage => {
                    const oldCitationEmbed = sentMessage.embeds[0]

                    let citationEmbed = {
                        "timestamp": oldCitationEmbed.timestamp,
                        "description": "Citation voided on " + time.toString()
                    };

                    let fields = [];
                    oldCitationEmbed.fields.forEach(value => {
                        fields.push({
                            "name": value.name,
                            "value": value.value
                        });
                    })
                    fields.push({
                        "name": "Voided By",
                        "value": message.member.toString()
                    });
                    citationEmbed['fields'] = fields;

                    sentMessage.edit({embed: citationEmbed})
                })

            return true;
        }
    },
    "!suspend": {
        "usage": "!suspend [@user] [hours] [reason]",
        "description": "Suspend a user. Can only be used by Junior Officer+",
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
    "!endsuspension": {
        "usage": "!endsuspension [suspension ID]",
        "description": "Ends a suspension. Can only be used by Senior Officer+",
        "perm": 9,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length !== 2) return false;
            //Command is correct

            const suspensionId = args[1];
            const suspensionsData = require("../../data/suspensionData.json");
            let suspension = (suspensionId in suspensionsData) ? suspensionsData[suspensionId] : null;

            if (!suspension) {
                message.reply("Cannot find a suspension by that ID");
                return true;
            }

            if (suspension.actualEndEpoch !== null) {
                message.reply("That suspension has already been ended.");
                return true;
            }

            const suspendedUser = client.guilds.get(idvariables.serverId).members.get(suspension.suspendedUser);
            if (!(tools.getPermLevel(message.member) > tools.getPermLevel(suspendedUser))) {
                message.reply("You cannot end a suspension from a user at or above your rank.");
                return true;
            }

            globalFuncs.endSuspension(suspensionId);
            message.reply("Suspension ended.");
            return true;
        }
    },
    "!approve": {
        "usage": "!approve [@user]",
        "description": "[SUBJECT TO REMOVAL]",
        "perm": 6,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            if (message.mentions.members.first() == null) return false;
            //Command is correct
            let userApproved = message.mentions.members.first();
            let userGivingApproval = message.member;
            if (tools.getPermLevel(userApproved) !== 2) {
                message.reply("You can only approve Labour Lotteries.");
                return true;
            }

            let approvedData = require("../../data/approvalData.json");
            let usersData = require("../../data/userData.json");
            let userRecievingApprovalData = (userApproved.id in usersData) ? usersData[userApproved.id] : {};
            let userGivingApprovalData = (userGivingApproval.id in usersData) ? usersData[userGivingApproval.id] : {};
            let existingApproval = false;
            if ("approvalsRecieved" in userRecievingApprovalData) {
                for (let uuid in userRecievingApprovalData["approvalsRecieved"]) {
                    if (approvedData[uuid].open === true) {
                        existingApproval = true;
                    }
                }
            } else {
                userRecievingApprovalData["approvalsRecieved"] = {};
            }

            if (existingApproval) {
                message.reply(`${userApproved.displayName} currently has an open approval.`);
                return true;
            }

            const approvalId = genId();
            approvedData[approvalId] = {
                userApproved: userApproved.id,
                approvedBy: message.member.id,
                time: (new Date()).getTime(),
                open: true
            };
            require('fs').writeFile("./data/approvalData.json", JSON.stringify(approvedData, null, 2), function (err) {
                if (err) return console.log(err);
            });

            if (!("approvalsGiven" in userGivingApprovalData)) userGivingApprovalData["approvalsGiven"] = {};

            userRecievingApprovalData["approvalsRecieved"][approvalId] = true;
            usersData[userApproved.id] = userRecievingApprovalData;
            userGivingApprovalData["approvalsGiven"][approvalId] = true;
            usersData[userGivingApproval.id] = userGivingApprovalData;
            require('fs').writeFile("./data/userData.json", JSON.stringify(usersData, null, 2), function (err) {
                if (err) return console.log(err);
            });

            setTimeout(() => {
                let approvedData = require("../../data/approvalData.json");
                if (approvedId in approvedData && approvedData[approvedId].open === true) {
                    approvedData[approvedId].open = false;
                    require('fs').writeFile("./data/approvalData.json", JSON.stringify(approvedData, null, 2), function (err) {
                        if (err) return console.log(err);
                    });
                }

            }, 2 * (1000 * 60 * 60 * 24 * 7))

            message.reply(`Successfully approved ${userApproved.displayName}`);
            return true;
        }
    },
    "!approvedlist": {
        "usage": "!approvedlist",
        "description": "[SUBJECT TO REMOVAL]",
        "perm": 6,
        "func": function (message) {
            //Command is correct
            let approvalData = require("../../data/approvalData.json");
            let list = "List of approved users: \n\n";
            let changed = false;
            for (let uuid in approvalData) {
                if (approvalData[uuid].open === true) {
                    if (message.guild.members.get(approvalData[uuid].userApproved)) {
                        list += `${message.guild.members.get(approvalData[uuid].userApproved)}\n`;
                    } else {
                        approvalData[uuid].open = false;
                        changed = true;
                    }
                }
            }
            if (changed) {
                require('fs').writeFile("./data/approvalData.json", JSON.stringify(approvalData, null, 2), function (err) {
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
                                            message.member.send("To continue, please send me the following screenshot:\n\nJoin the application game [https://www.roblox.com/games/2304919812]" +
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
            let subject = (message.content.split(" ").length === 2) ? message.mentions.members.first() : message.member;
            if (!subject) return false;
            robloxActions.getRobloxIdFromDiscordID(subject.id, function (robloxId) {
                if (robloxId) {
                    robloxActions.getUsernameFromId(robloxId, function (username) {
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
        "description": "Deletes the specified number of messages. Can only be used by Senior Officer+",
        "perm": 10,
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
        "description": "Spams the specified users to do applications. Can only be used by High Command+",
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
        "description": "Resolves a proof request. Approve = User will be accepted into the group. Redo = The user will be prompted to redo the proof request. Denied = The user will be exiled. Can only be used by Commissioner+",
        "perm": 11,
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
                            client.guilds.get(idvariables.serverId).members.get(args[1]).send("Your request has been **accepted**. Please check the pinned messages in #trial-requests for your next steps.");
                        } else {
                            client.guilds.get(idvariables.serverId).members.get(args[1]).send(`Your request has been **accepted**. Please send a join request to the group and do !rankme in the Admissions Discord Server. https://www.roblox.com/Groups/Group.aspx?gid=${idvariables.robloxGroupId}`);
                        }
                    });
                });

            } else if (args[2].toLowerCase() === "redo") {
                awaitingProof[args[1]] = 0;
                client.guilds.get(idvariables.serverId).members.get(args[1]).send("Your request has been **denied** for lack of evidence." +
                    " You will need to try again and follow the instructions carefully:\n\n\n\n" +
                    "To continue, please send me the following screenshot:\n\nJoin the application game [https://www.roblox.com/games/2304919812]" +
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
    },
    "!data": {
        "usage": "!data [type] [params]",
        "description": "Gives some data. Check the documentation here: https://goo.gl/vnp6gF",
        "perm": 0,
        "func": function (message) {
            let args = message.content.split(" ");
            if (args.length < 2) return false;
            let params = args.slice(0);
            params.splice(0, 2)
            let result = checkUserData(args[1].toLowerCase(), params, message.member, message.mentions);
            if (result === false) {
                return false
            } else {
                message.reply(result);
            }
            return true;
        }
    }

};

module.exports = function (message) {
    if (message.content.startsWith("!")) {
        if (message.content.split(" ")[0] in commands) {
            // Command exists
            let command = commands[message.content.split(" ")[0]];
            if (message.member != null && tools.getPermLevel(message.member) >= command.perm) { // Check perms
                if ((message.content.split(" ")[0] in cooldowns) && cooldowns[message.content.split(" ")[0]] === true) { //Check if on cooldown
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
            let showAll = (args.length === 2) ? (args[1].toLowerCase() === "all") : (false);
            if ((args.length === 2 && args[1].toLowerCase() === "all") || args.length === 1) { //If it is not asking for a specific command
                let response = "Here is a list of commands. To get more info on a command, do !help [command name]\n\n";
                if (!showAll) response += "Please note that these are only the commands you can use. To see all the commands, do !help all.\n\n";
                for (let command in commands) {
                    if (tools.getPermLevel(message.member) >= commands[command].perm || showAll) {
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
        setTimeout(function () { message.delete() }, 120000)// Delete messages in #role-requests after 2 minutes.
    }
};
