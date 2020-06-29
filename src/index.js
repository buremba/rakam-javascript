/* jshint expr:true */

import Rakam from './rakam';

var old = window.rakam || {};
var instance = new Rakam();
instance._q = old._q || [];

// export the instance
export default instance;
