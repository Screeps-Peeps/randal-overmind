class BuildManager {
    constructor() {
        if (Memory.rooms === undefined)
            Memory.rooms = {};
    }

    updateSlow() {
    };

    updateSlower() {
        let myRooms = _.filter(Game.rooms, (room) => room.find(FIND_MY_SPAWNS).length > 0);
        if (Memory.rooms === undefined)
            Memory.rooms = {};
        if (Memory.mines === undefined)
            Memory.mines = {};
        for (let i = 0; i< myRooms.length; i++)
        {
            let roomName = myRooms[i].name;
            if (Memory.rooms[roomName] === undefined) {
                Memory.rooms[roomName] = {};
            }
            
            let room = myRooms[i];
            
            let sources = room.find(FIND_SOURCES);
            let containers = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_CONTAINER) || (structure.structureType === STRUCTURE_STORAGE);
                }
            });
            let spawns = room.find(FIND_MY_SPAWNS);
            let extensions = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION);
                }
            });
            let controller = room.controller;
        
            this._updateRoads(room, sources, containers, spawns, extensions, controller);
            //this._updateContainers(room, sources, containers, spawns, extensions, controller);
            this._updateExtensions(room, sources, containers, spawns, extensions, controller);
        }

    };
    
    _getPosAlongPath(room, orig, dest, offset, fromEnd) {
        let origToDest = room.findPath(orig, dest, {
                maxOps: 1000, ignoreCreeps: true, ignoreRoads: false
        });
        let node = origToDest[fromEnd ? (origToDest.length - 1 - offset) : offset];
        let testPos;
        // console.log('x: ' + node.x);
        // console.log('y: ' + node.y);
        // console.log('roomname: ' + room.name);
        if (node.dy === 0)
            testPos = new RoomPosition(node.x, node.y + (Math.random() > 0.5 ? 1 : -1), room.name);
        else if (node.dx === 0)
            testPos = new RoomPosition(node.x + (Math.random() > 0.5 ? 1 : -1), node.y, room.name);
        else if ((node.dy === 1 && node.dx === 1) || (node.dy === -1 && node.dx === -1)) {
            if (Math.random() > 0.5)
                testPos = new RoomPosition(node.x + 1, node.y - 1, room.name);
            else
                testPos = new RoomPosition(node.x - 1, node.y + 1, room.name);
        }
        else if ((node.dy === 1 && node.dx === -1) || (node.dy === -1 && node.dx === 1)) {
            if (Math.random() > 0.5)
                testPos = new RoomPosition(node.x + 1, node.y + 1, room.name);
            else
                testPos = new RoomPosition(node.x - 1, node.y - 1, room.name);
        }
        else
            testPos = new RoomPosition(node.x, node.y, room.name);
        // console.log('x: ' + testPos.x);
        // console.log('y: ' + testPos.y);
        // console.log('roomname: ' + testPos.roomName);
        return testPos;
    }
    
    _updateExtensions(room, sources, containers, spawns, extensions, controller) {
        let roomName = room.name;
        let neededPlans = [];
        
        for (let i = 0; i<sources.length; i++) {
            neededPlans.push(this._getPosAlongPath(room, spawns[0].pos, sources[i].pos, Math.round(2 + (Math.random() * 4)), true));
            neededPlans.push(this._getPosAlongPath(room, controller.pos, sources[i].pos, Math.round(2 + (Math.random() * 4)), true));
        }
            
        let existingPlans = Memory.rooms[roomName].extensionPlans;
        let unbuiltPlans = [];
        
        if (existingPlans === undefined || existingPlans === null)
        {
            existingPlans = [];
            unbuiltPlans = neededPlans;
        }
        else
        {
            unbuiltPlans = neededPlans.filter(plan => existingPlans.includes(plan));
        }
        for(let i = 0; i < unbuiltPlans.length; i++)
        {
            room.visual.rect(unbuiltPlans[i].x - 0.6, unbuiltPlans[i].y - 0.6, 
                1.2, 1.2,
                {fill: 'transparent', stroke: '#f00'});
            let errcode = room.createConstructionSite(unbuiltPlans[i], STRUCTURE_EXTENSION);
            console.log('attempted to create extension, errcode: ' + errcode);
        }
    }
    
    _updateContainers(room, sources, containers, spawns, extensions, controller) {
        let roomName = room.name;
        let neededPlans = [];
        
        neededPlans.push(this._getPosAlongPath(room, spawns[0].pos, controller.pos, 2, true));
            
        let existingPlans = Memory.rooms[roomName].containerPlans;
        let unbuiltPlans = [];
        
        if (existingPlans === undefined || existingPlans === null)
        {
            existingPlans = [];
            unbuiltPlans = neededPlans;
        }
        else
        {
            unbuiltPlans = neededPlans.filter(plan => existingPlans.includes(plan));
        }
        for(let i = 0; i < unbuiltPlans.length; i++)
        {
            room.visual.rect(unbuiltPlans[i].x - 0.6, unbuiltPlans[i].y - 0.6, 
                1.2, 1.2,
                {fill: 'transparent', stroke: '#f00'});
            let errcode = room.createConstructionSite(unbuiltPlans[i], STRUCTURE_CONTAINER);
            console.log('attempted to create container, errcode: ' + errcode);
        }
    }

    _updateRoads(room, sources, containers, spawns, extensions, controller) {
        let roomName = room.name;
        
        let travelPairs = [];
        for(let i = 0; i < sources.length; i++) {
            travelPairs.push({origin: sources[i].pos, destination: controller.pos});
            travelPairs.push({origin: sources[i].pos, destination: spawns[0].pos});
            for(let j = i+1; j < sources.length; j++)
            {
                travelPairs.push({origin: sources[i].pos, destination: sources[j].pos});
            }
        }
        for(let i = 0; i < containers.length; i++) {
            travelPairs.push({origin: controller.pos, destination: containers[i].pos});
        }
        travelPairs.push({origin: controller.pos, destination: spawns[0].pos});
        if (Memory.mines !== undefined)
            for(let id in Memory.mines) {
                let pos = new RoomPosition(Memory.mines[id].x, Memory.mines[id].y, Memory.mines[id].roomName);
                travelPairs.push({origin: controller.pos, destination: pos});
            }
        let existingPlans = Memory.rooms[roomName].roadPlans;
        let unbuiltPairs;
        if (existingPlans === undefined || existingPlans === null)
        {
            unbuiltPairs = travelPairs;
            existingPlans = [];
        }
        else
        {
            //unbuiltPairs = travelPairs.filter(pair => existingPlans.includes(pair.origin + "," + pair.destination) === false);
            unbuiltPairs = travelPairs;
            console.log('unbuilt pairs: ' + unbuiltPairs.length);
        }
        
        for(let i = 0; i < unbuiltPairs.length; i++)
        {
            let destPos = unbuiltPairs[i].destination;
            let orgPos = unbuiltPairs[i].origin;
            
            let ret = PathFinder.search(
            orgPos, destPos,
                {
                  // We need to set the defaults costs higher so that we
                  // can set the road cost lower in `roomCallback`
                  plainCost: 2,
                  swampCost: 3,
                
                  roomCallback: function(roomName) {
                
                    let thisRoom = Game.rooms[roomName];
                    // In this example `room` will always exist, but since 
                    // PathFinder supports searches which span multiple rooms 
                    // you should be careful!
                    if (!thisRoom) return;
                    let costs = new PathFinder.CostMatrix;
                
                    thisRoom.find(FIND_STRUCTURES).forEach(function(struct) {
                      if (struct.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(struct.pos.x, struct.pos.y, 1);
                      } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                                 (struct.structureType !== STRUCTURE_RAMPART ||
                                  !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                      }
                    });
                
                    return costs;
                  },
                }
            );
            
            let newPlans = ret.path;
            
            for(let j = 0; j< newPlans.length; j++) {
                let thisRoom = Game.rooms[newPlans[j].roomName];
                thisRoom.visual.circle(newPlans[j]);
                thisRoom.createConstructionSite(newPlans[j], STRUCTURE_ROAD);
                //console.log('plans: ' + newPlans[j]);
            }



            // if (destPos.roomName === orgPos.roomName) {
            //     let newPlans = [];
            //     let path = room.findPath(orgPos, destPos, {
            //     maxOps: 1000, ignoreCreeps: true, ignoreRoads: false
            //     });
            //     let pathShort = room.findPath(orgPos, destPos, {
            //         maxOps: 1000, ignoreCreeps: true, ignoreRoads: true
            //     });
            //     //if making a road that ignores existing roads (shortcut) would save at least 6 units of distance,
            //     //make that road. Otherwise, it's not worth the energy to maintain.
            //     if((path.length - pathShort.length) > 6)
            //         newPlans = _.map(pathShort, (node) => new RoomPosition(node.x, node.y, room.name));
            //     else
            //         newPlans = _.map(path, (node) => new RoomPosition(node.x, node.y, room.name));
            //     for(let j in newPlans) {
            //         room.visual.circle(newPlans[j]);
            //         room.createConstructionSite(newPlans[j], STRUCTURE_ROAD);
            //         //console.log('plans: ' + newPlans);
            //     }
            // } else {
            //     let destNewPlans = [];
            //     let orgNewPlans = [];
            //     let destRoom = Game.rooms[destPos.roomName];
            //     let orgRoom = Game.rooms[orgPos.roomName];
                
            //     let destPath = destRoom.findPath(orgPos, destPos, {
            //     maxOps: 1000, ignoreCreeps: true, ignoreRoads: false
            //     });
            //     let destPathShort = destRoom.findPath(orgPos, destPos, {
            //         maxOps: 1000, ignoreCreeps: true, ignoreRoads: true
            //     });
            //     let orgPath = orgRoom.findPath(orgPos, destPos, {
            //     maxOps: 1000, ignoreCreeps: true, ignoreRoads: false
            //     });
            //     let orgPathShort = orgRoom.findPath(orgPos, destPos, {
            //         maxOps: 1000, ignoreCreeps: true, ignoreRoads: true
            //     });
                
            //     //if making a road that ignores existing roads (shortcut) would save at least 6 units of distance,
            //     //make that road. Otherwise, it's not worth the energy to maintain.
            //     if((path.length - pathShort.length) > 6)
            //         newPlans = _.map(pathShort, (node) => new RoomPosition(node.x, node.y, room.name));
            //     else
            //         newPlans = _.map(path, (node) => new RoomPosition(node.x, node.y, room.name));
            //     for(let j in newPlans) {
            //         room.visual.circle(newPlans[j]);
            //         room.createConstructionSite(newPlans[j], STRUCTURE_ROAD);
            //         //console.log('plans: ' + newPlans);
            //     }
            // }
            
            
            existingPlans.push(orgPos + "," + destPos);
        }
        Memory.rooms[roomName].roadPlans = existingPlans;
        //console.log('sources: ' + sources + ' spawns: ' + spawns + ' controller: ' + controller);
    }
    
    
}

let buildManager = new BuildManager();

module.exports = buildManager;