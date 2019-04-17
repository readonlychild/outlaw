const fs = require('fs');

var templates = {
  getTemplate: function (name) {
    if (!fs.existsSync(`./tpls/${name}.tpl`)) {
      return `404 - tpl [${name}] does not exist.`;
    }
    return fs.readFileSync(`./tpls/${name}.tpl`, 'utf8');
  }
};

module.exports = templates;
