import _typeof from '@babel/runtime/helpers/typeof';

/* jshint bitwise: false */

/*
 * UTF-8 encoder/decoder
 * http://www.webtoolkit.info/
 */
var UTF8 = {
  encode: function encode(s) {
    var utftext = '';

    for (var n = 0; n < s.length; n++) {
      var c = s.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode(c >> 6 | 192);
        utftext += String.fromCharCode(c & 63 | 128);
      } else {
        utftext += String.fromCharCode(c >> 12 | 224);
        utftext += String.fromCharCode(c >> 6 & 63 | 128);
        utftext += String.fromCharCode(c & 63 | 128);
      }
    }

    return utftext;
  },
  decode: function decode(utftext) {
    var s = '';
    var i = 0;
    var c = 0,
        c1 = 0,
        c2 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);

      if (c < 128) {
        s += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c1 = utftext.charCodeAt(i + 1);
        s += String.fromCharCode((c & 31) << 6 | c1 & 63);
        i += 2;
      } else {
        c1 = utftext.charCodeAt(i + 1);
        c2 = utftext.charCodeAt(i + 2);
        s += String.fromCharCode((c & 15) << 12 | (c1 & 63) << 6 | c2 & 63);
        i += 3;
      }
    }

    return s;
  }
};

/* jshint bitwise: false */
/*
 * Base64 encoder/decoder
 * http://www.webtoolkit.info/
 */

var Base64 = {
  _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  encode: function encode(input) {
    try {
      if (window.btoa && window.atob) {
        return window.btoa(unescape(encodeURIComponent(input)));
      }
    } catch (e) {//log(e);
    }

    return Base64._encode(input);
  },
  _encode: function _encode(input) {
    var output = '';
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = UTF8.encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = (chr1 & 3) << 4 | chr2 >> 4;
      enc3 = (chr2 & 15) << 2 | chr3 >> 6;
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output + Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) + Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
    }

    return output;
  },
  decode: function decode(input) {
    try {
      if (window.btoa && window.atob) {
        return decodeURIComponent(escape(window.atob(input)));
      }
    } catch (e) {//log(e);
    }

    return Base64._decode(input);
  },
  _decode: function _decode(input) {
    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    while (i < input.length) {
      enc1 = Base64._keyStr.indexOf(input.charAt(i++));
      enc2 = Base64._keyStr.indexOf(input.charAt(i++));
      enc3 = Base64._keyStr.indexOf(input.charAt(i++));
      enc4 = Base64._keyStr.indexOf(input.charAt(i++));
      chr1 = enc1 << 2 | enc2 >> 4;
      chr2 = (enc2 & 15) << 4 | enc3 >> 2;
      chr3 = (enc3 & 3) << 6 | enc4;
      output = output + String.fromCharCode(chr1);

      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }

      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
    }

    output = UTF8.decode(output);
    return output;
  }
};

// A URL safe variation on the the list of Base64 characters
var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

var base64Id = function base64Id() {
  var str = '';

  for (var i = 0; i < 22; ++i) {
    str += base64Chars.charAt(Math.floor(Math.random() * 64));
  }

  return str;
};

var get = function get(name) {
  try {
    var ca = document.cookie.split(';');
    var value = null;

    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(name) === 0) {
        value = c.substring(name.length, c.length);
        break;
      }
    }

    return value;
  } catch (e) {
    return null;
  }
};

var set = function set(name, value, opts) {
  var expires = value !== null ? opts.expirationDays : -1;

  if (expires) {
    var date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    expires = date;
  }

  var str = name + '=' + value;

  if (expires) {
    str += '; expires=' + expires.toUTCString();
  }

  str += '; path=/';

  if (opts.domain) {
    str += '; domain=' + opts.domain;
  }

  if (opts.secure) {
    str += '; Secure';
  }

  if (opts.sameSite) {
    str += '; SameSite=' + opts.sameSite;
  }

  document.cookie = str;
}; // test that cookies are enabled - navigator.cookiesEnabled yields false positives in IE, need to test directly


var areCookiesEnabled = function areCookiesEnabled() {
  var uid = String(new Date());

  try {
    var cookieName = 'rakam' + base64Id();
    set(cookieName, uid, {});

    var _areCookiesEnabled = get(cookieName + '=') === uid;

    set(cookieName, null, {});
    return _areCookiesEnabled;
  } catch (e) {}

  return false;
};

var baseCookie = {
  set: set,
  get: get,
  areCookiesEnabled: areCookiesEnabled
};

var getHost = function getHost(url) {
  var a = document.createElement('a');
  a.href = url;
  return a.hostname || location.hostname;
};

