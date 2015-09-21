/* jshint expr:true */

var Rakam = require('./rakam');

var old = window.rakam || {};
var q = old._q || [];
var instance = new Rakam();

// Apply the queued commands
for (var i = 0; i < q.length; i++) {
    var fn = instance[q[i][0]];
    fn && fn.apply(instance, q[i].slice(1));
}

// export the instance
module.exports = instance;
