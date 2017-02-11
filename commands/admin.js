'use strict';

module.exports = ({ Command, manager }) => {
  manager.category('admin', 'only usable by nanos members')
    .add(new Command('kick')
      .parameter('target', 'string', 'networkId or (part of) name')
      .optional('reason', 'string', 'reason', { isTextParameter: true })
      .description('kicks one or more players')
      .handler((player, target, reason) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }
        const res = freeroam.utils.getPlayer(target);
        if (res.length === 0) {
          freeroam.chat.send(player, 'no matching players!', freeroam.config.colours.red);
          return;
        }

        res.forEach(p => {
          freeroam.chat.broadcast(`${player.escapedNametagName} kicked ${p.escapedNametagName}.` + (reason.length > 0 ? ` Reason: ${reason}` : ''), freeroam.config.colours.orange);
          freeroam.workarounds.watchPlayer(p, setTimeout(() => p.Kick(reason), 5000));
        });
    }))

    .add(new Command('ban')
      .parameter('target', 'string', 'networkId or (part of) name')
      .optional('reason', 'string', 'reason', { isTextParameter: true })
      .description('bans a player until the next restart')
      .handler((player, target, reason) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }
        const res = freeroam.utils.getPlayer(target);
        if (res.length === 0 || res.length > 1) {
          freeroam.chat.send(player, 'no / too many matching players!', freeroam.config.colours.red);
          return;
        }

        freeroam.chat.broadcast(`${player.escapedNametagName} banned ${res[0].escapedNametagName} until the next server restart.` + (reason.length > 0 ? ` Reason: ${reason}` : ''), freeroam.config.colours.orange);
        freeroam.bans.add(res[0].client.steamId);
        freeroam.workarounds.watchPlayer(res[0], setTimeout(() => res[0].Kick(reason), 5000));
    }))

    .add(new Command('admintpall')
      .description('teleports all players to your position')
      .handler((player, target, reason) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }

        freeroam.chat.broadcast(`${player.escapedNametagName} teleported all players to his position`, freeroam.config.colours.orange);

        jcmp.players.forEach(p => {
          if (p.networkId === player.networkId) {
            return;
          }
          p.position = player.position;
        });
    }))

    .add(new Command('m')
      .parameter('message', 'string', 'message', { isTextParameter: true })
      .description('writes a big fucking message in the chat')
      .handler((player, message) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }

        freeroam.chat.broadcast(`<h2><div class="admin-logo large"></div>${player.escapedNametagName}: ${message}</h2>`, freeroam.config.colours.red);
    }))

    .add(new Command(['playerCount', 'pc'])
      .description('check the player count')
      .handler(player => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }

        freeroam.chat.send(player, `connected players: ${jcmp.players.length}`, freeroam.config.colours.command_success);
    }))

    .add(new Command('disarm')
      .parameter('target', 'string', 'networkId or (part of) name')
      .description('disarms a player')
      .handler((player, target, reason) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }

        const res = freeroam.utils.getPlayer(target);
        if (res.length === 0 || res.length > 1) {
          freeroam.chat.send(player, 'no / too many matching players!', freeroam.config.colours.red);
          return;
        }

        res[0].weapons.forEach(w => {
          w.reserveAmmo = 0;
          w.magazineAmmo = 0;
        });

        freeroam.chat.send(player, `Disarming player ${res[0].escapedNametagName}.`, freeroam.config.colours.green);
        freeroam.chat.send(res[0], `You were disarmed by ${player.escapedNametagName}.`, freeroam.config.colours.red);
    }))

    .add(new Command('netId')
      .parameter('target', 'string', '(part of) name')
      .description('gets the network id of one or multiple targets')
      .handler((player, target) => {
        if (!freeroam.utils.isAdmin(player)) {
          freeroam.chat.send(player, 'you are not allowed to use this command', freeroam.config.colours.red)
          return;
        }
        const res = freeroam.utils.getPlayer(target);
        freeroam.chat.send(player, `Result: ${res.map(p => `${p.escapedNametagName}: ${p.networkId}`).join(', ')}`, freeroam.config.colours.purple);
    }));
};
