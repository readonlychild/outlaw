const minimister = require('./../minimister.js');
const utils = require('./../utils.js');
const colors = require('./../colors.js');

exports.run = (client, message, args) => {
  var prefix = process.env.BOT_PREFIX;
  var argv = minimister(args);

  message.channel.send({
    embed: utils.getEmbed()
      .setColor(colors.info)
      .setDescription(`Some commands:

:small_blue_diamond:\`${prefix}gym\`
:small_blue_diamond:\`${prefix}stop\`
:small_blue_diamond:\`${prefix}nest\`
`)
  });
};
