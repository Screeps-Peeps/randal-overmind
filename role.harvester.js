var roleHarvester = {

    /** @param {Creep} creep
     * **/
    run: function(creep, say) {
        if (say)
        {
            creep.say('🔋 ' + creep.memory.score);
        }
        
        if(creep.carry.energy < creep.carryCapacity)
        {
            creep.pickupNearbyEnergy();
        }
	    if(creep.carry.energy < creep.carryCapacity && creep.memory.harvesting === true) {
            creep.moveToAndHarvestBestRoomSource({visualizePathStyle: {stroke: '#ffaa00'}});
        }
        else {
	        if (creep.carry.energy < 10) {
                creep.memory.harvesting = true;
            } else {
	            creep.memory.harvesting = false;
            }
            let formerEnergy = creep.carry.energy;
            let errcode = creep.dumpEnergyInHighestPriority({visualizePathStyle: {stroke: '#000000'}});
            if (errcode === 0)
            {
                creep.memory.score += creep.carry.energy;
            }
        }
	}
};

module.exports = roleHarvester;