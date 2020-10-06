var roleSmuggler = {

    /** @param {Creep} creep
     * **/
    run: function(creep, say) {
        creep.say('💰 ' + creep.memory.score);
        if(creep.carry.energy < creep.carryCapacity)
        {
            creep.pickupNearbyEnergy();
        }
	    if(creep.carry.energy < creep.carryCapacity && creep.memory.harvesting === true) {
            if (creep.room.name !== creep.memory.home.roomName)
            {
                let errcode = creep.moveToAndHarvestBestRoomSource({visualizePathStyle: {stroke: '#A9A9A9'}});
            }
            else
            {
                let errcode = creep.moveToAndHarvestBestWorldSource({visualizePathStyle: {stroke: '#A9A9A9'}});
            }
        }
        else {
	        if (creep.carry.energy < 10) {
                creep.memory.harvesting = true;
            } else {
	            creep.memory.harvesting = false;
            }
            if (creep.room.name === creep.memory.home.roomName)
            {
                let formerEnergy = creep.carry.energy;
                let errcode = creep.dumpEnergyInHighestPriority({visualizePathStyle: {stroke: '#000000'}});
                if (errcode === 0) {
                    let source = Game.getObjectById(creep.memory.targetSource);
                    Memory.mines[creep.memory.targetSource] = source.pos;
                    creep.memory.score += formerEnergy;
                }
            } else {
    	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if(targets.length > 0) {
                    var sortedTargets1 = _.sortBy(targets, t => creep.pos.getRangeTo(t));
                    var sortedTargets2 = _.sortBy(sortedTargets1, t => (1.0 - t.progress/t.progressTotal));
                    if(creep.build(sortedTargets2[0]) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(sortedTargets2[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    } else {

                    }
                } else {
                    let homePos = new RoomPosition(creep.memory.home.x, creep.memory.home.y, creep.memory.home.roomName);
    	            creep.moveTo(homePos);
                }
            }
        }
	}
};

module.exports = roleSmuggler;