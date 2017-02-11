'use strict';

const ui = new WebUIWindow('freeroam_ui', 'package://nanos-freeroam/ui/index.html', new Vector2(jcmp.viewportSize.x, jcmp.viewportSize.y));
ui.autoResize = true;

const playersCache = [];
function createCache(id, name, colour) {
    playersCache[id] = {
        id: id,
        name: name,
        colour: colour,
        colour_rgb: hex2rgba(colour),
        stats: {
            kills: 0,
            deaths: 0
        },
        flags: {
            passiveMode: false,
            isAdmin: false,
            isInMyGroup: false
        },
        nametag: {
            textMetric: null,
            textPos: null,
            shadowPos: null,
            iconPos: null,
            healthBarPos: null,
            healthBarBackPos: null,
            healthBarShadowPos: null
        }
    };

    return playersCache[id];
}

//
const up = new Vector3f(0, 1, 0);
const scaleFactor = new Vector3f(0.0001, 0.0001, 0.0001);
const minScale = new Vector3f(0.001, 0.001, 0.001);
const maxScale = new Vector3f(0.008, 0.008, 0.008);
const maxScaleGroup = new Vector3f(0.014, 0.014, 0.014);

// colours
const white = new RGBA(255, 255, 255, 255);
const black = new RGBA(0, 0, 0, 255);
const red = new RGBA(255, 0, 0, 255);
const darkred = new RGBA(40, 0, 0, 255);

// nametags
const nameTagTextSize = new Vector2f(100000, 1000000);
const healthBarSize = new Vector2f(394, 14);
const healthBarPos = new Vector3f(-(healthBarSize.x / 2), -277, 0);
const healthBarBackPos = new Vector3f(-(healthBarSize.x / 2), -277, 0.05);
const healthBarShadowSize = new Vector2f(400, 20);
const healthBarShadowPos = new Vector3f(-(healthBarShadowSize.x / 2), -280, 0.1);

function hex2rgba(colour) {
    colour = colour.replace('#', '');

    const r = parseInt(colour.substring(0, 2), 16);
    const g = parseInt(colour.substring(2, 4), 16);
    const b = parseInt(colour.substring(4, 6), 16);

    return new RGBA(r, g, b, 255);
}

jcmp.ui.AddEvent('freeroam_ready', () => {
    jcmp.events.CallRemote('freeroam_ready');
});

jcmp.ui.AddEvent('freeroam_toggle_cursor', (toggle) => {
    jcmp.localPlayer.controlsEnabled = !toggle;
});

jcmp.events.AddRemoteCallable('freeroam_init', (data) => {
    data = JSON.parse(data);

    data.players.forEach(p => {
        const playerCache = createCache(p.id, p.name, p.colour);
        playerCache.stats.kills = p.kills;
        playerCache.stats.deaths = p.deaths;
        playerCache.flags.passiveMode = p.passiveMode;
        playerCache.flags.isAdmin = p.isAdmin;

        jcmp.ui.CallEvent('freeroam_scoreboard_addplayer', JSON.stringify({
            id: p.id,
            name: p.name,
            colour: p.colour,
            kills: p.kills,
            deaths: p.deaths,
            isAdmin: p.isAdmin,
            isLocalPlayer: p.id === jcmp.localPlayer.networkId
        }));
    });

    jcmp.ui.CallEvent('freeroam_initialised');
});

jcmp.events.AddRemoteCallable('freeroam_player_created', (data) => {
    data = JSON.parse(data);

    const playerCache = createCache(data.id, data.name, data.colour);
    playerCache.flags.isAdmin = data.isAdmin;

    jcmp.ui.CallEvent('freeroam_scoreboard_addplayer', JSON.stringify({
        id: data.id,
        name: data.name,
        colour: data.colour,
        kills: 0,
        deaths: 0,
        isAdmin: data.isAdmin,
        isLocalPlayer: data.id === jcmp.localPlayer.networkId
    }));
});

jcmp.events.AddRemoteCallable('freeroam_player_destroyed', (networkId) => {
    jcmp.ui.CallEvent('freeroam_scoreboard_removeplayer', networkId);

    if (playersCache[networkId] !== null)
        delete playersCache[networkId];
});

jcmp.events.AddRemoteCallable('freeroam_deathui_show', (killer_name, death_message) => {
    jcmp.ui.CallEvent('freeroam_deathui_toggle', true, killer_name, death_message);
});

jcmp.events.AddRemoteCallable('freeroam_deathui_hide', () => {
    jcmp.ui.CallEvent('freeroam_deathui_toggle', false, '');
});

