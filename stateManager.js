/* singleton */
var stateManager = {
  bag: {},
  getUserState: function (uid, name) {
    if (this.bag[name+uid]) {
      return this.bag[name+uid];
    } else {
      this.bag[name+uid] = {};
      return {};
    }
  },
  getState: function (message, name) {
    var uid = message.author.id;
    if (this.bag[name+uid]) {
      return this.bag[name+uid];
    } else {
      this.bag[name+uid] = {};
      return {};
    }
  },
  saveState: function (name, userId, state) {
    this.bag[name+userId] = state;
  },
  hasState: function (message, name) {
    return this.bag[name+message.author.id];
  }
};

module.exports = stateManager;