var topDomain = function topDomain(url) {
  var host = getHost(url);
  var parts = host.split('.');
  var levels = [];
  var cname = '_tldtest_' + base64Id();

  for (var i = parts.length - 2; i >= 0; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  for (var _i = 0; _i < levels.length; ++_i) {
    var domain = levels[_i];
    var opts = {
      domain: '.' + domain
    };
    baseCookie.set(cname, 1, opts);

    if (baseCookie.get(cname)) {
      baseCookie.set(cname, null, opts);
      return domain;
    }
  }

  return '';
};

/*
 * Cookie data
 */
var _options = {
  expirationDays: undefined,
  domain: undefined
};

var reset = function reset() {
  _options = {};
};

var options = function options(opts) {
  if (arguments.length === 0) {
    return _options;
  }

  opts = opts || {};
  _options.expirationDays = opts.expirationDays;
  var domain = opts.domain !== undefined ? opts.domain : '.' + topDomain(window.location.href);
  var token = Math.random();
  _options.domain = domain;
  set$1('rakam_test', token);
  var stored = get$1('rakam_test');

  if (!stored || stored !== token) {
    domain = null;
  }

  remove('rakam_test');
  _options.domain = domain;
};

var _domainSpecific = function _domainSpecific(name) {
  // differentiate between cookies on different domains
  var suffix = '';

  if (_options.domain) {
    suffix = _options.domain.charAt(0) === '.' ? _options.domain.substring(1) : _options.domain;
  }

  return name + suffix;
};

var get$1 = function get(name) {
  try {
    var nameEq = _domainSpecific(name) + '=';
    var ca = document.cookie.split(';');
    var value = null;

    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEq) === 0) {
        value = c.substring(nameEq.length, c.length);
        break;
      }
    }

    if (value) {
      return JSON.parse(Base64.decode(value));
    }

    return null;
  } catch (e) {
    return null;
  }
};

var set$1 = function set(name, value) {
  try {
    _set(_domainSpecific(name), Base64.encode(JSON.stringify(value)), _options);

    return true;
  } catch (e) {
    return false;
  }
};

var _set = function _set(name, value, opts) {
  var expires = value !== null ? opts.expirationDays : -1;

  if (expires) {
    var date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    expires = date;
  }

  var str = name + '=' + value;

  if (expires) {
    str += '; expires=' + expires.toUTCString();
  }

  str += '; path=/';

  if (opts.domain) {
    str += '; domain=' + opts.domain;
  }

  document.cookie = str;
};

var remove = function remove(name) {
  try {
    _set(_domainSpecific(name), null, _options);

    return true;
  } catch (e) {
    return false;
  }
};

var Cookie = {
  reset: reset,
  options: options,
  get: get$1,
  set: set$1,
  remove: remove
};

var getLanguage = function getLanguage() {
  return navigator && (navigator.languages && navigator.languages[0] || navigator.language || navigator.userLanguage) || undefined;
};

var language = {
  language: getLanguage()
};

/* jshint -W020, unused: false, noempty: false, boss: true */

/*
 * Implement localStorage to support Firefox 2-3 and IE 5-7
 */
var localStorage; // jshint ignore:line
// test that Window.localStorage is available and works

function windowLocalStorageAvailable() {
  var uid = new Date();
  var result;

  try {
    window.localStorage.setItem(uid, uid);
    result = window.localStorage.getItem(uid) === String(uid);
    window.localStorage.removeItem(uid);
    return result;
  } catch (e) {// localStorage not available
  }

  return false;
}

if (windowLocalStorageAvailable()) {
  localStorage = window.localStorage;
} else if (window.globalStorage) {
  // Firefox 2-3 use globalStorage
  // See https://developer.mozilla.org/en/dom/storage#globalStorage
  try {
    localStorage = window.globalStorage[window.location.hostname];
  } catch (e) {// Something bad happened...
  }
} else {
  // IE 5-7 use userData
  // See http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx
  var div = document.createElement('div'),
      attrKey = 'localStorage';
  div.style.display = 'none';
  document.getElementsByTagName('head')[0].appendChild(div);

  if (div.addBehavior) {
    div.addBehavior('#default#userdata');
    localStorage = {
      length: 0,
      setItem: function setItem(k, v) {
        div.load(attrKey);

        if (!div.getAttribute(k)) {
          this.length++;
        }

        div.setAttribute(k, v);
        div.save(attrKey);
      },
      getItem: function getItem(k) {
        div.load(attrKey);
        return div.getAttribute(k);
      },
      removeItem: function removeItem(k) {
        div.load(attrKey);

        if (div.getAttribute(k)) {
          this.length--;
        }

        div.removeAttribute(k);
        div.save(attrKey);
      },
      clear: function clear() {
        div.load(attrKey);
        var i = 0;
        var attr;

        while (attr = div.XMLDocument.documentElement.attributes[i++]) {
          div.removeAttribute(attr.name);
        }

        div.save(attrKey);
        this.length = 0;
      },
      key: function key(k) {
        div.load(attrKey);
        return div.XMLDocument.documentElement.attributes[k];
      }
    };
    div.load(attrKey);
    localStorage.length = div.XMLDocument.documentElement.attributes.length;
  }
}

