let roleHarvester = require('role.harvester');
let roleUpgrader = require('role.upgrader');
let roleBuilder = require('role.builder');
let roleScout = require('role.scout');
let roleSmuggler = require('role.smuggler');
let roleMule = require('role.mule');

let PART_ENERGY = {
    WORK: 100,
    MOVE: 50,
    CARRY: 50,
    ATTACK: 80,
    RANGED_ATTACK: 150,
    HEAL: 250,
    TOUGH: 10,
    CLAIM: 600
};

class CreepCohort {
    
    /**
     * @param {String} name
     * */
    constructor (name, role, partsPriority) {
        this.name = name;
        this.role = role;
        this.partsPriority = partsPriority;
        this.speakCycles = 3;
    }

    //so this is actually similar to the knapsack problem!
    //https://en.wikipedia.org/wiki/Knapsack_problem
    //
    // i'll try my best to use an appoximation algorithm.
    //
    // since spawn attempts are made in updateSlow, we can afford to take a little more time
    // trying to optimize configurations.
    decidePartsConfig(room) {
        let energyTarget;
        if (room.find(FIND_MY_CREEPS).length === 0)
            energyTarget = room.energyAvailable - PART_ENERGY.MOVE - PART_ENERGY.CARRY - PART_ENERGY.WORK;
        else
            energyTarget = room.energyCapacityAvailable - PART_ENERGY.MOVE - PART_ENERGY.CARRY - PART_ENERGY.WORK;
        let partsArray = ['work', 'carry', 'move'];
        //let energyTarget = spawn.room.energyAvailable;
        // if (spawn.room.find(FIND_MY_CREEPS).length === 0)
        //     energyTarget = spawn.room.energyAvailable;
        let partsEnergyPriorityTarget = [];
        for(let partType in this.partsPriority)
        {
            partsEnergyPriorityTarget.push({key: partType, value: (this.partsPriority[partType] * PART_ENERGY[partType])})
        }
        let combinedWeighted = Object.keys(partsEnergyPriorityTarget).reduce(function (previous, key) {
            return previous + partsEnergyPriorityTarget[key].value;
        }, 0);
        //console.log('combined weighted: ' + combinedWeighted + ' from: ' + partsEnergyPriorityTarget);
        let calculatedPartCounts = [];
        for(let partType in Object.keys(partsEnergyPriorityTarget))
        {
            var val = (energyTarget / combinedWeighted);
            val *= partsEnergyPriorityTarget[partType].value;
            val = val / PART_ENERGY[partsEnergyPriorityTarget[partType].key];
            val = Math.floor(val);
            calculatedPartCounts.push({key: partsEnergyPriorityTarget[partType].key, value: val});
        }
        for(let partType in calculatedPartCounts)
        {
            for (var i =0; i< (calculatedPartCounts[partType].value); i++) {
                partsArray.push(calculatedPartCounts[partType].key.toLowerCase());
            }
        }
        return partsArray;
    }
    
    calculateCost(partArray) {
        console.log('part array: ' + partArray);
        return partArray.reduce(function (sum, key) {
            return sum + PART_ENERGY[key.toUpperCase()];
        }, 0);
    }

    trySpawn(spawn) {
        let roomCohort = _.filter(Game.creeps, (creep) => creep.room === spawn.room && creep.memory.role === this.name);
        let maxCount = this.MaxRoomCount(spawn.room);
        if (roomCohort.length >= maxCount) {
            return false;
        } else {
            console.log('Will attempt spawn for creep type: ' + this.name + ', current count less than cap: [' + maxCount + ']');
        }
        let newName = this.name + Game.time;
        let parts = this.decidePartsConfig(spawn.room);
        let cost = this.calculateCost(parts);
        let errcode = spawn.spawnCreep(parts, newName, {memory: {role: this.name, home: spawn.pos, score: -cost}});

        if ( errcode === 0)
        {
            console.log('Spawning new ' + this.name + ': ' + newName);
            return true;
        }
        else
        {
            console.log(errcode + ': Failed to spawn new '+this.name+'!')
            return false;
        }
    }

    update() {
        for (var creepName in Game.creeps)
        {
            let creep = Game.creeps[creepName];
            if (creep.memory.role === this.name)
                this.role.run(Game.creeps[creepName], this.speakCycles >= 0);
            this.speakCycles -= 1;
        }
    }

