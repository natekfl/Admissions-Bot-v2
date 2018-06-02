// Main variables
const config =  require('./config/config.json');
const Discord  = require('discord.js');
const idvariables =  require('./config/idvariables.json');

//Set up client
const client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    const globalFuncs =  require('./lib/globalFuncs.js');

    // Register handlers
    client.on("message", message => require('./lib/handlers/handleMessage.js')(message));


    //Set up unsuspend timers
    let suspensions = require('./data/suspensions.json');
    let time = (new Date()).getTime();
    for (let userId in suspensions) {
        setTimeout(function() {
            globalFuncs.unsuspendUser(client.guilds.get(idvariables.serverId).members.get(userId))
        }, (suspensions[userId][0] - time));
    }
});


client.login(config.token);

module.exports = {
    client: client
};