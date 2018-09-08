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
    const dataFiles = ['awaitingProof.json', 'citations.json', 'failedTrials.json', 'suspensions.json', 'testApproved.json']
    for (let f in dataFiles) {
        require('fs').writeFile(`${dir}/${dataFiles[f]}`, '{}', { flag: 'wx' }, function (err) {
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
        let suspensions = require('./data/suspensions.json');
        let time = (new Date()).getTime();
        for (let userId in suspensions) {
            setTimeout(function () {
                let userToUnsuspend = client.guilds.get(idvariables.serverId).members.get(userId);
                if (userToUnsuspend) { globalFuncs.unsuspendUser(userToUnsuspend) } else {

                    delete suspensions[userId];
                    //Write to file
                    require('fs').writeFile("./data/suspensions.json", JSON.stringify(suspensions, null, 2), function (err) {
                        if (err) return console.log(err);
                    });
                }
            }, (suspensions[userId].endEpoch - time));
        }
    }
});


client.login(config.token);

module.exports = {
    client: client
};