if (!localStorage) {
  localStorage = {
    length: 0,
    setItem: function setItem(k, v) {},
    getItem: function getItem(k) {},
    removeItem: function removeItem(k) {},
    clear: function clear() {},
    key: function key(k) {}
  };
}

var localStorage$1 = localStorage;

var object = {};
var has = object.hasOwnProperty;
function merge(a, b) {
  for (var key in b) {
    if (has.call(b, key)) {
      a[key] = b[key];
    }
  }

  return a;
}

/*
 * Simple AJAX request object
 */
var Request = function Request(url, data, headers) {
  this.url = url;
  this.data = data || {};
  this.headers = headers || {};
};

function parseResponseHeaders(headerStr) {
  var headers = {};

  if (!headerStr) {
    return headers;
  }

  var headerPairs = headerStr.split("\r\n");

  for (var i = 0; i < headerPairs.length; i++) {
    var headerPair = headerPairs[i]; // Can't use split() here because it does the wrong thing
    // if the header value has the string ": " in it.

    var index = headerPair.indexOf(": ");

    if (index > 0) {
      var key = headerPair.substring(0, index);
      var val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }

  return headers;
}

Request.prototype.send = function (callback) {
  var isIE = window.XDomainRequest ? true : false;

  if (isIE) {
    var xdr = new window.XDomainRequest();
    xdr.open('POST', this.url, true);

    xdr.onload = function () {
      callback(xdr.responseText);
    };

    xdr.send(JSON.stringify(this.data));
  } else {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = "true";
    xhr.open('POST', this.url, true);

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        callback(xhr.status, xhr.responseText, parseResponseHeaders(xhr.getAllResponseHeaders()));
      }
    };

    xhr.setRequestHeader('Content-Type', 'text/plain');

    for (var key in this.headers) {
      if (this.headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, this.headers[key]);
      }
    }

    xhr.send(JSON.stringify(this.data));
  }
};

/* jshint bitwise: false, laxbreak: true */

/**
 * Taken straight from jed's gist: https://gist.github.com/982883
 *
 * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 * where each x is replaced with a random hexadecimal digit from 0 to f, and
 * y is replaced with a random hexadecimal digit from 8 to b.
 */
var uuid = function uuid(a) {
  return a // if the placeholder was passed, return
  ? ( // a random number from 0 to 15
  a ^ // unless b is 8,
  Math.random() // in which case
  * 16 // a random number from
  >> a / 4 // 8 to 11
  ).toString(16) // in hexadecimal
  : ( // or otherwise a concatenated string:
  [1e7] + // 10000000 +
  -1e3 + // -1000 +
  -4e3 + // -4000 +
  -8e3 + // -80000000 +
  -1e11 // -100000000000,
  ).replace( // replacing
  /[018]/g, // zeroes, ones, and eights with
  uuid // random hex digits
  );
};

var version = '2.6.0';

/* Taken from: https://github.com/component/type */

/**
 * toString ref.
 */
var toString = Object.prototype.toString;
/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

