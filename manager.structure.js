let structureTower = require('structure.tower');

class structureManager {
    constructor() {
    }

    update() {
        for (let roomName in Memory.rooms)
        {
            var linkGroup = [];
            for (let id in Memory.rooms[roomName].structures)
            {
                let obj = Game.getObjectById(id);
                let role = Memory.rooms[roomName].structures[id].role;
                if (role === 'tower')
                    structureTower.run(obj, Memory.rooms[roomName].structures[id]);
                else if (role === 'link')
                    linkGroup.push(obj);
            }
            if (linkGroup.length > 0)
            {
                var linkWithMostEnergy = linkGroup[0];
                var linkWithLeastEnergy = linkGroup[0];
                for (var i = 1; i<linkGroup.length; i++)
                {
                    if (linkGroup[i].store[RESOURCE_ENERGY] > linkWithMostEnergy.store[RESOURCE_ENERGY])
                    {
                        linkWithMostEnergy = linkGroup[i];
                    }
                    if (linkGroup[i].store[RESOURCE_ENERGY] < linkWithLeastEnergy.store[RESOURCE_ENERGY])
                    {
                        linkWithLeastEnergy = linkGroup[i];
                    }
                }
                let diff = linkWithMostEnergy.store[RESOURCE_ENERGY] - linkWithLeastEnergy.store[RESOURCE_ENERGY];
                linkWithMostEnergy.transferEnergy(linkWithLeastEnergy, diff / 2);
                //console.log('transfer from ' + linkWithMostEnergy + ' to ' + linkWithLeastEnergy + ' amt: ' + diff);
            }
        }
    }

    updateSlow() {
        for (let roomName in Memory.rooms)
        {
            if (Memory.rooms[roomName].structures === undefined)
                Memory.rooms[roomName].structures = {};
            if (Memory.rooms[roomName].links === undefined)
                Memory.rooms[roomName].links = {};
            
            
            let towers = Game.rooms[roomName].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_TOWER);
                }
            });
            for (let tower in towers)
            {
                if (towers[tower] !== undefined && towers[tower].id !== undefined)
                {
                    if (Memory.rooms[roomName].structures[towers[tower].id] === undefined)
                        Memory.rooms[roomName].structures[towers[tower].id] = {};
                    Memory.rooms[roomName].structures[towers[tower].id].role = 'tower';
                }
            }

            let linkNames = Game.rooms[roomName].find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_LINK);
                }
            });
            for (let link in linkNames)
            {
                if (linkNames[link] !== undefined && linkNames[link].id !== undefined)
                {
                    if (Memory.rooms[roomName].links[linkNames[link].id] === undefined)
                        Memory.rooms[roomName].links[linkNames[link].id] = {};
                    Memory.rooms[roomName].links[linkNames[link].id].role = 'link';
                }
            }
        }
    }
    
    updateSlower() {
    }
}

module.exports = new structureManager();