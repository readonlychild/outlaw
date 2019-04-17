const minimister = require('./../minimister.js');
const utils = require('./../utils.js');
const colors = require('./../colors.js');

exports.run = (client, message, args) => {
  var argv = minimister(args);
  message.channel.send({
    embed: utils.getEmbed()
      .setColor(colors.secondary)
      .setDescription('```' + JSON.stringify(argv, null, 2) + '```')
  });
};