function type (val) {
  switch (toString.call(val)) {
    case '[object Date]':
      return 'date';

    case '[object RegExp]':
      return 'regexp';

    case '[object Arguments]':
      return 'arguments';

    case '[object Array]':
      return 'array';

    case '[object Error]':
      return 'error';
  }

  if (val === null) {
    return 'null';
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (val !== val) {
    return 'nan';
  }

  if (val && val.nodeType === 1) {
    return 'element';
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
    return 'buffer';
  }

  val = val.valueOf ? val.valueOf() : Object.prototype.valueOf.apply(val);
  return _typeof(val);
}

/*
 * Wrapper for a user properties JSON object that supports operations.
 * Note: if a user property is used in multiple operations on the same User object,
 * only the first operation will be saved, and the rest will be ignored.
 */

var API_VERSION = 1;

var wrapCallback = function wrapCallback(operation, props, callback) {
  return function (status, response, headers) {
    if (callback !== undefined) {
      callback(status, response, headers);
    }
  };
};

var getUrl = function getUrl(options) {
  return ('https:' === window.location.protocol ? 'https' : 'http') + '://' + options.apiEndpoint + "/user";
};

var User = function User() {};

User.prototype.init = function (options) {
  this.options = options;
};

User.prototype.set = function (properties, callback) {
  new Request(getUrl(this.options) + "/set_properties", {
    api: {
      "api_version": API_VERSION,
      "api_key": this.options.apiKey
    },
    id: this.options.userId,
    properties: properties
  }).send(wrapCallback("set_properties", properties, callback));
  return this;
};

User.prototype.setOnce = function (properties, callback) {
  new Request(getUrl(this.options) + "/set_properties_once", {
    api: {
      "api_version": API_VERSION,
      "api_key": this.options.apiKey
    },
    id: this.options.userId,
    properties: properties
  }).send(wrapCallback("set_properties_once", properties, callback));
  return this;
};

User.prototype.increment = function (property, value, callback) {
  new Request(getUrl(this.options) + "/increment_property", {
    api: {
      "api_version": API_VERSION,
      "api_key": this.options.apiKey
    },
    id: this.options.userId,
    property: property,
    value: value
  }).send(wrapCallback("increment_property", property + " by " + value, callback));
  return this;
};

User.prototype.unset = function (properties, callback) {
  new Request(getUrl(this.options) + "/unset_properties", {
    api: {
      "api_version": API_VERSION,
      "api_key": this.options.apiKey
    },
    id: this.options.userId,
    properties: type(properties) === "array" ? properties : [properties]
  }).send(wrapCallback("unset_properties", properties, callback));
  return this;
};

var API_VERSION$1 = 1;
var DEFAULT_OPTIONS = {
  apiEndpoint: 'api.getrakam.com',
  eventEndpointPath: '/event/batch',
  cookieExpiration: 365 * 10,
  cookieName: 'rakam_id',
  domain: undefined,
  includeUtm: false,
  trackForms: false,
  language: language.language,
  optOut: false,
  platform: 'Web',
  savedMaxCount: 1000,
  saveEvents: true,
  sessionTimeout: 30 * 60 * 1000,
  unsentKey: 'rakam_unsent',
  uploadBatchSize: 100,
  batchEvents: false,
  eventUploadThreshold: 30,
  eventUploadPeriodMillis: 30 * 1000,
  // 30s,
  useLocalStorageForSessionization: true
};
var StorageKeys = {
  LAST_ID: 'rakam_lastEventId',
  LAST_EVENT_TIME: 'rakam_lastEventTime',
  SESSION_ID: 'rakam_sessionId',
  RETURNING_SESSION: 'rakam_returning'
};

var getSessionItem = function getSessionItem(options, key) {
  if (options.useLocalStorageForSessionization) {
    return localStorage$1.getItem(key);
  } else {
    return Cookie.get(key);
  }
};

var setSessionItem = function setSessionItem(options, key, value) {
  if (options.useLocalStorageForSessionization) {
    localStorage$1.setItem(key, value);
  } else {
    Cookie.set(key, value);
  }
};
/*
 * Rakam API
 */


var Rakam = function Rakam() {
  this._unsentEvents = [];
  this.options = merge({}, DEFAULT_OPTIONS);
};

Rakam.prototype._eventId = 0;
Rakam.prototype._returningUser = false;
Rakam.prototype._sending = false;
Rakam.prototype._lastEventTime = null;
Rakam.prototype._sessionId = null;
Rakam.prototype._newSession = false;

Rakam.prototype.log = function (s) {
  if (this.options.debug === true) {
    console.log('[Rakam] ' + s);
  }
};
/**
 * Initializes Rakam.
 * apiKey The API Key for your app
 * opt_userId An identifier for this user
 * opt_config Configuration options
 *   - saveEvents (boolean) Whether to save events to local storage. Defaults to true.
 *   - includeUtm (boolean) Whether to send utm parameters with events. Defaults to false.
 */


Rakam.prototype.init = function (apiKey, opt_userId, opt_config, callback) {
  try {
    if (!apiKey) {
      throw new Error('apiKey is null');
    }

    this.options.apiKey = apiKey;
    var user = new User();
    user.init(this.options);

    this.User = function () {
      return user;
    };

    if (opt_config) {
      this.options.apiEndpoint = opt_config.apiEndpoint || this.options.apiEndpoint;
      this.options.debug = opt_config.debug || this.options.debug === true;

      if (opt_config.saveEvents !== undefined) {
        this.options.saveEvents = !!opt_config.saveEvents;
      }

      if (opt_config.domain !== undefined) {
        this.options.domain = opt_config.domain;
      }

      if (opt_config.includeUtm !== undefined) {
        this.options.includeUtm = !!opt_config.includeUtm;
      }

      if (opt_config.trackClicks !== undefined) {
        this.options.trackClicks = !!opt_config.trackClicks;
      }

      if (opt_config.trackForms !== undefined) {
        this.options.trackForms = !!opt_config.trackForms;
      }

      if (opt_config.batchEvents !== undefined) {
        this.options.batchEvents = !!opt_config.batchEvents;
      }

      this.options.platform = opt_config.platform || this.options.platform;
      this.options.useLocalStorageForSessionization = opt_config.useLocalStorageForSessionization || this.options.useLocalStorageForSessionization;
      this.options.language = opt_config.language || this.options.language;
      this.options.sessionTimeout = opt_config.sessionTimeout || this.options.sessionTimeout;
      this.options.uploadBatchSize = opt_config.uploadBatchSize || this.options.uploadBatchSize;
      this.options.eventUploadThreshold = opt_config.eventUploadThreshold || this.options.eventUploadThreshold;
      this.options.savedMaxCount = opt_config.savedMaxCount || this.options.savedMaxCount;
      this.options.eventUploadPeriodMillis = opt_config.eventUploadPeriodMillis || this.options.eventUploadPeriodMillis;
      this.options.superProperties = opt_config.superProperties || [];
    }

    Cookie.options({
      expirationDays: this.options.cookieExpiration,
      domain: this.options.domain
    });
    this.options.domain = Cookie.options().domain;

    _loadCookieData(this);

    if (opt_config && opt_config.deviceId !== undefined && opt_config.deviceId !== null && opt_config.deviceId || this.options.deviceId) {
      this.options.deviceId = this.options.deviceId;
    } else {
      this.deviceIdCreatedAt = new Date();
      this.options.deviceId = uuid();
    }

    _saveCookieData(this);

    this.log('initialized with apiKey=' + apiKey);

    if (this.options.saveEvents) {
      var savedUnsentEventsString = localStorage$1.getItem(this.options.unsentKey);

      if (savedUnsentEventsString) {
        try {
          this._unsentEvents = JSON.parse(savedUnsentEventsString);
        } catch (e) {
          this.log(e);
        }
      }
    }

    this._sendEventsIfReady();

    if (this.options.includeUtm) {
      this._initUtmData();
    }

    if (this.options.trackForms) {
      this._initTrackForms();
    }

    if (this.options.trackClicks) {
      this._initTrackClicks();
    }

    this._lastEventTime = parseInt(getSessionItem(this.options, StorageKeys.LAST_EVENT_TIME)) || null;
    this._sessionId = parseInt(getSessionItem(this.options, StorageKeys.SESSION_ID)) || null;
    this._eventId = localStorage$1.getItem(StorageKeys.LAST_ID) || 0;
    var now = new Date().getTime();

    if (!this._sessionId || !this._lastEventTime || now - this._lastEventTime > this.options.sessionTimeout) {
      if (this._sessionId !== null) {
        setSessionItem(this.options, StorageKeys.RETURNING_SESSION, true);
        this._returningUser = true;
      }

      this._sessionId = now;
      setSessionItem(this.options, StorageKeys.SESSION_ID, this._sessionId);
    } else {
      this._returningUser = getSessionItem(this.options, StorageKeys.RETURNING_SESSION) === 'true';
    }

    this._lastEventTime = now;
    setSessionItem(this.options, StorageKeys.LAST_EVENT_TIME, this._lastEventTime);
  } catch (e) {
    this.log(e);
  }

  this.setUserId(opt_userId);

  if (callback && typeof callback === 'function') {
    setTimeout(function () {
      callback();
    }, 1);
  }
};

Rakam.prototype.onEvent = function (callback) {
  this.options.eventCallbacks = this.options.eventCallbacks || [];
  this.options.eventCallbacks.push(callback);
};

var transformValue = function transformValue(_this, attribute, value, type) {
  if (type !== null) {
    type = type.toLowerCase();
  }

  if (type === 'long' || type === 'time' || type === 'timestamp' || type === 'date') {
    value = parseInt(value);

    if (isNaN(value) || !isFinite(value)) {
      _this.log('ignoring ' + attribute + ': the value must be a number');

      value = null;
    }
  } else if (type === 'double') {
    value = parseFloat(value);

    if (isNaN(value) || !isFinite(value)) {
      _this.log('ignoring ' + attribute + ': the value is not double');

      value = null;
    }
  } else if (type === 'boolean') {
    if (type === 'true' || type === '1') {
      value = true;
    } else if (type === 'false' || type === '0') {
      value = false;
    } else {
      _this.log('ignoring ' + attribute + ': the value is not boolean');

      value = null;
    }
  }

  return value;
};

Rakam.prototype.logInlinedEvent = function (collection, extraProperties, callback) {
  var getAllElementsWithAttribute = function getAllElementsWithAttribute(attribute) {
    if (document.querySelectorAll) {
      return document.querySelectorAll('[rakam-event-attribute]');
    }

    var matchingElements = [];
    var allElements = document.getElementsByTagName('*');

    for (var i = 0, n = allElements.length; i < n; i++) {
      if (allElements[i].getAttribute(attribute) !== null) {
        matchingElements.push(allElements[i]);
      }
    }

    return matchingElements;
  };

  var properties = extraProperties || {};
  var elements = getAllElementsWithAttribute('rakam-event-attribute');

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var attribute = element.getAttribute('rakam-event-attribute');
    var value = element.getAttribute('rakam-event-attribute-value');
    var type = element.getAttribute('rakam-event-attribute-type');

    if (value === null) {
      if (element.tagName === 'INPUT') {
        value = element.value;
      } else if (element.tagName === 'SELECT') {
        var option = element.options[element.selectedIndex];

        if (option.value !== null && option.value !== '') {
          var attr = element.getAttribute('rakam-attribute-value');

          if (attr !== 'value') {
            value = option.value;
          } else {
            value = option.text;
          }
        }
      } else if (element.innerText) {
        value = element.innerText.replace(/^\s+|\s+$/g, '');
      } else {
        this.log('Could find value of DOM element.', element);
      }
    }

    if (value !== null && value !== '') {
      properties[attribute] = transformValue(this, attribute, value, type);
    }
  }

  this.logEvent(collection, properties, callback);
};

