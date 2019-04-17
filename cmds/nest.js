const minimister = require('./../minimister.js');
const osql = require('./../osql.js');
const utils = require('./../utils.js');
const colors = require('./../colors.js');
const moment = require('moment');
const templates = require('./../templates.js');
const pokemon = require('./../data/pokemon.json');

const stateManager = require('./../stateManager.js');
const reactionHandler = require('./../reactionHandler.js');

const nomin = require('./../nomin.js');

reactionHandler.addListener('nest_page_reaction', function (reaction, user) {
  //console.log('stop_page_reaction', 'wakeup')
  var userState = stateManager.getUserState(user.id, 'nest');
  if (reaction.message != userState.message) return;
  if (userState.userPick) {
    if (reaction.emoji.name === '➡') {
      // console.log('PAGE UP');
      userState.userPick += 1;
      if (userState.userPick > userState.maxPick) {
        userState.userPick = userState.maxPick;
        return;
      }
      stateManager.saveState('nest', user.id, userState);
      sendEmbed(reaction.message, user.id, userState.userPick, userState.searchTerm, true);
    }
    if (reaction.emoji.name === '⬅') {
      // console.log('PAGE DN');
      userState.userPick -= 1;
      if (userState.userPick < 1) {
        userState.userPick = 1;
        return;
      }
      stateManager.saveState('nest', user.id, userState);
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
        .setDescription(`Usage: \`${prefix}nest <poke name>\`\n\nWhen multiple results are found, pager reactions are provided.\nFor pager reaction to work multiple times, you need to remove it and put it back again`)
    });
    return;
  }
  var searchTerm = argv._.join('');
  var userPick = argv.p || 1;
  sendEmbed(message, message.author.id, userPick, searchTerm, false);
};

function sendEmbed (message, userId, userPick, searchTerm, isReaction) {
  //convert name to number
  var poke = pokeInfo(searchTerm);
  if (!poke) {
    message.channel.send({
      embed: utils.getEmbed().setColor(colors.warning)
        .setDescription(`Could not identify [${searchTerm}] as a pokemon o_O`)
    });
    return;
  }
  console.log('poke nest', poke.name)
  osql.connect('NEST');
  var sql = `SELECT * from nests where pokemon_id = ? order by updated desc limit 50`
  osql.query(sql, [ poke.id ])
  .then((response) => {
    if (!response.results.length) {
      message.channel.send({
        embed: utils.getEmbed().setColor(colors.warning)
          .setDescription(`No nests found for [${searchTerm}]`)
      });
      return;
    }
    if (userPick > response.results.length) userPick = response.results.length;
    var k = 0;
    var emb = utils.getEmbed();
    var lat = 0;
    var lng = 0;
    response.results.forEach((row) => {
      var nest = nestInfo(row);
      if (k === userPick-1) {
        emb.setColor(colors.success)
          .setTitle(poke.name)
          .setThumbnail(`https://img.pokemondb.net/sprites/omega-ruby-alpha-sapphire/dex/normal/${poke.name.toLowerCase()}.png`)
          ;
        lat = nest.lat;
        lng = nest.lng;
        var tz_offset = -6;

        var desc = templates.getTemplate('nest_default'); //.stops.default;
        desc = desc.replace(/#poke-name#/g, poke.name)
                   .replace(/#count#/g, nest.count)
                   .replace(/#types#/g, poke.types.join(' '))
                   .replace(/#lat#/g, nest.lat)
                   .replace(/#lng#/g, nest.lng)
                   .replace(/#updated#/g, moment.unix(nest.updated).utc().utcOffset(tz_offset))
                   ;
        emb.setDescription(desc);
      }
      k += 1;
    });

    nomin.reverse(lat, lng)
    .then((geo) => {

      var reverse = '';
      if (geo) {
        reverse = geo.display_name;
        if (geo.address && geo.address.city) {
          reverse = `**${geo.address.city}**\n` + reverse;
        }
        if (geo.address && geo.address.village) {
          reverse = `**${geo.address.village}**\n` + reverse;
        }
      }
      emb.description = emb.description.replace(/#reverse#/g, reverse);

      emb.setFooter(`..${userPick}/${response.results.length} nests found.`);
      var maptile = process.env.MAP_TILES.replace(/{lat}/g, lat).replace(/{lng}/g, lng);
      //console.log(maptile);
      emb.setImage(maptile);
      
      if (!isReaction) {
        message.channel.send({
          embed: emb
        })
        .then((msg) => {
          if (response.results.length > 1) {
            msg.react('⬅').catch();
            setTimeout(() => {
                msg.react('➡').catch();
            }, 400);
          }
          // create user state for reaction-time!
          stateManager.saveState('nest', message.author.id, {
            userPick: userPick,
            maxPick: response.results.length,
            searchTerm: searchTerm,
            message: msg
          });
        });
      } else {
        // isReaction
        var userState = stateManager.getUserState(userId, 'nest');
        userState.message.edit({ embed: emb });
      }
    });

  });
    
};

function pokeInfo (name) {
  var info = false;
  var maxdexnum = 721;
  var cidx = 0;
  while (!info) {
    cidx += 1;
    if (cidx > maxdexnum) break;
    if (pokemon[cidx+'']) {
      if (pokemon[cidx+''].name.toLowerCase().indexOf(name.toLowerCase()) >= 0) {
        info = pokemon[cidx+''];
        info.id = cidx;
      }
    }
  }
  return info;
};

function nestInfo (row) {
  var info = {
    id: row.nest_id,
    lat: row.lat,
    lng: row.lon,
    pokemonId: row.pokemon_id,
    updated: row.updated,
    type: row.type,
    submittedBy: row.nest_submitted_by || 'unk',
    count: row.pokemon_count
  };
  return info;
};

