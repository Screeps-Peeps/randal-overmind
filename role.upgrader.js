var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep, say) {

        if(creep.memory.upgrading && creep.carry.energy === 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy >= 0.5 * creep.carryCapacity) {
	        creep.memory.upgrading = true;
	        creep.say('⚡ upgrade');
	    }

	    if(creep.memory.upgrading) {
	        creep.say('⚡ ' + creep.memory.score);
            let errcode = creep.upgradeController(creep.room.controller);
            if(errcode == ERR_NOT_IN_RANGE) { 
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#000000'}});
            } else if (errcode === 0) {
                let energyRemaining = _.sum(creep.carry);
                let workPower = creep.body.reduce(function (sum, part) {
                    return sum + (part.type === 'work' ? 1 : 0);
                }, 0);
                creep.memory.score += Math.min(energyRemaining, workPower);
            }
        }
        else {
            let errcode = creep.moveToOrWaitForClosestEnergy({visualizePathStyle: {stroke: '#ffaa00'}}, creep.room.flags);
            if (errcode == ERR_NO_PATH)
            {
                creep.moveTo(creep.room.controller.pos);
            }
        }
	}
};

module.exports = roleUpgrader;