Rakam.prototype.isReturningUser = function () {
  return this._returningUser;
};

Rakam.prototype.resetTimer = function () {
  console.log('[Rakam WARN] rakam.resetTimer function is removed from the API.');
};

Rakam.prototype.startTimer = function () {
  console.log('[Rakam WARN] rakam.startTimer function is removed from the API.');
};

Rakam.prototype.getTimeOnPage = function () {
  console.log('[Rakam WARN] rakam.getTimeOnPage function is removed from the API.');
};

Rakam.prototype.getTimeOnPreviousPage = function () {
  console.log('[Rakam WARN] rakam.getTimeOnPreviousPage function is removed from the API.');
};

Rakam.prototype.nextEventId = function () {
  this._eventId++;
  return this._eventId;
}; // returns true if sendEvents called immediately


Rakam.prototype._sendEventsIfReady = function (callback) {
  if (this._unsentEvents.length === 0) {
    return false;
  }

  if (!this.options.batchEvents) {
    this.sendEvents(callback);
    return true;
  }

  if (this._unsentEvents.length >= this.options.eventUploadThreshold) {
    this.sendEvents(callback);
    return true;
  }

  setTimeout(this.sendEvents.bind(this), this.options.eventUploadPeriodMillis);
  return false;
};

var _loadCookieData = function _loadCookieData(scope) {
  var cookieData = Cookie.get(scope.options.cookieName);

  if (cookieData) {
    if (cookieData.deviceId) {
      scope.options.deviceId = cookieData.deviceId;
    }

    if (cookieData.userId) {
      scope.options.userId = cookieData.userId;
    }

    if (cookieData.superProps) {
      scope.options.superProperties = cookieData.superProps;
    }

    if (cookieData.optOut !== undefined) {
      scope.options.optOut = cookieData.optOut;
    }

    if (cookieData.deviceIdCreatedAt !== undefined) {
      scope.deviceIdCreatedAt = new Date(parseInt(cookieData.deviceIdCreatedAt));
    }
  }
};

