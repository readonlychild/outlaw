const stateManager = require('./stateManager.js');

var reactionHandler = {
  listeners: {}, 
  addListener: function (id, handler /*(reaction, user)=>{}*/) {
    console.log('adding', id);
    if (!this.listeners[id]) {
      this.listeners[id] = handler;
    }
  },
  handle: function (reaction, user) {
    //console.log(this.listeners);
    var lstnrs = getAllMethods(this.listeners);
    lstnrs.forEach((lname) => {
      this.listeners[lname](reaction, user);
    });
  }
};

function getAllMethods (obj) {
  return Object.getOwnPropertyNames(obj).filter(function (prop) {
    return typeof obj[prop] == 'function';
  });
};

module.exports = reactionHandler;
