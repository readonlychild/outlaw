const minimister = require('./../minimister.js');
const osql = require('./../osql.js');
const utils = require('./../utils.js');
const colors = require('./../colors.js');
const moment = require('moment');
const templates = require('./../templates.js');

const stateManager = require('./../stateManager.js');
const reactionHandler = require('./../reactionHandler.js');

reactionHandler.addListener('gym_page_reaction', function (reaction, user) {
  //console.log('gym_page_reaction', 'wakeup')  
  var userState = stateManager.getUserState(user.id, 'gym');
  if (reaction.message != userState.message) return;
  if (userState.userPick) {
    if (reaction.emoji.name === '➡') {
      // console.log('PAGE UP');
      userState.userPick += 1;
      if (userState.userPick > userState.maxPick) {
        userState.userPick = userState.maxPick;
        return;
      }
      stateManager.saveState('gym', user.id, userState);
      sendEmbed(reaction.message, user.id, userState.userPick, userState.searchTerm, true);
    }
    if (reaction.emoji.name === '⬅') {
      // console.log('PAGE DN');
      userState.userPick -= 1;
      if (userState.userPick < 1) {
        userState.userPick = 1;
        return;
      }
      stateManager.saveState('gym', user.id, userState);
      sendEmbed(reaction.message, user.id, userState.userPick, userState.searchTerm, true);
    }
  }
});

exports.run = (client, message, args) => {
  var argv = minimister(args);
  var prefix = process.env.BOT_PREFIX;
  if (args.length === 0) {
    message.channel.send({
      embed: utils.getEmbed()
        .setColor(colors.info)
        .setDescription(`Usage: \`${prefix}gym <gym name>\`\n\nWhen multiple results are found, pager reactions are provided.\nFor pager reaction to work multiple times, you need to remove it and put it back again`)
    });
    return;
  }
  var searchTerm = argv._.join('');
  var userPick = argv.p || 1;
  sendEmbed(message, message.author.id, userPick, searchTerm, false);
};