var _saveCookieData = function _saveCookieData(scope) {
  Cookie.set(scope.options.cookieName, {
    deviceId: scope.options.deviceId,
    deviceIdCreatedAt: scope.deviceIdCreatedAt ? scope.deviceIdCreatedAt.getTime() : undefined,
    userId: scope.options.userId,
    superProps: scope.options.superProperties,
    optOut: scope.options.optOut
  });
};

Rakam._getUtmParam = function (name, query) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(query);
  return results === null ? undefined : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

Rakam._getUtmData = function (rawCookie, query) {
  // Translate the utmz cookie format into url query string format.
  var cookie = rawCookie ? '?' + rawCookie.split('.').slice(-1)[0].replace(/\|/g, '&') : '';

  var fetchParam = function fetchParam(queryName, query, cookieName, cookie) {
    return Rakam._getUtmParam(queryName, query) || Rakam._getUtmParam(cookieName, cookie);
  };

  return {
    utm_source: fetchParam('utm_source', query, 'utmcsr', cookie),
    utm_medium: fetchParam('utm_medium', query, 'utmcmd', cookie),
    utm_campaign: fetchParam('utm_campaign', query, 'utmccn', cookie),
    utm_term: fetchParam('utm_term', query, 'utmctr', cookie),
    utm_content: fetchParam('utm_content', query, 'utmcct', cookie)
  };
};
/**
 * Parse the utm properties out of cookies and query for adding to user properties.
 */


Rakam.prototype._initUtmData = function (queryParams, cookieParams) {
  queryParams = queryParams || location.search;
  cookieParams = cookieParams || Cookie.get('__utmz');
  this._utmProperties = Rakam._getUtmData(cookieParams, queryParams);
};

