const minimist = require('./minimist.js');

module.exports = function (args, opts) {
  
  // re-parse for multi word args
  var reworkedArgs = [];
  var currargs = '';
  args.forEach((a) => {
    if (a.startsWith('--') || a.startsWith('-')) {
      if (currargs.length > 0) {
        reworkedArgs.push(currargs);
        currargs = '';
      }
      reworkedArgs.push(a);
    } else {
      if (currargs.length > 0) currargs += ' ';
      currargs += a;
    }
  });
  if (currargs.length > 0) reworkedArgs.push(currargs);
  
  var r = minimist(reworkedArgs);

  r.val = function (argAry, defaultVal) {
    var v = defaultVal || false;
    var set = false;
    argAry.forEach((a) => {
      if (!set && this[a]) {
        v = this[a];
        set = true;
      } 
    });
    return v;
  }

  return r;
};
