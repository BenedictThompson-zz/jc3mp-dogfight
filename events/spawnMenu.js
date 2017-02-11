'use strict';

jcmp.events.Add("spawnmenu/local/spawnVehicle", player => {
    if (typeof player.spawnedVehicle !== 'undefined') {
        player.spawnedVehicle.Destroy();
    }
});

jcmp.events.Add("spawnmenu/local/vehicleSpawned", (player, vehicle) => {
    vehicle.SetOccupant(0, player);
});

jcmp.events.Add("spawnmenu/local/spawnWeapon", (player, hash) => {
    if (player.freeroam.passiveMode) {
        freeroam.chat.send(player, 'You cannot spawn weapons in /passive.', freeroam.config.colours.red);
        return false;
    }
});

jcmp.events.Add("spawnmenu/local/attrToggled", (player, nitrous, enabled, silent) => {
    if (nitrous) {
        player.freeroam.vehicle_nitro_toggled = enabled;

        if (typeof player.vehicle !== 'undefined') {
            player.vehicle.nitroEnabled = true;
        }

        if (!silent) {
            freeroam.chat.send(player, `Vehicle nitro ${player.freeroam.vehicle_nitro_toggled ? 'enabled' : 'disabled'}.`, freeroam.config.colours.command_success);
        }
    } else {
        player.freeroam.vehicle_turbojump_toggled = enabled;

        if (typeof player.vehicle !== 'undefined') {
            player.vehicle.turboJumpEnabled = false;
        }

        if (!silent) {
            freeroam.chat.send(player, `Vehicle turbo jump ${player.freeroam.vehicle_turbojump_toggled ? 'enabled' : 'disabled'}.`, freeroam.config.colours.command_success);
        }
    }
});