    updateSlow() {
        this.speakCycles = 3;
    }

    /** @param {Room} room **/
    MaxRoomCount(room) {
        return 2;
    }
}

class HarvesterCohort extends CreepCohort {
    /** @param {Room} room **/
    MaxRoomCount(room) {
        // TODO: actually need less with more energy capacity (mine out the nodes way faster, b/c bigger harvesters made. check existing cohort for
        // # of 'work' parts?)
        let sources = room.find(FIND_SOURCES);
        let maxSourceEnergy = sources.reduce(function (previous, src) {
                return previous + src.energyCapacity;
            }, 0);
        let partsConfig = this.decidePartsConfig(room);
        let workPartsCount = _.filter(partsConfig, (cfg) => cfg === 'work').length;
        return Math.min(8, Math.floor(maxSourceEnergy / workPartsCount / 300));
    }
}

class ScoutCohort extends CreepCohort {
    /** @param {Room} room **/
    MaxRoomCount(room) {
        let harvesterCount = _.filter(Game.creeps, (creep) => creep.room === room && creep.memory.role === 'harvester').length;
        if (harvesterCount <= 2)
        {
            return 0;
        }
        let rooms = Game.map.describeExits(room.name);
        let exitCount = 0;
        for(let dir in rooms)
        {
            exitCount += 1;
        }
        return exitCount;
    }
    
    trySpawn(spawn) {
        let roomCohort = _.filter(Game.creeps, (creep) => creep.memory.home.roomName === spawn.pos.roomName && creep.memory.role === this.name);
        let maxCount = this.MaxRoomCount(spawn.room);
        if (roomCohort.length >= maxCount) {
            return false;
        } else {
            console.log('Will attempt spawn for creep type: ' + this.name + ', current count less than cap: [' + maxCount + ']');
        }
        let newName = this.name + Game.time;
        let parts = [CLAIM, MOVE, MOVE];
        let errcode = spawn.spawnCreep(parts, newName, {memory: {role: this.name, home: spawn.pos, score: 0}});

        if ( errcode === 0)
        {
            console.log('Spawning new ' + this.name + ': ' + newName);
            return true;
        }
        else
        {
            console.log(errcode + ': Failed to spawn new '+this.name+'!')
            return false;
        }
    }
}

class SmugglerCohort extends CreepCohort {
    trySpawn(spawn) {
        let smugglerCount = _.filter(Game.creeps, (creep) => creep.memory.role === 'smuggler').length;
        let scoutCount = _.filter(Game.creeps, (creep) => creep.memory.role === 'scout').length;
        let maxCount = scoutCount * 4;
        if (smugglerCount >= maxCount) {
            return false;
        } else {
            console.log('Will attempt spawn for creep type: ' + this.name + ', current count less than cap: [' + maxCount + ']');
        }

        let newName = this.name + Game.time;
        let parts = [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
        let cost = this.calculateCost(parts);
        let errcode = spawn.spawnCreep(parts, newName, {memory: {role: this.name, home: spawn.pos, score: -cost}});

        if ( errcode === 0)
        {
            console.log('Spawning new ' + this.name + ': ' + newName);
            return true;
        }
        else
        {
            console.log(errcode + ': Failed to spawn new '+this.name+'!')
            return false;
        }
    }
}

class UpgraderCohort extends CreepCohort {
    /** @param {Room} room **/
    MaxRoomCount(room) {
        let harvesterCount = _.filter(Game.creeps, (creep) => creep.room === room && creep.memory.role === 'harvester').length;
        if (harvesterCount <= 2)
        {
            return 0;
        }
        else
        {
            let containers = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE);
                }
            });
            return containers.length + 1;
        }
    }
}

class BuilderCohort extends CreepCohort {
    /** @param {Room} room **/
    MaxRoomCount(room) {
        let harvesterCount = _.filter(Game.creeps, (creep) => creep.room === room && creep.memory.role === 'harvester').length;
        if (harvesterCount <= 1)
        {
            console.log('returning harvester count: ' + harvesterCount);
            return harvesterCount;
        }
        else
        {
            let xtionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
            let totalXtionTime = xtionSites.reduce(function (previous, site) {
                return previous + (site.progressTotal - site.progress);
            }, 0);
            return Math.min(harvesterCount * 2 / 3, Math.round(1 + totalXtionTime/6000));
        }
    }
}

