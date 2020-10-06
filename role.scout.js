module.exports = {
    
/** @param {Creep} creep
     * **/
    run: function(creep, say) {
        let post = creep.memory.post;
        if (post === undefined)
        {
            let exitRooms = Game.map.describeExits(creep.room.name);
            for(let i in exitRooms)
            {
                let match = false;
                let exitRoom = exitRooms[i];
                for (let j in Game.rooms)
                {
                    if (Game.rooms[j].name === exitRoom)
                    {
                        let roomCreeps = Game.rooms[j].find(FIND_MY_CREEPS, {
                            filter: (creep) => {
                                return creep.memory.role === 'scout';
                            }
                        });
                        console.log('roomcreeps: ' + roomCreeps.length + ' for: ' + exitRooms[i]);
                        if (roomCreeps.length > 0)
                        {
                            match = true;
                        }
                    }
                }
                if (match === false)
                {
                    post = exitRoom;
                    creep.memory.post = post;
                }
            }
        }
        if (post === creep.room.name)
        {
            creep.say('💩hi');
            
            let enemies = creep.room.find(FIND_HOSTILE_CREEPS, {
                filter: (hostile) => {
                    return true;
                }
            });
            if (enemies.length > 0)
            {
                let target = creep.pos.findClosestByPath(enemies);
                creep.moveTo(target);
                creep.attack(target);
            }
            else
            {
                let target = creep.room.controller.pos;
                creep.moveTo(target);
                if (creep.room.owner === undefined)
                {
                    if (creep.claimController(creep.room.controller) !== OK)
                    {
                        creep.reserveController(creep.room.controller);
                    }
                }
                else
                {
                    creep.attackController(creep.room.controller);
                }
            }
        }
        else
        {
            creep.moveTo(creep.pos.findClosestByRange(creep.room.findExitTo(post)));
        }
    }
};