function sendEmbed (message, userId, userPick, searchTerm, isReaction) {
  osql.connect();
  osql.query(`SELECT * from gym where replace(name, ' ', '') like ? order by id limit 25`, [ `%${searchTerm}%` ])
  .then((response) => {
    if (!response.results.length) {
      message.channel.send({
        embed: utils.getEmbed().setColor(colors.warning)
          .setDescription(`No gyms found [${searchTerm}]`)
      });
      return;
    }
    if (userPick > response.results.length) userPick = response.results.length;
    var k = 0;
    var emb = utils.getEmbed();
    var now = moment();
    var lat = 0;
    var lng = 0;
    var gymid = '';
    response.results.forEach((row) => {
      var gym = gymInfo(row);
      if (k === userPick-1) {
        emb.setColor(colors.success)
          .setTitle(gym.name)
          .setThumbnail(gym.url)
          ;
        lat = gym.lat;
        lng = gym.lng;
        gymid = gym.id;

        var hasRaid = now.isBefore(gym.raidEnds) && gym.raidPokemonId !== 0;
        var hasEgg = now.isBefore(gym.eggHatched) && gym.raidPokemonId === 0;
        var desc = '';
        //emb.title += ' ' + hasRaid + '|' + hasEgg;
        if (hasRaid) {
          desc = templates.getTemplate('gym_raid'); //.gyms.raid;
          emb.setThumbnail(utils.getPokeImageUrl(gym.raidPokemonId));
        } else if (hasEgg) {
          desc = templates.getTemplate('gym_egg'); //.gyms.egg;
        } else /* no expected raid */ {
          desc = templates.getTemplate('gym_default'); //.gyms.normal;
        }

        var types = '';
        if (gym.pokemon) {
          gym.pokemon.types.forEach((t) => {
            types += ` :${t.toLowerCase()}:`;
          });
        }

        desc = desc.replace(/#teamName#/g, gym.teamName)
            .replace(/#raidLevel#/g, lvlToStars(gym.raidLevel))
            .replace(/#started#/g, gym.eggHatched.format('h:mm a'))
            .replace(/#ends#/g, gym.raidEnds.format('h:mm a'))
            .replace(/#move1#/g, gym.raidMove1 ? `${gym.raidMove1.name} :${gym.raidMove1.type.toLowerCase()}:` : '')
            .replace(/#move2#/g, gym.raidMove2 ? `${gym.raidMove2.name} :${gym.raidMove2.type.toLowerCase()}:` : '')
            .replace(/#isEx#/g, gym.isEx ? ':regional_indicator_e::regional_indicator_x:' : 'No')
            .replace(/#availSlots#/g, gym.availSlots)
            .replace(/#lat#/g, gym.lat)
            .replace(/#lng#/g, gym.lng)
            .replace(/#poke#/g, gym.pokemon ? gym.pokemon.name : '')
            .replace(/#type#/g, types)
            ;
        emb.setDescription(desc);
      }
      k += 1;
    });
    emb.setFooter(`..${userPick}/${response.results.length} gyms found.`);
    var maptile = process.env.MAP_TILES.replace(/{lat}/g, lat).replace(/{lng}/g, lng);
    //console.log(maptile);
    emb.setImage(maptile);

    if (!isReaction) {
      message.channel.send({
        embed: emb
      })
      .then((msg) => {
        // add pager
        if (response.results.length > 1) {
          msg.react('⬅').catch();
          setTimeout(() => {
              msg.react('➡').catch();
          }, 400);
        }
        // create user state for reaction-time!
        stateManager.saveState('gym', message.author.id, {
          userPick: userPick,
          maxPick: response.results.length,
          searchTerm: searchTerm,
          message: msg
        });
      });
    } else {
      // isReaction
      var userState = stateManager.getUserState(userId, 'gym');
      userState.message.edit({ embed: emb });
    }
  });
};

function gymInfo (row) {
  var tz_offset = -6;
  var info = {
    eggSpawned: moment('2011-01-01'),
    eggHatched: moment('2011-01-01'),
    raidEnds: moment('2011-01-01'),
    updated: moment('2011-01-01'),
    lastModified: moment('2011-01-01'),
    raidPokemonId: 0,
    team: false,
    teamName: '',
    name: 'unk',
    isEx: false,
    raidLevel: 0,
    availSlots: 0,
    lat: 0,
    lng: 0,
    url: ''
  };
  if (row.raid_spawn_timestamp) {
    info.eggSpawned = moment.unix(row.raid_spawn_timestamp).utc().utcOffset(tz_offset);
  }
  if (row.raid_battle_timestamp) {
    info.eggHatched = moment.unix(row.raid_battle_timestamp).utc().utcOffset(tz_offset);
  }
  if (row.raid_end_timestamp) {
    info.raidEnds = moment.unix(row.raid_end_timestamp).utc().utcOffset(tz_offset);
  }
  if (row.last_modified_timestamp) {
    info.lastModified = moment.unix(row.last_modified_timestamp).utc().utcOffset(tz_offset);
  }
  if (row.updated) {
    info.updated = moment.unix(row.updated).utc().utcOffset(tz_offset);
  }
  
  info.id = row.id;
  info.name = row.name;
  info.lat = row.lat;
  info.lng = row.lon;
  info.url = row.url;
  info.raidPokemonId = row.raid_pokemon_id;
  if (info.raidPokemonId) {
    info.pokemon = utils.getPokemon(info.raidPokemonId);
  }
  info.team = row.team_id;
  switch (info.team) {
    case 1: info.teamName = 'mystic'; break;
    case 2: info.teamName = 'valor'; break;
    case 3: info.teamName = 'instinct'; break;
  }
  info.isEx = row.ex_raid_eligible;
  info.raidLevel = row.raid_level || 0;
  info.availSlots = row.availble_slots;
  info.raidMove1 = utils.getMove(row.raid_pokemon_move_1);
  info.raidMove2 = utils.getMove(row.raid_pokemon_move_2);
  info.id = row.id;

  return info;
};

function lvlToStars (lvl) {
  var r = '';
  var k = 1;
  while (k <= lvl) {
    r += ':star:';
    k += 1;
  }
  return r;
};
