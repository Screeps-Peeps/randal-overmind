var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep, say) {
        if(creep.carry.energy < creep.carryCapacity)
        {
            creep.pickupNearbyEnergy();
        }
	    if(creep.memory.building && creep.carry.energy === 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.carry.energy === creep.carryCapacity) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
	    }

	    if(creep.memory.building) {
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            let formerEnergy = creep.store[RESOURCE_ENERGY];
            if(targets.length > 0) {
                var sortedTargets1 = _.sortBy(targets, t => creep.pos.getRangeTo(t));
                var sortedTargets2 = _.sortBy(sortedTargets1, t => (1.0 - t.progress/t.progressTotal));
                if(creep.build(sortedTargets2[0]) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sortedTargets2[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                let neutralToRepair = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: function(object){
                        return (object.structureType === STRUCTURE_ROAD
                                || object.structureType === STRUCTURE_CONTAINER
                                || object.structureType === STRUCTURE_STORAGE)
                            && (object.hits < object.hitsMax);
                    }
                });

                if (neutralToRepair){
                    creep.moveTo(neutralToRepair);
                    creep.repair(neutralToRepair);
                } else {
                    let flags = Game.flags;
                    let sortedFlags = _.sortBy(flags, f => creep.pos.getRangeTo(f));
                    creep.moveTo(sortedFlags[0]);
                }
            }
            let transferred = formerEnergy - creep.store[RESOURCE_ENERGY];
            creep.memory.score += transferred;
	    }
	    else {
	       // let flags = creep.room.find(FIND_FLAGS);
	       // let sortedFlags = _.sortBy(flags, f => creep.pos.getRangeTo(f));
	       // creep.moveTo(sortedFlags[0]);
            creep.moveToOrWaitForClosestEnergy({visualizePathStyle: {stroke: '#ffaa00'}});
	    }
	}
};

module.exports = roleBuilder;