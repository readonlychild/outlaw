const colors = require('./colors.js');
const moment = require('moment');
//const fs = require('fs');

const moves = require('./data/moves.json');
const pokemon = require('./data/pokemon.json');
const en = require('./data/en.json');

var utils = {
  _dayStamp: function (dayDiff, hourDiff) {
    var m = new moment();
    dayDiff = dayDiff || 0;
    hourDiff = hourDiff || 0;
    m.add(dayDiff, 'days');
    m.add(hourDiff, 'h');
    return m.format('YYYY-MM-DD');
  },
  _timeStamp: function (dayDiff, hourDiff) {
    var m = new moment();
    dayDiff = dayDiff || 0;
    hourDiff = hourDiff || 0;
    m.add(dayDiff, 'days');
    m.add(hourDiff, 'h');
    return m.format('hh:mma');
  },
  getPokeImageUrl: function (id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other-sprites/official-artwork/${id}.png`;
  },
  random: function (min, maxInclusive) {
    var n = Math.round(Math.random() * (maxInclusive - min)) + min;
    console.log(`utils.random(${min},${maxInclusive})`, n);
    return n;
  },
  randomElement: function (ary) {
    var len = ary.length;
    var rnd = Math.floor(Math.random() * len);
    return ary[rnd];
  },
  shuffleArray: function (ary) {
    var currentIndex = ary.length;
    var temporaryValue;
    var randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = ary[currentIndex];
      ary[currentIndex] = ary[randomIndex];
      ary[randomIndex] = temporaryValue;
    }
    return ary;
  },
  min: function (ary) {
    if (ary.length < 1) {
      return null;
    }
    var m = ary[0];
    ary.forEach((v) => {
      if (v < m) m = v;
    });
    return m;
  },
  max: function (ary) {
    if (ary.length < 1) {
      return null;
    }
    var m = ary[0];
    ary.forEach((v) => {
      if (v > m) m = v;
    });
    return m;
  },
  aryPick: function (ary, k) {
    // picks position k from ary, if k is >= ary.length, then it cycles
    if (ary.length < k) {
      return ary[k];
    }
    if (ary.length === k) return ary[0];
    var k2 = k % ary.length;
    return ary[k2];
  },
  isTrue: function (val) {
    var v = val.toString().toLowerCase();
    if (v === 'yes') return true;
    if (v === '1') return true;
    if (v === 'true') return true;
    if (v === 'y') return true;
    if (v === 'on') return true; // as in not off
    return false;
  },
  pad: function (n, len, z, trunc) {
    z = z || '0';
    n = n + '';
    if (trunc && n.length > len) n = n.substring(0, len);
    return n.length >= len ? n : new Array(len - n.length + 1).join(z) + n;
  },
  rpad: function (n, len, z, trunc) {
    z = z || '0';
    n = n + '';
    if (trunc && n.length > len) n = n.substring(0, len);
    return n.length >= len ? n : n + new Array(len - n.length + 1).join(z);
  },
  spaces: function (num) {
    var s = '';
    for (var i = 0; i < num; i++) {
      s += ' ';
    }
    return s;
  },
  titleCase: function (str) {
    return str.toLowerCase().split(' ').map(function(word) {
      return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
  },
  getEmbed: function () {
    var e = {};
    e.setTitle = function (title) {
      e.title = title;
      return e;
    };
    e.setAuthor = function (author, icon) {
      e.author = {};
      e.author.name = author;
      if (icon) e.author.icon_url = icon;
      return e;
    }
    e.setDescription = function (description) {
      e.description = description;
      return e;
    };
    e.setThumbnail = function (url) {
      e.thumbnail = { url: url };
      return e;
    };
    e.setImage = function (url) {
      e.image = { url: url };
      return e;
    };
    e.setUrl = function (url) {
      e.url = url;
      return e;
    };
    e.addField = function (name, value, inline) {
      e.fields = e.fields || [];
      inline = inline || false;
      e.fields.push({ name: name, value: value, inline: inline });
      return e;
    };
    e.setColor = function (color) {
      e.color = color;
      return e;
    };
    e.setFooter = function (footer, icon) {
      e.footer = {};
      e.footer.text = footer;
      if (icon) e.footer.icon_url = icon;
      return e; 
    };
    e.stamp = function () {
      e.timestamp = new Date();
      return e;
    };
    return e;
  },
  getFirstMentionId: function (message) {
    if (message.mentions.users) {
      var k = 0;
      var uid = false;
      message.mentions.users.forEach((u) => {
        if (!k) {
          uid = u.id;
        }
        k += 1;
      });
      return uid;
    }
    return false;
  },
  getAllMentionId: function (message) {
    var list = [];
    if (message.mentions.users) {
      var k = 0;
      var uid = false;
      message.mentions.users.forEach((u) => {
        //if (!k) {
          console.log('MENTION', u.username, u.id);
          list.push({ id: u.id, username: u.username });
        //}
        k += 1;
      });
      return list;
    }
    return list;
  },
  getFirstMentionUser: function (message) {
    if (message.mentions.users) {
      var k = 0;
      var usr = false;
      message.mentions.users.forEach((u) => {
        if (!k) {
          usr = u;
        }
        k += 1;
      });
      return usr;
    }
    return false;
  },
  io: {
    putInTempFile: function (content, millis) {
      var tmpFilename = `./tmp/${shortid.generate()}.tmp`;
      fs.writeFileSync(tmpFilename, content);
      setTimeout(function () {
        try {
          fs.unlink(tmpFilename);
        } catch (ex) {
          console.log('TEMP FILE UNLINK', ex.message);
        }
      }, millis);
      return tmpFilename;
    }
  },
  getArgValue: function (args, argName, defValue) {
    defValue = defValue || '';
    var v = defValue;
    args.forEach((a) => {
      if (a.toLowerCase().startsWith(argName.toLowerCase())) {
        var rex = new RegExp(argName.toString() + ':', 'gi');
        v = a.replace(rex, '');
      }
    });
    return v;
  },
  validators: {
    isNumber: function (value) {
      return !isNaN(parseFloat(value));
    },
    isInteger: function (value) {
      var b = !isNaN(parseInt(value));
      if (!b) return false;
      return value % 1 === 0;
    }
  },
  getMove: function (no) {
    if (!no) return false;
    if (moves[no]) {
      return moves[no];
    } else {
      return false;
    }
  },
  getPokemon: function (no) {
    if (!no) return false;
    if (pokemon[no]) {
      return pokemon[no];
    } else {
      return false;
    }
  },
  getEnValue: function (key) {
    if (!key) return false;
    if (en.values[key]) {
      return en.values[key];
    } else {
      return false;
    }
  }
};

module.exports = utils;
