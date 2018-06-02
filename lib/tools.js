const idvariables = require('../config/idvariables.json');

module.exports = {
    getPermLevel: function (member) {
        let permLevel = 0;
        let currentLevelCycle = 1;
        for (let role in idvariables.roles) {
            if (member.roles.get(idvariables.roles[role])) {
                permLevel = Number(currentLevelCycle);
            }
            currentLevelCycle++;
        }
        return permLevel;
    }
}