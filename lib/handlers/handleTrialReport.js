const robloxActions = require('../robloxActions.js');
const globalFuncs = require('../globalFuncs.js');
const tools = require('../tools.js');
const idvariables = require('../../config/idvariables.json');
const genId = () => { return Math.random().toString(36).substr(2, 9) };


module.exports = {
    processNewReport: function (report) {
        let lines = report.content.split("\n");
        if (lines.length >= 3) {
            let scores = [lines[1].substr((lines[1].indexOf("Grammar: ") + "Grammar: ".length), 2), lines[1].substr((lines[1].indexOf("Handbook: ") + "Handbook: ".length), 2), lines[1].substr((lines[1].indexOf("Booth: ") + "Booth: ".length), 2)]; //Parses out score numbers
            for (let i = 0; i < scores.length; i++) { //Convert scores from string to int
                if (!isNaN(parseInt(scores[i]))) {
                    scores[i] = parseInt(scores[i]);
                } else {
                    reportError(report); //If it can't be converted to int
                    return false; //End function
                }
            } //Scores array now contains ints of [grammar, handbook, booth]

            let enteredTotal = parseInt(lines[2].substr(9, 2));
            if (enteredTotal !== scores.reduce(function (total, currentValue) { return total + currentValue })) {
                reportError(report, "Total is not equal to sum of scores.");
                return false; //End function
            }

            let outcome = ((lines[3].substr(9, 5) === "Fail") ? false : ((lines[3].substr(9, 5) === "Pass") ? true : null)); //Parses to true, false, or null
            if (outcome == null) {
                reportError(report, "Outcome is not defined.");
                return false; //End function
            }

            let subject = report.mentions.members.first();
            if (!subject) {
                reportError(report, "Subject is not tagged.");
                return false; //End function
            }

            if (tools.getPermLevel(subject) !== 2) {
                reportError(report, "Subject is not a Labour Lottery.");
                return false; //End function
            }

            let usersData = require("../../data/userData.json");
            let subjectUserdata = (subject.id in usersData) ? usersData[subject.id] : {};
            if (!("aTestsRecieved" in subjectUserdata)) subjectUserdata["aTestsRecieved"] = {};
            let approvalData = require("../../data/approvalData.json");
            let approvalId = false;
            if ("approvalsRecieved" in subjectUserdata) {
                for (let iApprovalId in subjectUserdata["approvalsRecieved"]) {
                    if (approvalData[iApprovalId].open === true) {
                        approvalId = iApprovalId;
                    }
                }
            }
            if (!approvalId) {
                reportError(report, "Subject is not approved.");
                return false; //End function
            }

            let subjectFailCount = 0;
            for (let iAtestId in subjectUserdata["aTestsRecieved"]) {
                if (subjectUserdata["aTestsRecieved"][iAtestId].outcome === false) {
                    subjectFailCount++;
                }
            }
            if (subjectFailCount >= 2) {
                reportError(report, `Subject has failed ${subjectFailCount} Apprentice Tests`);
                return false; //End function
            }

            let comments = lines[4].split('Comments: ')[1]


            //Everything is correct
            let aTestData = require('../../data/aTestData.json')
            const time = (new Date());

            const testId = genId();
            const testJSON = {
                userTested: subject.id,
                testedBy: report.member.id,
                time: time.getTime(),
                outcome: outcome,
                grammar: scores[0],
                handbook: scores[1],
                booth: scores[2],
                comments: comments,
                approval: approvalId
            }

            aTestData[testId] = testJSON;

            let testerUserData = (report.member.id in usersData) ? usersData[report.member.id] : {};
            if (!("aTestsGiven" in testerUserData)) testerUserData["aTestsGiven"] = {};
            let trainerUserData = usersData[approvalData[approvalId].approvedBy]
            if (!("approvedTests" in trainerUserData)) trainerUserData["approvedTests"] = {};
            subjectUserdata["aTestsRecieved"][testId] = true;
            testerUserData['aTestsGiven'][testId] = true;
            testerUserData['approvedTests'][testId] = true;

            usersData[subject.id] = subjectUserdata;
            usersData[report.member.id] = testerUserData;
            usersData[approvalData[approvalId].approvedBy] = testerUserData;
            approvalData[approvalId].open = false;

            require('fs').writeFile("./data/aTestData.json", JSON.stringify(aTestData, null, 2), function (err) {
                if (err) return console.log(err);
            });
            require('fs').writeFile("./data/userData.json", JSON.stringify(usersData, null, 2), function (err) {
                if (err) return console.log(err);
            });
            require('fs').writeFile("./data/approvalData.json", JSON.stringify(approvalData, null, 2), function (err) {
                if (err) return console.log(err);
            });

            report.react("⏺"); //:record_button:

            let embed = {
                title: "Apprentice Test " + testId,
                color: 5175215,
                fields: [
                    {
                        name: "User Tested",
                        value: "<@" + testJSON.userTested + ">"
                    },
                    {
                        name: "Tested by",
                        value: "<@" + testJSON.testedBy + ">"
                    },
                    {
                        name: "Date/Time",
                        value: (new Date(testJSON.time)).toString()
                    },
                    {
                        name: "Outcome",
                        value: (testJSON.outcome) ? 'Pass' : 'Fail'
                    },
                    {
                        name: "Grammar Score",
                        value: testJSON.grammar,
                        inline: true
                    },
                    {
                        name: "Handbook Score",
                        value: testJSON.handbook,
                        inline: true
                    },
                    {
                        name: "Booth Score",
                        value: testJSON.booth,
                        inline: true
                    },
                    {
                        name: "Tester comments",
                        value: testJSON.comments,
                    },
                    {
                        name: "Approval ID",
                        value: testJSON.approval,
                    }
                ]
            };


            let messageToDM = (`${report.member.displayName} has submitted your Apprentice Test report. The results are below for your reference.`);

            if (outcome === true) {
                globalFuncs.setDiscordRankAdmissions(subject, "Apprentice Inspector");
                report.react("✔"); //:heavy_check_mark:

                robloxActions.getRobloxIdFromDiscordID(subject.id, function (robloxId) {
                    if (robloxId) {
                        robloxActions.changeRank(robloxId, "Apprentice Inspector");
                        report.react("✅"); //:white_check_mark:
                        messageToDM += "You have passed your Apprentice Test, and your ROBLOX and Discord ranks have been updated accordingly.";
                        sendResultDM();
                    } else {
                        report.react("❌"); //:x:
                        messageToDM += "You have passed your Apprentice Test, and your Discord rank was updated accordingly. However, we could not change your ROBLOX group rank. Please contact your trainer for assistance.";
                        sendResultDM();
                    }
                });
            } else {
                 if (subjectFailCount < 2) {
                    messageToDM += "You have failed your Apprentice Test. You cannot get tested again for 12 hours. Use this time to study what you missed.";
                    sendResultDM();
                } else {
                    messageToDM += "You have failed your Apprentice Test. As this is your second failure, you cannot be tested again.";
                    report.channel.guild.channels.get(idvariables.channels.hicomchannel).send(`Please exile ${subject}`)
                    sendResultDM();
                }
            }

            function sendResultDM() {
                subject.createDM()
                    .then(DMChannel => {
                        DMChannel.send(messageToDM, {embed:embed});
                    });
            }
        }
    },

    retryGroupPromote: function (report) {
        let subject = report.mentions.members.first();
        if (subject) {
            report.reactions.forEach(reaction => { //Remove all :x: reactions
                if (reaction.emoji.toString() === "❌") {
                    reaction.remove();
                }
            });
            globalFuncs.setDiscordRankAdmissions(subject, "Apprentice Inspector");
            robloxActions.getRobloxIdFromDiscordID(subject.id, function (robloxId) {
                if (robloxId) {
                    robloxActions.changeRank(robloxId, "Apprentice Inspector");
                    subject.createDM()
                        .then(DMchannel => DMchannel.send("Your ROBLOX group rank has been changed to Apprentice Inspector"));
                    report.react("✅"); //:white_check_mark:
                } else {
                    report.react("❌"); //:x:
                }
            });
        }
    }
};

function reportError(report, error) {
    report.reply(`Your report has errors in it. ${(error) ? ("(" + error + ")") : "Please check that you are using the correct template."} *Your report will be deleted in 30 seconds.*`)
        .then(sentMessage => {
            setTimeout(function () {
                sentMessage.delete();
                report.delete();
            }, 30000);
        });
}