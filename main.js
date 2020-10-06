let creepManager = require('creep-manager');
let structureManager = require('manager.structure');
let buildManager = require('manager.build');

module.exports.loop = function () {
    if (Math.round(Game.time) % 100 === 0)
    {
        console.log('very slow tick!');
        buildManager.updateSlower();
        structureManager.updateSlower();
        creepManager.updateSlower();
    }
    if (Math.round(Game.time) % 10 === 0)
    {
        console.log('slow tick!');
        creepManager.updateSlow();
        buildManager.updateSlow();
        structureManager.updateSlow();
    }
    creepManager.update();
    structureManager.update();
}