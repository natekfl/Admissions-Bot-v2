// Main variables
const config = require('./config/config.json');
const Discord = require('discord.js');
const idvariables = require('./config/idvariables.json');

//Set up client
const client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    // Create data files
    const fs = require('fs');
    const dir = `${__dirname}/data`;
    !fs.existsSync(dir) && fs.mkdirSync(dir);
    const dataFiles = ['awaitingProof.json', 'citationData.json', 'aTestData.json', 'suspensionData.json', 'approvalData.json', 'userData.json']
    for (let f in dataFiles) {
        fs.writeFile(`${dir}/${dataFiles[f]}`, '{}', { flag: 'wx' }, function (err) {
            if (!err) {
                console.log(`Added data file ${dataFiles[f]}`);
            }
            if (parseInt(f) === dataFiles.length - 1) initialize();
        });
    }

    function initialize() {
        const globalFuncs = require('./lib/globalFuncs.js');

        // Register handlers
        client.on("message", message => (message.channel.type === "dm") ? require('./lib/handlers/handleDm.js')(message) : require('./lib/handlers/handleMessage.js')(message));
        client.on("guildMemberAdd", member => require('./lib/handlers/handleJoin.js')(member));
        client.on("messageReactionRemove", (reaction, user) => {
            if (reaction.message.channel.id === idvariables.channels.trialreportchannel && reaction.emoji.toString() === "❌" && reaction.users.has(client.user.id) && user.id !== client.user.id) {
                require('./lib/handlers/handleTrialReport.js').retryGroupPromote(reaction.message);
            }
        });


        //Set up unsuspend timers
        let suspensions = require('./data/suspensionData.json');
        let time = (new Date()).getTime();
        for (let suspensionId in suspensions) {
            const suspension = suspensions[suspensionId];
            if (suspension.actualEndEpoch === null) {
                setTimeout(function () {
                    globalFuncs.endSuspension(suspensionId)
                }, (suspension.scheduledEndEpoch - time));
            }
        }

        //Set up approval timeout
        let approvedData = require("./data/approvalData.json");
        for (let approvedId in approvedData) {
            if (approvedData[approvedId].open === true) {
                setTimeout(() => {
                    let approvedData = require("./data/approvalData.json");
                    if (approvedId in approvedData && approvedData[approvedId].open === true) {
                        approvedData[approvedId].open = false;
                        require('fs').writeFile("./data/approvalData.json", JSON.stringify(approvedData, null, 2), function (err) {
                            if (err) return console.log(err);
                        });
                    }
                }, ((approvedData[approvedId].time + (2 * (60*60*24*7))) - time));
            }
        }
    }
});


client.login(config.token);

module.exports = {
    client: client
};