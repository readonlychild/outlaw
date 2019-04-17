const minimister = require('./minimister.js');
const utils = require('./utils.js');
const colors = require('./colors.js');

var a = 'collector -t my-tag -g --global -s 2018-10-01';
var args = a.split(' ');
var argv = minimister(args);
console.log(JSON.stringify(argv, null, 2));

console.log(argv.val(['start', 's'], 'default'));
console.log(argv.val(['end', 'e'], 'today'));