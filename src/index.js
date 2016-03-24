/* jshint expr:true */

var Rakam = require('./rakam');

var old = window.rakam || {};
var instance = new Rakam();
instance._q = old._q || [];

// export the instance
module.exports = instance;