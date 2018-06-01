// Main variables
const config =  require('./config.json');
const Discord  = require('discord.js');

//Set up client
const client = new Discord.Client();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Register handlers
client.on("message", message => require('./handleMessage.js')(message));


client.login(config.token);