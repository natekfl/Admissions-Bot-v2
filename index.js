// Main variables
const config =  require('./config/config.json');
const globalFuncs =  require('./lib/globalFuncs.js');
const Discord  = require('discord.js');

//Set up client
const client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Register handlers
client.on("message", message => require('./lib/handlers/handleMessage.js')(message));


//Set up unsuspend timers



client.login(config.token);

module.exports = {
    client: client
};