jcmp.events.AddRemoteCallable('freeroam_player_death', (data) => {
    data = JSON.parse(data);

    let cache = playersCache[data.player.networkId];
    if (typeof cache !== 'undefined') {
        jcmp.ui.CallEvent('freeroam_scoreboard_updateplayer', data.player.networkId, data.player.kills, data.player.deaths);
        cache.stats.kills = data.player.kills;
        cache.stats.deaths = data.player.deaths;
    }

    if (typeof data.killer !== 'undefined') {
        cache = playersCache[data.killer.networkId];
        if (typeof cache !== 'undefined') {
            jcmp.ui.CallEvent('freeroam_scoreboard_updateplayer', data.killer.networkId, data.killer.kills, data.killer.deaths);
            cache.stats.kills = data.killer.kills;
            cache.stats.deaths = data.killer.deaths;
        }
    }

    jcmp.ui.CallEvent('freeroam_player_death', data.player.networkId, typeof data.killer !== 'undefined' ? data.killer.networkId : data.player.networkId, data.death_reason);
});

// Spawn Protection
jcmp.events.Add('GameTeleportInitiated', () => {
    jcmp.events.CallRemote('freeroam_player_spawning');
    jcmp.ui.CallEvent('freeroam_spawn_protection', true);
});

jcmp.events.Add('GameTeleportCompleted', () => {
    jcmp.events.CallRemote('freeroam_player_spawned');
});

jcmp.events.AddRemoteCallable('freeroam_spawn_protect_done', () => {
    jcmp.ui.CallEvent('freeroam_spawn_protection', false);
});

// TEMP TEXTURE RENDER
const admin_icon = new WebUIWindow('freeroam_admin_icon', 'package://nanos-freeroam/ui/icon.html', new Vector2(41, 42));
admin_icon.autoRenderTexture = false;

// Nametags
function RenderNametag(renderer, playerCache, distance) {
    if (typeof playerCache !== 'undefined') {
        let distscale = (distance * 2.4);

        // build the name metric if needed
        if (playerCache.nametag.textMetric === null) {
            const metric = renderer.MeasureText(playerCache.name, 100, 'Arial');
            playerCache.nametag.textMetric = metric;
            playerCache.nametag.textPos = new Vector3f(-(metric.x / 2), -400, 0);
            playerCache.nametag.shadowPos = new Vector3f(-(metric.x / 2) + 5, -395, 1);
            playerCache.nametag.iconPos = new Vector3f(-(metric.x / 2) - 100, -363, 0);
            //playerCache.nametag.healthBarPos = new Vector3f(-(healthBarSize.x / 2), -277, 0);
            //playerCache.nametag.healthBarBackPos = new Vector3f(-(healthBarSize.x / 2), -277, 0.05);
            //playerCache.nametag.healthBarShadowPos = new Vector3f(-(healthBarShadowSize.x / 2), -280, 0.1);
        }

        if (distscale >= 350) {
            distscale = 350;
        }

        // adjust position based on distance
        playerCache.nametag.textPos.y = (-400 + distscale);
        playerCache.nametag.shadowPos.y = (-395 + distscale);
        playerCache.nametag.iconPos.y = (-363 + distscale);
        //playerCache.nametag.healthBarPos.y = (-277 + distscale);
        //playerCache.nametag.healthBarBackPos.y = (-277 + distscale);
        //playerCache.nametag.healthBarShadowPos.y = (-280 + distscale);

        // draw player name
        renderer.DrawText(playerCache.name, playerCache.nametag.textPos, nameTagTextSize, playerCache.colour_rgb, 100, 'Arial');
        renderer.DrawText(playerCache.name, playerCache.nametag.shadowPos, nameTagTextSize, black, 100, 'Arial');

        // draw admin icon
        if (playerCache.flags.isAdmin) {
            renderer.DrawTexture(admin_icon.texture, playerCache.nametag.iconPos);
        }

        // draw health bar
        //renderer.DrawRect(playerCache.nametag.healthBarPos, new Vector2f(healthBarSize.x * Math.max((player.health / player.maxHealth), 0), healthBarSize.y), red);
        //renderer.DrawRect(playerCache.nametag.healthBarBackPos, healthBarSize, darkred);
        //renderer.DrawRect(playerCache.nametag.healthBarShadowPos, healthBarShadowSize, black);
    }
}

function dist(start, end) {
    return end.sub(start).length;
}

let cachedPlayer = null;
jcmp.events.Add('GameUpdateRender', (renderer) => {
    const cam = jcmp.localPlayer.camera.position;

    jcmp.players.forEach(player => {
        if (!player.localPlayer) {
            const playerCache = playersCache[player.networkId];
            if (typeof playerCache !== 'undefined') {
                let head = player.GetBoneTransform(0xA877D9CC, renderer.dtf);

                const d = dist(head.position, cam);
                let scale = new Vector3f(d, d, d).mul(scaleFactor);
                if (scale.x >= maxScaleGroup.x) {
                    scale = maxScaleGroup;
                } else if (scale.x <= minScale.x) {
                    scale = minScale;
                }

                const mat = head.LookAt(head.position, cam, up).Scale(scale);
                renderer.SetTransform(mat);

                RenderNametag(renderer, playerCache, d);
            }
        }
    });
});

jcmp.events.AddRemoteCallable('freeroam_set_time', (hour, minute) => {
    jcmp.world.SetTime(hour, minute);
});

jcmp.events.AddRemoteCallable('freeroam_set_weather', weather => {
    jcmp.world.weather = weather;
});
