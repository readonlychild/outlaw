require('dotenv').config({ path: './.env' });

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const reactionHandler = require('./reactionHandler.js');

const utils = require('./utils.js');
const colors = require('./colors.js');
const moment = require('moment');

//const guildManager = require('./../guildManager.js');
//var stateManager = require('./../stateManager.js');
var aliases = require('./_aliases.js');

var token = process.env.BOT_TOKEN;
var botprefix = process.env.BOT_PREFIX;

// This loop reads the /events/ folder and attaches each event file to the appropriate event.
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    // super-secret recipe to call events with all their proper arguments *after* the `client` var.
    client.on(eventName, (...args) => eventFunction.run(client, ...args));
  });
});

client.on("message", message => {
  if (message.author.bot) return;
  
  var prefix = botprefix;
  
  //mention response:
  var prefixMention = new RegExp(`^<@!?${client.user.id}>`);
  if (message.content.match(prefixMention)) {
    message.channel.send({
      embed: utils.getEmbed().setColor(colors.primary).setDescription(`Prefix on [${message.guild.name}] is \`${prefix}\`\n\n\`${prefix}help\` will get you started!`)
    });
    return;
  }

  if (message.content.toLowerCase().indexOf(prefix) === 0) {

    // This is the best way to define args. Trust me.
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    var command = args.shift().toLowerCase();
    if (command.indexOf('/') >= 0) {
      message.channel.send(`${colors.ic_boom} [slash] not permitted in command.`);
      return;
    }

    if (aliases[command]) command = aliases[command];

    try {
      let commandFile = require(`./cmds/${command}.js`);
      console.log(`:) [${message.guild.name}][${message.author.username}][${command}]; ${message.content}`);
      commandFile.run(client, message, args);
    } catch (err) {
      console.log(`--404 command: [${message.author.username}] from [${message.guild.name}] tried [${command}]; ${message.content}`);
      console.error(' ^^ ' + err.message);
    }
  } // end prefix'd commands

});

client.on('messageReactionAdd', (reaction, user) => {
  // reaction.me to see if this "button" was placed by the bot
  // reaction.message[.channel]
  // reaction.name
  // console.log('name=', reaction._emoji.name);
  // console.log(reaction);
  // reaction.message.channel.send(reaction.emoji.name);
  // console.log(user);
  //commands.handleReaction(reaction, user);
  reactionHandler.handle(reaction, user);
});

client.login(token);