Rakam.prototype._initTrackForms = function () {
  var _this = this;

  document.addEventListener('submit', function (event) {
    var targetElement = event.target || event.srcElement;
    var collection = targetElement.getAttribute('rakam-event-form');

    if (targetElement.tagName === 'FORM' && collection) {
      var properties = {};
      var extraAttributes = targetElement.getAttribute('rakam-event-extra');

      if (extraAttributes !== null) {
        for (var key in JSON.parse(extraAttributes)) {
          if (extraAttributes.hasOwnProperty(key)) {
            properties[key] = extraAttributes[key];
          }
        }
      }

      for (var i = 0; i < targetElement.elements.length; i++) {
        var element = targetElement.elements[i];
        var type = element.getAttribute('rakam-event-attribute-type');
        var formElemType;

        if (element.hasAttribute('type')) {
          formElemType = element.getAttribute('type').toLowerCase();
        }

        if (formElemType === 'password') {
          continue;
        }

        if (type === null && element.tagName === 'INPUT' && formElemType === 'number') {
          type = 'long';
        }

        if (element.hasAttribute('rakam-event-form-element-ignore')) {
          continue;
        }

        var attribute;

        if (element.hasAttribute('rakam-event-attribute')) {
          attribute = element.getAttribute('rakam-event-attribute');
        } else {
          attribute = element.getAttribute('name');
        }

        if (element.hasAttribute('rakam-event-attribute-value')) {
          properties[attribute] = transformValue(this, attribute, element.getAttribute('rakam-event-attribute-value'), type);
        } else if (element.tagName === 'SELECT') {
          properties[attribute] = transformValue(this, attribute, element.options[element.selectedIndex].value, type);
        } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          properties[attribute] = transformValue(this, attribute, element.value, type);
        } else {
          _this.log('Couldn\'t get value of form element: ' + attribute);
        }
      }

      _this.logEvent(collection, properties);
    }
  });
};

Rakam.prototype._initTrackClicks = function () {
  var _this = this;

  document.addEventListener('click', function (event) {
    var targetElement = event.target || event.srcElement;
    var collection = targetElement.getAttribute('rakam-event-track');

    if (targetElement.tagName === 'FORM' && collection) {
      var properties = {};
      var extraAttributes = targetElement.getAttribute('rakam-event-properties');

      if (extraAttributes !== null) {
        for (var key in JSON.parse(extraAttributes)) {
          if (extraAttributes.hasOwnProperty(key)) {
            properties[key] = extraAttributes[key];
          }
        }
      }

      _this.logEvent(collection, properties);
    }
  });
};

