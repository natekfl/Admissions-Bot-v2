const robloxActions = require("./robloxActions");
const client = require('../index.js').client;
const idvariables =  require('../config/idvariables.json');

module.exports = {
    suspendUser: function (userToSuspend, length, suspendor, reason, callback) {
        let rank = undefined;
        robloxActions.getRobloxIdFromDiscordID(userToSuspend.id, function (robloxId) {
            if (robloxId) {
					//Saves and changes roblox rank
					robloxActions.getRankName(robloxId, function(rankName) {
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
                module.exports.setDiscordRankAdmissions(userToSuspend, "Suspended");
                client.channels.get(idvariables.channels.suspendlogchannel).send(`Name of suspended: ${userToSuspend}\nRank of suspended: ${rank}\nName of suspendor: ${suspendor}\nReason: ${reason}\nTime of suspension: ${length} hours`)
                    .then(sentMessage => {
                    //sets unsuspend time
                    setTimeout(function() {
                        module.exports.unsuspendUser(userToSuspend);
                    }, (length * 3600000));

                    //writes to file
                    let suspensions = require("../data/suspensions.json");
                    suspensions[userToSuspend.id] = {
                        endEpoch: ((new Date()).getTime() + (length * 3600000)),
                        rank: rank,
                        message: sentMessage.id
                    };
                    require('fs').writeFile("./data/suspensions.json", JSON.stringify(suspensions, null, 2), function (err) {
                        if (err) return console.log(err);
                    });
                });
            }
        });
    },
    unsuspendUser: function (user) {
        let suspensions = require("../data/suspensions.json");
		try {
			client.channels.get(idvariables.channels.suspendlogchannel).fetchMessage(suspensions[user.id].message) //Edit suspension log message
            .then(sentMessage => {
                sentMessage.edit(sentMessage.content += "\n\n*User has been unsuspended*")
            })
            .catch(() => {console.log("Unable to edit suspension message for " + user.displayName)});
		} catch (e) {
			console.log(e);
		}

        robloxActions.getRobloxIdFromDiscordID(user.id, function(robloxId) {
            //After fetching roblox info
            if (robloxId && suspensions[user.id].rank){
                robloxActions.changeRank(robloxId, suspensions[user.id].rank);
                module.exports.setDiscordRankAdmissions(user, suspensions[user.id].rank);
                user.createDM().then(dm => dm.send("Your suspension has been removed."));
            } else {
                user.createDM().then(dm => dm.send("Your suspension time is up, however there was an error when changing your group rank. Please contact a HICOM."));
            }

            delete suspensions[user.id];

            //Write to file
            require('fs').writeFile("./data/suspensions.json", JSON.stringify(suspensions, null, 2), function (err) {
                if (err) return console.log(err);
            });

        });
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
            case "Junior Supervisor": //Really Supervisor
                roleIds.push(idvariables.rankRoles.supervisor, idvariables.miscRoles.serverMod, idvariables.miscRoles.staff, idvariables.miscRoles.trainer);
                break;
            case "Supervisor": //Really Staff Supervisor
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