class MuleCohort extends CreepCohort {
    /** @param {Room} room **/
    MaxRoomCount(room) {
        let harvesterCount = _.filter(Game.creeps, (creep) => creep.room === room && creep.memory.role === 'harvester').length;
        if (harvesterCount <= 1)
        {
            console.log('returning harvester count: ' + harvesterCount);
            return harvesterCount;
        }
        else
        {
            return harvesterCount / 2;
        }
    }
}

let BASIC_PRIORITY = {
    WORK: 0.33, CARRY: 0.33, MOVE:0.33
};

let MOVE_PRIORITY = {
    WORK: 0.25, CARRY: 0.25, MOVE:0.5
};

let WORK_PRIORITY = {
    WORK: 0.75, CARRY: 0.0, MOVE:0.25
};

let CARRY_PRIORITY = {
    WORK: 0.0, CARRY: 0.66, MOVE:0.33
};

let cohorts = {
        harvester: new HarvesterCohort('harvester', roleHarvester, BASIC_PRIORITY),
        upgrader: new UpgraderCohort('upgrader', roleUpgrader, WORK_PRIORITY),
        builder: new BuilderCohort('builder', roleBuilder, WORK_PRIORITY),
        smuggler: new SmugglerCohort('smuggler', roleSmuggler, BASIC_PRIORITY),
        scout: new ScoutCohort('scout', roleScout, MOVE_PRIORITY),
        mule: new MuleCohort('mule', roleMule, CARRY_PRIORITY)
};

