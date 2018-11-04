const robloxActions = require("./robloxActions");
const client = require('../index.js').client;
const idvariables = require('../config/idvariables.json');
const genId = () => { return Math.random().toString(36).substr(2, 9) };

module.exports = {
    suspendUser: function (userToSuspend, length, suspendor, reason, callback) {
        let rank = undefined;
        robloxActions.getRobloxIdFromDiscordID(userToSuspend.id, function (robloxId) {
            if (robloxId) {
                //Saves and changes roblox rank
                robloxActions.getRankName(robloxId, function (rankName) {
                    rank = rankName;
                    finalSuspend();
                    robloxActions.changeRank(robloxId, 'Suspended');
                    callback(true);
                });
            } else {
                callback(false);
                finalSuspend();
            }

            function finalSuspend() { //runs after changing rank
                //sets roles and sends message
                let suspensionId = genId();
                const time = (new Date());
                module.exports.setDiscordRankAdmissions(userToSuspend, "Suspended");
                const suspendEmbed = {
                    "timestamp": time.toISOString(),
                    "color": 12845056,
                    "fields": [
                        {
                            "name": "Suspension ID",
                            "value": suspensionId
                        },
                        {
                            "name": "User Suspended",
                            "value": userToSuspend.toString()
                        },
                        {
                            "name": "Suspended by",
                            "value": suspendor.toString()
                        },
                        {
                            "name": "Reason",
                            "value": reason
                        },
                        {
                            "name": "Rank (at time of suspension)",
                            "value": rank
                        }
                        ,
                        {
                            "name": "Length",
                            "value": length + ' hours'
                        }
                    ]
                };
                client.channels.get(idvariables.channels.suspendlogchannel).send({ embed: suspendEmbed })
                    .then(sentMessage => {
                        //sets unsuspend time
                        setTimeout(function () {
                            module.exports.endSuspension(suspensionId);
                        }, (length * 3600000));

                        //writes to file
                        let suspensions = require("../data/suspensionData.json");
                        suspensions[suspensionId] = {
                            suspendedUser: userToSuspend.id,
                            rankAtSuspension: rank,
                            startEpoch: time.getTime(),
                            scheduledEndEpoch: (time.getTime() + (length * 3600000)),
                            actualEndEpoch: null,
                            suspendedBy: suspendor.id,
                            reason: reason,
                            suspendMessage: sentMessage.id
                        };
                        require('fs').writeFile("./data/suspensionData.json", JSON.stringify(suspensions, null, 2), function (err) {
                            if (err) return console.log(err);
                        });

                        let usersData = require("../data/userData.json");
                        currentUserdata = (userToSuspend.id in usersData) ? usersData[userToSuspend.id] : {};
                        if (!("suspensionsRecieved" in currentUserdata)) currentUserdata["suspensionsRecieved"] = {};
                        currentUserdata["suspensionsRecieved"][suspensionId] = true;
                        usersData[userToSuspend.id] = currentUserdata;

                        suspendorUserdata = (suspendor.id in usersData) ? usersData[suspendor.id] : {};
                        if (!("suspensionsGiven" in suspendorUserdata)) suspendorUserdata["suspensionsGiven"] = {};
                        suspendorUserdata["suspensionsGiven"][suspensionId] = true;
                        usersData[suspendor.id] = suspendorUserdata;
                        require('fs').writeFile("./data/userData.json", JSON.stringify(usersData, null, 2), function (err) {
                            if (err) return console.log(err);
                        });
                    });
            }
        });
    },
    endSuspension: function (suspensionId) {
        let suspensions = require("../data/suspensionData.json");
        const suspension = suspensions[suspensionId];
        const time = (new Date());
        if (suspension.suspendedUser in client.guilds.get(idvariables.serverId).members) {
            const user = client.guilds.get(idvariables.serverId).members.get(suspension.suspendedUser);
            try {
                client.channels.get(idvariables.channels.suspendlogchannel).fetchMessage(suspension.suspendMessage) //Edit suspension log message
                    .then(sentMessage => {
                        const oldSuspendEmbed = sentMessage.embeds[0]

                        let suspendEmbed = {
                            "timestamp": oldSuspendEmbed.timestamp,
                            "description": "Suspension ended on " + time.toString()
                        };

                        let fields = [];
                        oldSuspendEmbed.fields.forEach(value => {
                            fields.push({
                                "name": value.name,
                                "value": value.value
                            });
                        })
                        suspendEmbed['fields'] = fields;

                        sentMessage.edit({ embed: suspendEmbed });
                    })
                    .catch((err) => { console.log(err) });
            } catch (e) {
                console.log(e);
            }
            robloxActions.getRobloxIdFromDiscordID(user.id, function (robloxId) {
                //After fetching roblox info
                if (robloxId && suspension.rankAtSuspension) {
                    robloxActions.changeRank(robloxId, suspension.rankAtSuspension);
                    module.exports.setDiscordRankAdmissions(user, suspension.rankAtSuspension);
                    user.createDM().then(dm => dm.send("Your suspension has been removed."));
                } else {
                    user.createDM().then(dm => dm.send("Your suspension time is up, however there was an error when changing your group rank. Please contact a HICOM."));
                }

                suspensions[suspensionId]["actualEndEpoch"] = time.getTime();

                //Write to file
                require('fs').writeFile("./data/suspensionData.json", JSON.stringify(suspensions, null, 2), function (err) {
                    if (err) return console.log(err);
                });

            });
        } else {
            suspensions[suspensionId]["actualEndEpoch"] = time.getTime();

            //Write to file
            require('fs').writeFile("./data/suspensionData.json", JSON.stringify(suspensions, null, 2), function (err) {
                if (err) return console.log(err);
            });
        }
    },
    setDiscordRankAdmissions: function (user, rankName) {
        let roleIds = [idvariables.miscRoles.admissions]; //All ranks get admissions role
        switch (rankName) { //Add role ids to array
            case "Suspended":
                roleIds.push(idvariables.rankRoles.suspended);
                break;
            case "Awaiting Verification":
                robloxActions.getRobloxIdFromDiscordID(user.id, function (robloxID) {
                    robloxActions.changeRank(robloxID, "Labour Lottery ");
                });
            case "Labour Lottery ":
                roleIds.push(idvariables.rankRoles.labourLottery);
                break;
            case "Apprentice Inspector":
                roleIds.push(idvariables.rankRoles.apprentice, idvariables.miscRoles.boothOp);
                break;
            case "Junior Inspector":
                roleIds.push(idvariables.rankRoles.junior, idvariables.miscRoles.boothOp);
                break;
            case "Inspector":
                roleIds.push(idvariables.rankRoles.inspector, idvariables.miscRoles.boothOp);
                break;
            case "Senior Inspector":
                roleIds.push(idvariables.rankRoles.senior, idvariables.miscRoles.boothOp, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            case "Head Inspector":
                roleIds.push(idvariables.rankRoles.head, idvariables.miscRoles.boothOp, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            case "Supervisor":
                roleIds.push(idvariables.rankRoles.supervisor, idvariables.miscRoles.serverMod, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            case "Staff Supervisor":
                roleIds.push(idvariables.rankRoles.staffsupervisor, idvariables.miscRoles.serverMod, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            case "Chief Inspector":
                roleIds.push(idvariables.rankRoles.chief, idvariables.miscRoles.serverMod, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            default:
                return false;
        }
        let roles = [];
        for (let i = 0; i < roleIds.length; i++) { // Add role objects to new array
            roles.push(client.guilds.get(idvariables.serverId).roles.get(roleIds[i]));
        }
        user.setRoles(roles);
        return true;


    }
};