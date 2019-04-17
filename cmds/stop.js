const minimister = require('./../minimister.js');
const osql = require('./../osql.js');
const utils = require('./../utils.js');
const colors = require('./../colors.js');
const moment = require('moment');
const templates = require('./../templates.js');

const stateManager = require('./../stateManager.js');
const reactionHandler = require('./../reactionHandler.js');

const nomin = require('./../nomin.js');

reactionHandler.addListener('stop_page_reaction', function (reaction, user) {
  //console.log('stop_page_reaction', 'wakeup')
  var userState = stateManager.getUserState(user.id, 'stop');
  if (reaction.message != userState.message) return;
  if (userState.userPick) {
    if (reaction.emoji.name === '➡') {
      // console.log('PAGE UP');
      userState.userPick += 1;
      if (userState.userPick > userState.maxPick) {
        userState.userPick = userState.maxPick;
        return;
      }
      stateManager.saveState('stop', user.id, userState);
      sendEmbed(reaction.message, user.id, userState.userPick, userState.searchTerm, true);
    }
    if (reaction.emoji.name === '⬅') {
      // console.log('PAGE DN');
      userState.userPick -= 1;
      if (userState.userPick < 1) {
        userState.userPick = 1;
        return;
      }
      stateManager.saveState('stop', user.id, userState);
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
        .setDescription(`Usage: \`${prefix}stop <stop name>\`\n\nWhen multiple results are found, pager reactions are provided.\nFor pager reaction to work multiple times, you need to remove it and put it back again`)
    });
    return;
  }
  var searchTerm = argv._.join('');
  var userPick = argv.p || 1;
  sendEmbed(message, message.author.id, userPick, searchTerm, false);
};

function sendEmbed (message, userId, userPick, searchTerm, isReaction) {
  osql.connect();
  var sql = `SELECT * from pokestop where replace(name, ' ', '') like ? order by id limit 25`
  osql.query(sql, [ `%${searchTerm}%` ])
  .then((response) => {
    if (!response.results.length) {
      message.channel.send({
        embed: utils.getEmbed().setColor(colors.warning)
          .setDescription(`No pokestops found [${searchTerm}]`)
      });
      return;
    }
    if (userPick > response.results.length) userPick = response.results.length;
    var k = 0;
    var emb = utils.getEmbed();
    var lat = 0;
    var lng = 0;
    var stopid = '';
    response.results.forEach((row) => {
      var stop = stopInfo(row);
      if (k === userPick-1) {
        emb.setColor(colors.success)
          .setTitle(stop.name)
          .setThumbnail(stop.url)
          ;
        lat = stop.lat;
        lng = stop.lng;
        stopid = stop.id;

        var desc = templates.getTemplate('stop_default'); //.stops.default;
        desc = desc.replace(/#template#/g, stop.quest.template)
                   .replace(/#pokemonId#/g, stop.quest.pokemonId)
                   .replace(/#itemId#/g, utils.getEnValue('item_' + stop.quest.itemId))
                   //.replace(/#type#/g, stop.quest.rewards.length ? stop.quest.rewards[0].type)
                   .replace(/#target#/g, stop.quest.target)
                   .replace(/#infos#/g, JSON.stringify(stop.quest.rewards) + '\n' + JSON.stringify(stop.quest.conditions))
                   .replace(/#lat#/g, stop.lat)
                   .replace(/#lng#/g, stop.lng)
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

      emb.setFooter(`..${userPick}/${response.results.length} stops found.`);
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
          stateManager.saveState('stop', message.author.id, {
            userPick: userPick,
            maxPick: response.results.length,
            searchTerm: searchTerm,
            message: msg
          });
        });
      } else {
        // isReaction
        var userState = stateManager.getUserState(userId, 'stop');
        userState.message.edit({ embed: emb });
      }

    });

  });
};

function stopInfo (row) {
  var tz_offset = -6;
  var info = {
    id: row.id,
    name: 'unk',
    url: '',
    lat: 0,
    lng: 0,
    updated: moment('2011-01-01'),
    quest: {
      type: 0,
      target: 0,
      conditions: '',
      rewards: '',
      template: '',
      pokemonId: 0,
      rewardType: 0,
      itemId: 0
    }
  };
  info.name = row.name;
  info.url = row.url;
  info.lat = row.lat;
  info.lng = row.lon;
  info.updated = moment.unix(row.updated).utc().utcOffset(tz_offset);
  info.enabled = row.enabled;
  info.quest.type = row.quest_type;
  info.quest.target = row.quest_target;
  info.quest.conditions = row.quest_conditions ? JSON.parse(row.quest_conditions) : false;
  info.quest.rewards = row.quest_rewards ? JSON.parse(row.quest_rewards) : false;
  info.quest.template = row.quest_template;
  info.quest.pokemonId = row.quest_pokemon_id;
  info.quest.rewardType = row.quest_reward_type;
  info.quest.itemId = row.quest_item_id;

  return info;
};