class creepManager {
    constructor() {
        
        Creep.prototype.pickupNearbyEnergy = function () {
            let energy = this.pos.findInRange(
                FIND_DROPPED_RESOURCES,
                1
            );
            for (let i = 0; i<energy.length; i++) {
                var amt = energy[i].amount;
                if (amt > 0) {
                    var errcode = this.pickup(energy[i]);
                    console.log('CODE: ' + errcode + ', picked up energy: ' + amt);
                }
            }
            let tombEnergy = this.pos.findInRange(
                FIND_TOMBSTONES,
                1
            );
            for (let i = 0; i<tombEnergy.length; i++) {
                var amt = tombEnergy[i].store[RESOURCE_ENERGY];
                if (amt > 0) {
                    var errcode = this.withdraw(tombEnergy[i], RESOURCE_ENERGY);
                    console.log('CODE: ' + errcode + ', picked up energy: ' + amt);
                }
            }
            return 66;
        }
        Creep.prototype.moveToAndHarvestBestRoomSource = function (pathStyle) {
            let sources = this.room.find(FIND_SOURCES_ACTIVE);
            let closest = this.pos.findClosestByPath(sources);
            this.harvest(closest);
            pathStyle.reusePath = 15;
            return this.moveTo(closest, pathStyle);
        }

        Creep.prototype.moveToAndHarvestBestWorldSource = function (pathStyle) {
            let targetSource = this.memory.targetSource;
            if (targetSource !== undefined && targetSource !== null)
            {
                let source = Game.getObjectById(targetSource);
                let errcode = this.harvest(source);
                if (errcode === ERR_NOT_IN_RANGE) {
                    return this.moveTo(source, pathStyle);
                }
                return errcode;
            }
            else
            {
                let worldRooms = _.filter(Game.rooms, (room) => room.controller.owner === undefined);
                if (worldRooms.length > 0)
                {
                    let sources = worldRooms.concat.apply([], worldRooms.map((room) => room.find(FIND_SOURCES_ACTIVE)));
                    var sourcesSorted = _.sortBy(sources, s => this.pos.getRangeTo(s) / (s.energy/s.energyCapacity));
                    let closest = sources[0];
                    if (closest === undefined) {
                        return 66;
                    } else {
                        this.memory.targetSource = closest.id;
                        return this.moveTo(closest, pathStyle);
                    }
                }
                return 66;
            }
        }

        Creep.prototype.moveToOrWaitForClosestEnergy = function (pathStyle) {
            let containers = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER
                        || structure.structureType === STRUCTURE_STORAGE
                        || structure.structureType === STRUCTURE_LINK)
                        && structure.store[RESOURCE_ENERGY] > 0;
                }
            });
            let closest = this.pos.findClosestByPath(containers);

            if (closest === null || closest === undefined) {
                return ERR_NO_PATH;
            }
            if(closest.store[RESOURCE_ENERGY] > 0) {
                let errCode = this.withdraw(closest, RESOURCE_ENERGY);
                if (errCode === ERR_NOT_IN_RANGE) {
                    return this.moveTo(closest, pathStyle);
                }
            }
            return 66;
        }

        Creep.prototype.takeEnergyFromDonors = function (pathStyle) {
            let donors = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK)
                        && structure.store[RESOURCE_ENERGY] >= this.store.getFreeCapacity(RESOURCE_ENERGY);
                }
            });
            
            var creeps = this.room.find(FIND_MY_CREEPS, {
                filter: (creep) => {
                    return (creep.memory.role === 'harvester' || creep.memory.role === 'smuggler')
                        && (creep.carry.energy > 0.5 * creep.store.getCapacity(RESOURCE_ENERGY));
                }
            });
            donors = donors.concat(creeps);

            let closest = this.pos.findClosestByPath(donors);

            if (closest === null || closest === undefined) {
                return ERR_NO_PATH;
            }
            if(closest.store[RESOURCE_ENERGY] > 0) {
                let errCode = this.withdraw(closest, RESOURCE_ENERGY);
                if (errCode === ERR_NOT_IN_RANGE) {
                    return this.moveTo(closest, pathStyle);
                } else if (errCode == ERR_INVALID_TARGET) {
                    let errCode2 = closest.transfer(this, RESOURCE_ENERGY);
                    if (errCode2 === ERR_NOT_IN_RANGE) {
                        return this.moveTo(closest, pathStyle);
                    }
                }
            }
            return 66;
        }

        Creep.prototype.moveToOrWaitForClosestEnergy = function (pathStyle) {
            let containers = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER
                        || structure.structureType === STRUCTURE_STORAGE
                        || structure.structureType === STRUCTURE_LINK)
                        && structure.store[RESOURCE_ENERGY] > 0;
                }
            });
            let closest = this.pos.findClosestByPath(containers);

            if (closest === null || closest === undefined) {
                return ERR_NO_PATH;
            }
            if(closest.store[RESOURCE_ENERGY] > 0) {
                let errCode = this.withdraw(closest, RESOURCE_ENERGY);
                if (errCode === ERR_NOT_IN_RANGE) {
                    return this.moveTo(closest, pathStyle);
                }
            }
            return 66;
        }

        Creep.prototype.moveToAndGetBestEnergy = function (pathStyle) {
            let sources = this.room.find(FIND_SOURCES_ACTIVE);
            let containers = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER 
                        || structure.structureType === STRUCTURE_STORAGE
                        || structure.structureType === STRUCTURE_LINK)
                        && structure.store[RESOURCE_ENERGY] > 0;
                }
            });
            let dropped = this.room.find(FIND_DROPPED_RESOURCES, {
                filter: (drop) => {
                    return (drop.energy > 40);
                }
            });
            let combined = sources.concat(containers).concat(dropped);
            let closest = this.pos.findClosestByPath(combined);

            if (closest === null || closest === undefined) {
                return ERR_NO_PATH;
            }
            if (closest.energy === undefined || closest.energy === null)
            {
                if(closest.store[RESOURCE_ENERGY] > 0) {
                    let errCode = this.withdraw(closest, RESOURCE_ENERGY);
                    if (errCode === ERR_NOT_IN_RANGE) {
                        pathStyle.reusePath = 15;
                        return this.moveTo(closest, pathStyle);
                    }
                }
                return 66;
            }
            else if (closest.storeCapacity === undefined || closest.storeCapacity === null)
            {
                if( closest.energy > 0) {
                    //if (closest.)
                    let errCode = this.harvest(closest);
                    if (errCode === ERR_INVALID_ARGS || errCode === ERR_INVALID_TARGET) {
                        errCode = this.pickup(closest);
                    }
                    pathStyle.reusePath = 15;
                    return this.moveTo(closest, pathStyle);
                }
                return 66;
            }

            return 404;
        }

        Creep.prototype.dumpEnergyInReceiver = function (pathStyle) {
            var targets = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_EXTENSION
                            || structure.structureType === STRUCTURE_SPAWN)
                            && (structure.energy < structure.energyCapacity);
                    }
            });
            if (this.room.energyAvailable / this.room.energyCapacityAvailable > 0.95)
            {
                var containers = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_CONTAINER 
                            || structure.structureType === STRUCTURE_STORAGE
                            || structure.structureType === STRUCTURE_TOWER)
                            && (structure.store.getFreeCapacity(RESOURCE_ENERGY) >= this.store[RESOURCE_ENERGY]);
                    }
                });
                targets = targets.concat(containers);
            }
            var creeps = this.room.find(FIND_MY_CREEPS, {
                filter: (creep) => {
                    return (creep.memory.role === 'upgrader' || creep.memory.role === 'builder')
                        && (creep.store.getFreeCapacity(RESOURCE_ENERGY) >= 50);
                }
            });
            targets = targets.concat(creeps);

            if(targets.length > 0) {
                var sortedTargets = _.sortBy(targets, t => (this.pos.getRangeTo(t)));
                let errcode = this.transfer(sortedTargets[0], RESOURCE_ENERGY);
                if(errcode == ERR_NOT_IN_RANGE) {
                    //console.log('targets: ' + sortedTargets);
                    this.moveTo(sortedTargets[0], pathStyle);
                } else if (errcode === 0) {
                    //this.memory.score += Math.min(capacity, energyToXfer);
                }
                return errcode;
            } else {
                let errcode = this.upgradeController(this.room.controller);
                if(errcode == ERR_NOT_IN_RANGE) { 
                    this.moveTo(this.room.controller, pathStyle);
                } else if (errcode === 0) {
                    //this.memory.score += energyRemaining;
                }
                return errcode;
            }
        }
        
        Creep.prototype.dumpEnergyInHighestPriority = function (pathStyle, allowTransfer) {
            var targets = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_EXTENSION
                            || structure.structureType === STRUCTURE_SPAWN)
                            && (structure.energy < structure.energyCapacity);
                    }
            });
            if (this.room.energyAvailable / this.room.energyCapacityAvailable > 0.95)
            {
                var containers = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType === STRUCTURE_CONTAINER 
                            || structure.structureType === STRUCTURE_STORAGE
                            || structure.structureType === STRUCTURE_TOWER
                            || structure.structureType === STRUCTURE_LINK)
                            && (structure.store.getFreeCapacity(RESOURCE_ENERGY) >= this.store[RESOURCE_ENERGY]);
                    }
                });
                targets = targets.concat(containers);
            }
            if (allowTransfer)
            {
                var creeps = this.room.find(FIND_MY_CREEPS, {
                    filter: (creep) => {
                        return (creep.memory.role === 'upgrader' || creep.memory.role === 'builder')
                            && (creep.store[RESOURCE_ENERGY] < 0.5 * creep.store.getCapacity());
                    }
                });
                targets = targets.concat(creeps);
            }
            if(targets.length > 0) {
                var sortedTargets = _.sortBy(targets, t => (this.pos.getRangeTo(t)));
                let errcode = this.transfer(sortedTargets[0], RESOURCE_ENERGY);
                if(errcode == ERR_NOT_IN_RANGE) {
                    //console.log('targets: ' + sortedTargets);
                    this.moveTo(sortedTargets[0], pathStyle);
                } else if (errcode === 0) {
                    //this.memory.score += Math.min(capacity, energyToXfer);
                }
                return errcode;
            } else {
                let errcode = this.upgradeController(this.room.controller);
                if(errcode == ERR_NOT_IN_RANGE) { 
                    this.moveTo(this.room.controller, pathStyle);
                } else if (errcode === 0) {
                    //this.memory.score += energyRemaining;
                }
                return errcode;
            }
        }
    }

    update() {

        for (var creepType in cohorts)
        {
            cohorts[creepType].update();
        }

        if(Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                {align: 'left', opacity: 0.8});
        }
    }

    updateSlow() {
        var spawned = false;
        for (var key in cohorts)
        {
            cohorts[key].updateSlow();
            spawned = cohorts[key].trySpawn(Game.spawns['Spawn1']);
            if (spawned === true)
                return;
        }
    }
    
    updateSlower() {
        for (let creepMemory in Memory.creeps) {
            let match = false;
            for (let creepName in Game.creeps) {
                if (creepName === creepMemory) {
                    match = true;
                }
            }
            if (match === false)
                Memory.creeps[creepMemory] = undefined;
        }
    }
}

module.exports = new creepManager();