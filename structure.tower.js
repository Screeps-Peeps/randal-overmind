var structureTower = {
/** @param {Structure} structure
     * **/
    run: function(structure, memory) {
        var hostiles = structure.room.find(FIND_HOSTILE_CREEPS);
        if(hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify('User ${username} spotted in room ${structure.room.name}');
            structure.attack(hostiles[0]);
        }
    }
};

module.exports = structureTower;