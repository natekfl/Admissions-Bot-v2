const config =  require('../config/config.json');
const Roblox  = require('roblox-js');

Roblox.login(config.robloxuser, config.robloxpass)
    .then(function () {
        console.log('Logged in to roblox account')
    }).catch(function (err) {
    console.error(err.stack);
});

module.exports = {
    changeRank: function (robloxId, roleName) {
        Roblox.setRank({group: 3052496, target: robloxId, name: roleName});
    }
}