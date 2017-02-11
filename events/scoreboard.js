'use strict';

jcmp.events.AddRemoteCallable("freeroam_ready", player => {
    const data = {
        players: jcmp.players.map(p => ({
            id: p.networkId,
            name: p.escapedNametagName,
            colour: p.freeroam.colour,
            kills: p.freeroam.kills,
            deaths: p.freeroam.deaths,
            passiveMode: p.freeroam.passiveMode,
            isAdmin: freeroam.utils.isAdmin(p)
        }))
    };

    jcmp.events.CallRemote("freeroam_init", player, JSON.stringify(data));
});