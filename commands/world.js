'use strict';

const utility = require('../gm/utility');

module.exports = ({ Command, manager }) => {
  const weathers = [
    'base',
    'rain',
    'overcast',
    'thunderstorm',
    'fog',
    'snow'
  ];

  manager.category('world', 'world related commands')
  // /localtime [hour] [minute]
  .add(new Command('localtime')
    .parameter('hour', 'number', 'hour (0-24)')
    .parameter('minute', 'number', 'minute (0-59)')
    .description('sets the local time. use /resetTime to reset it')
    .handler((player, hour, minute) => {
      if (hour < 0 || hour > 24 || minute < 0 || minute > 60) {
        return 'usage';
      }

      freeroam.timeManager.setTimeForPlayer(player, hour, minute);
      player.freeroam.custom_time_set = true;

      let formattedTime = freeroam.utils.timeFormat(hour, minute);
      freeroam.chat.send(player, `Set your time to ${formattedTime}.`, freeroam.config.colours.command_success);
  }))

    // /weather [preset name]
    .add(new Command('weather')
        .parameter('weather', 'string', 'available presets: base, rain, overcast, thunderstorm, fog, snow', {
        hints: ['base', 'rain', 'overcast', 'thunderstorm', 'fog', 'snow'] })
        .description('sets the global weather preset')
        .timeout(180000)
        .handler((player, weather) => {
            const idx = weathers.indexOf(weather);
            if (idx === -1) {
                return 'usage';
            }

            // assign the weather to all players
            jcmp.players.forEach(p => {
                if (typeof p.freeroam !== 'undefined' && p.freeroam.custom_weather_set) {
                    return;
                }
                jcmp.events.CallRemote('freeroam_set_weather', p, idx);
            });

            freeroam.config.world.weather = idx;
            freeroam.chat.broadcast(`${player.escapedNametagName} has set the weather to '${weather}'!`, freeroam.config.colours.orange);
        }))


  // /localweather [preset name]
  .add(new Command('localweather')
    .parameter('weather', 'string', 'available presets: base, rain, overcast, thunderstorm, fog, snow', {
    hints: ['base', 'rain', 'overcast', 'thunderstorm', 'fog', 'snow'] })
    .description('sets the local weather preset')
    .handler((player, weather) => {
      const idx = weathers.indexOf(weather);
      if (idx === -1) {
        return 'usage';
      }

      player.freeroam.custom_weather_set = true;
      jcmp.events.CallRemote('freeroam_set_weather', player, idx);
      freeroam.chat.send(player, `Set your weather to ${weather}.`, freeroam.config.colours.command_success);
  }))

  .add(new Command('resettime')
    .description('resets your local time')
    .handler(player => {
      if (typeof player.freeroam !== 'undefined' && player.freeroam.custom_time_set) {
        player.freeroam.custom_time_set = false;
        freeroam.timeManager.updatePlayer(player);

        let formattedTime = freeroam.utils.timeFormat(freeroam.timeManager.hour, freeroam.timeManager.minute);
        freeroam.chat.send(player, `Resetting your time to ${formattedTime}`, freeroam.config.colours.command_success);
      }
    }))

  .add(new Command('resetweather')
    .description('resets your local weather')
    .handler(player => {
      if (typeof player.freeroam !== 'undefined' && player.freeroam.custom_weather_set) {
        player.freeroam.custom_weather_set = false;
        jcmp.events.CallRemote('freeroam_set_weather', player, freeroam.config.world.weather);

        freeroam.chat.send(player, `Resetting your weather.`, freeroam.config.colours.command_success);
      }
    }));
};