Rakam.prototype.saveEvents = function () {
  try {
    localStorage$1.setItem(this.options.unsentKey, JSON.stringify(this._unsentEvents));
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setDomain = function (domain) {
  try {
    Cookie.options({
      domain: domain
    });
    this.options.domain = Cookie.options().domain;

    _loadCookieData(this);

    _saveCookieData(this);

    this.log('set domain=' + domain);
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setUserId = function (userId) {
  try {
    this.options.userId = userId !== undefined && userId !== null && '' + userId || null;

    _saveCookieData(this);

    this.log('set userId=' + userId);
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setUserProperties = function (parameters) {
  try {
    return new this.User().set(parameters);
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.getUserId = function () {
  return this.options.userId;
};

Rakam.prototype.getDeviceId = function () {
  return this._eventId > 0 ? this.options.deviceId : null;
};

Rakam.prototype.setOptOut = function (enable) {
  try {
    this.options.optOut = enable;

    _saveCookieData(this);

    this.log('set optOut=' + enable);
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setDeviceId = function (deviceId) {
  try {
    if (deviceId) {
      this.options.deviceId = '' + deviceId;

      _saveCookieData(this);
    }
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setSuperProperties = function (eventProps, opt_replace) {
  try {
    this.options.superProperties = this.options.superProperties || {};

    for (var property in eventProps) {
      if (eventProps.hasOwnProperty(property)) {
        if (opt_replace === false && this.options.superProperties[property] !== undefined) {
          continue;
        }

        this.options.superProperties[property] = eventProps[property];
      }
    }

    _saveCookieData(this);

    this.log('set super properties=' + JSON.stringify(eventProps));
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.setVersionName = function (versionName) {
  try {
    this.options.versionName = versionName;
    this.log('set versionName=' + versionName);
  } catch (e) {
    this.log(e);
  }
};
/**
 * Private logEvent method. Keeps apiProperties from being publicly exposed.
 */


Rakam.prototype._logEvent = function (eventType, eventProperties, apiProperties, callback) {
  if (typeof callback !== 'function') {
    callback = null;
  }

  if (!eventType || this.options.optOut) {
    if (callback) {
      callback(0, 'No request sent');
    }

    return;
  }

  try {
    var eventTime = new Date().getTime();
    var eventId = this.nextEventId();

    if (!this._sessionId || !this._lastEventTime || eventTime - this._lastEventTime > this.options.sessionTimeout) {
      this._sessionId = eventTime;
      setSessionItem(this.options, StorageKeys.SESSION_ID, this._sessionId);
    }

    this._lastEventTime = eventTime;
    setSessionItem(this.options, StorageKeys.LAST_EVENT_TIME, this._lastEventTime);
    setSessionItem(this.options, StorageKeys.LAST_ID, eventId);
    apiProperties = apiProperties || {};
    eventProperties = eventProperties || {}; // Add the utm properties, if any, onto the event properties.

    merge(eventProperties, this._utmProperties);
    var event = {
      collection: eventType,
      properties: {
        _device_id: this.options.deviceId,
        _user: this.options.userId,
        // use seconds
        _time: parseInt(eventTime / 1000) * 1000,
        _session_id: this._sessionId || -1,
        _platform: this.options.platform,
        _language: this.options.language
      }
    };
    merge(event.properties, this.options.superProperties);
    merge(event.properties, apiProperties);
    merge(event.properties, eventProperties);
    this.log('logged eventType=' + eventType + ', properties=' + JSON.stringify(eventProperties));

    this._unsentEvents.push({
      id: eventId,
      event: event
    }); // Remove old events from the beginning of the array if too many
    // have accumulated. Don't want to kill memory. Default is 1000 events.


    if (this._unsentEvents.length > this.options.savedMaxCount) {
      this._unsentEvents.splice(0, this._unsentEvents.length - this.options.savedMaxCount);
    }

    if (this.options.saveEvents) {
      this.saveEvents();
    }

    if (!this._sendEventsIfReady(callback) && callback) {
      callback(0, 'No request sent');
    }

    return eventId;
  } catch (e) {
    this.log(e);
  }
};

Rakam.prototype.logEvent = function (eventType, eventProperties, callback) {
  return this._logEvent(eventType, eventProperties, null, callback);
};
/**
 * Remove events in storage with event ids up to and including maxEventId. Does
 * a true filter in case events get out of order or old events are removed.
 */


Rakam.prototype.removeEvents = function (maxEventId, errors) {
  var filteredEvents = [];
  var errorList = errors || [];

  for (var i = 0; i < this._unsentEvents.length; i++) {
    var id = this._unsentEvents[i].id;

    if (errorList.indexOf(id) > -1 || id > maxEventId) {
      filteredEvents.push(this._unsentEvents[i]);
    }
  }

  this._unsentEvents = filteredEvents;
};

Rakam.prototype.sendEvents = function (callback) {
  var _this = this;

  if (!this._sending && !this.options.optOut && this._unsentEvents.length > 0) {
    this._sending = true;
    var url = ('https:' === window.location.protocol ? 'https' : 'http') + '://' + this.options.apiEndpoint + this.options.eventEndpointPath; // Determine how many events to send and track the maximum event id sent in this batch.

    var numEvents = Math.min(this._unsentEvents.length, this.options.uploadBatchSize);
    var maxEventId = this._unsentEvents[numEvents - 1].id;

    this._unsentEvents.slice(0, numEvents);

    var events = this._unsentEvents.slice(0, numEvents).map(function (e) {
      return e.event;
    });

    var upload_time = new Date().getTime();
    var api = {
      'upload_time': upload_time,
      'api_version': API_VERSION$1,
      'api_key': this.options.apiKey //"checksum": md5(API_VERSION + JSON.stringify(events) + upload_time).toUpperCase()

    };
    var scope = this;
    new Request(url, {
      api: api,
      events: events
    }).send(function (status, response, headers) {
      scope._sending = false;

      try {
        if (status === 200 || status === 409) {
          _this.log('successful upload');

          scope.removeEvents(maxEventId, status === 409 ? JSON.parse(response) : null); // Update the event cache after the removal of sent events.

          if (scope.options.saveEvents) {
            scope.saveEvents();
          } // Send more events if any queued during previous send.


          if (!scope._sendEventsIfReady(callback) && callback) {
            callback(status, response);
          }
        } else if (status === 413) {
          _this.log('request too large'); // Can't even get this one massive event through. Drop it.


          if (scope.options.uploadBatchSize === 1) {
            scope.removeEvents(maxEventId);
          } // The server complained about the length of the request.
          // Backoff and try again.


          scope.options.uploadBatchSize = Math.ceil(numEvents / 2);
          scope.sendEvents(callback);
        } else if (callback) {
          // If server turns something like a 400
          callback(status, response);
        }
      } catch (e) {
        _this.log('failed upload');
      }

      if (scope.options.eventCallbacks) {
        try {
          for (var i = 0; i < scope.options.eventCallbacks.length; i++) {
            scope.options.eventCallbacks[i](status, response, headers);
          }
        } catch (e) {
          _this.log('callback throws an exception', e);
        }
      }
    });
  } else if (callback) {
    callback(0, 'No request sent');
  }
};

Rakam.prototype.onload = function (callback) {
  var _this = this;

  setTimeout(function () {
    callback();

    _this.log('executed callback', callback);
  }, 1);
};

Rakam.prototype.runQueuedFunctions = function () {
  for (var i = 0; i < this._q.length; i++) {
    var fn = this[this._q[i][0]];

    if (fn && type(fn) === 'function') {
      fn.apply(this, this._q[i].slice(1));
    }
  }

  this._q = []; // clear function queue after running
};

Rakam.prototype.__VERSION__ = version;

/* jshint expr:true */
var old = window.rakam || {};
var instance = new Rakam();
instance._q = old._q || []; // export the instance

export default instance;
