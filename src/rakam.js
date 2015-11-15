var Cookie = require('./cookie');
var JSON = require('json'); // jshint ignore:line
var language = require('./language');
var localStorage = require('./localstorage');  // jshint ignore:line
var md5 = require('JavaScript-MD5');
var object = require('object');
var Request = require('./xhr');
var UUID = require('./uuid');
var version = require('./version');
var ifvisible = require('../node_modules/ifvisible.js/src/ifvisible.min.js');

var log = function (s) {
    console.log('[Rakam] ' + s);
};

var indexOf;
if (!Array.prototype.indexOf) {
    indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    };
} else {
    indexOf = Array.prototype.indexOf;
}

var API_VERSION = 1;
var DEFAULT_OPTIONS = {
    apiEndpoint: 'api.rakam.com',
    apiEndpointPath: '/event/batch',
    write_key: undefined,
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
    eventUploadPeriodMillis: 30 * 1000 // 30s
};
var LocalStorageKeys = {
    LAST_id: 'rakam_lastEventId',
    LAST_EVENT_TIME: 'rakam_lastEventTime',
    SESSION_ID: 'rakam_sessionId',
    RETURNING_SESSION: 'rakam_returning'
};

/*
 * Rakam API
 */
var Rakam = function () {
    this._unsentEvents = [];
    this.options = object.merge({}, DEFAULT_OPTIONS);
};


Rakam.prototype._eventId = 0;
Rakam.prototype._returningUser = false;
Rakam.prototype._sending = false;
Rakam.prototype._lastEventTime = null;
Rakam.prototype._sessionId = null;
Rakam.prototype._newSession = false;

/**
 * Initializes Rakam.
 * apiKey The API Key for your app
 * opt_userId An identifier for this user
 * opt_config Configuration options
 *   - saveEvents (boolean) Whether to save events to local storage. Defaults to true.
 *   - includeUtm (boolean) Whether to send utm parameters with events. Defaults to false.
 *   - includeReferrer (boolean) Whether to send referrer info with events. Defaults to false.
 */
Rakam.prototype.init = function (apiKey, opt_userId, opt_config, callback) {
    try {
        if (!apiKey) {
            throw new Error("apiKey is null");
        }
        this.options.apiKey = apiKey;
        if (opt_config) {
            this.options.apiEndpoint = opt_config.apiEndpoint || this.options.apiEndpoint;

            if (opt_config.saveEvents !== undefined) {
                this.options.saveEvents = !!opt_config.saveEvents;
            }
            if (opt_config.write_key !== undefined) {
                this.options.write_key = opt_config.write_key;
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
            if (opt_config.includeReferrer !== undefined) {
                this.options.includeReferrer = !!opt_config.includeReferrer;
            }
            if (opt_config.batchEvents !== undefined) {
                this.options.batchEvents = !!opt_config.batchEvents;
            }
            this.options.platform = opt_config.platform || this.options.platform;
            this.options.language = opt_config.language || this.options.language;
            this.options.sessionTimeout = opt_config.sessionTimeout || this.options.sessionTimeout;
            this.options.uploadBatchSize = opt_config.uploadBatchSize || this.options.uploadBatchSize;
            this.options.eventUploadThreshold = opt_config.eventUploadThreshold || this.options.eventUploadThreshold;
            this.options.savedMaxCount = opt_config.savedMaxCount || this.options.savedMaxCount;
            this.options.eventUploadPeriodMillis = opt_config.eventUploadPeriodMillis || this.options.eventUploadPeriodMillis;
            this.options.userPropertiesForEvent = opt_config.userPropertiesForEvent || [];
        }

        Cookie.options({
            expirationDays: this.options.cookieExpiration,
            domain: this.options.domain
        });
        this.options.domain = Cookie.options().domain;

        _loadCookieData(this);

        this.options.deviceId = (opt_config && opt_config.deviceId !== undefined &&
        opt_config.deviceId !== null && opt_config.deviceId) ||
        this.options.deviceId || UUID();
        this.options.userId = (opt_userId !== undefined && opt_userId !== null && opt_userId) || this.options.userId || null;
        _saveCookieData(this);

        log('initialized with apiKey=' + apiKey);
        //opt_userId !== undefined && opt_userId !== null && log('initialized with userId=' + opt_userId);

        if (this.options.saveEvents) {
            var savedUnsentEventsString = localStorage.getItem(this.options.unsentKey);
            if (savedUnsentEventsString) {
                try {
                    this._unsentEvents = JSON.parse(savedUnsentEventsString);
                } catch (e) {
                    log(e);
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

        this._lastEventTime = parseInt(localStorage.getItem(LocalStorageKeys.LAST_EVENT_TIME)) || null;
        this._sessionId = parseInt(localStorage.getItem(LocalStorageKeys.SESSION_ID)) || null;
        this._eventId = localStorage.getItem(LocalStorageKeys.LAST_id) || 0;
        var now = new Date().getTime();
        if (!this._sessionId || !this._lastEventTime || now - this._lastEventTime > this.options.sessionTimeout) {
            if(this._sessionId !== null || this.options.userId !==null) {
                localStorage.setItem(LocalStorageKeys.RETURNING_SESSION, true);
                this._returningUser = true;
            }
            this._sessionId = now;
            Cookie.remove('_rakam_time');
            localStorage.setItem(LocalStorageKeys.SESSION_ID, this._sessionId);
        } else {
            this._returningUser = localStorage.getItem(LocalStorageKeys.RETURNING_SESSION) === 'true';
        }
        this._lastEventTime = now;
        localStorage.setItem(LocalStorageKeys.LAST_EVENT_TIME, this._lastEventTime);
    } catch (e) {
        log(e);
    }

    if (callback && typeof(callback) === 'function') {
        callback();
    }
};

Rakam.prototype.onEvent = function (callback) {
    this.options.eventCallbacks = this.options.eventCallbacks || [];
    this.options.eventCallbacks.push(callback);
};

var transformValue = function(attribute, value, type) {
    if(type !== null) {
        type = type.toLowerCase();
    }
    if(type === 'long' || type === 'time' || type === 'timestamp') {
        value = parseInt(value);
        if(isNaN(value) || !isFinite(value)) {
            log("ignoring "+attribute+": the value must be a number");
            value = null;
        }
    } else
    if(type === 'double') {
        value = parseFloat(value);
        if(isNaN(value) || !isFinite(value)) {
            log("ignoring "+attribute+": the value is not double");
            value = null;
        }
    }else
    if(type === 'boolean') {
        if(type === "true" || type === "1") {
            value = true;
        } else
        if(type === "false" || type === "0") {
            value = false;
        } else {
            log("ignoring "+attribute+": the value is not boolean");
            value = null;
        }
    }
    return value;
};

Rakam.prototype.logInlinedEvent = function (collection, extraProperties, callback) {

    var getAllElementsWithAttribute = function (attribute) {
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
                var attr = element.getAttribute('rakam-attribute-value');
                var option = element.options[element.selectedIndex];
                if(attr === "text") {
                    value = option.value !== null && option.value !== "" ? option.text : null;
                } else {
                    value = option.value;
                }

            } else if (element.innerText) {
                value = element.innerText.replace(/^\s+|\s+$/g, '');
            } else {
                log('Could find value of DOM element.', element);
            }
        }
        if (value !== null && value !== '') {
            properties[attribute] = transformValue(attribute, value, type);
        }

    }
    this.logEvent(collection, properties, callback);
};

Rakam.prototype.isReturningUser = function () {
    return this._returningUser;
};

var gapMillis = 0;
var startTime = (new Date()).getTime();
var idleTime;

Rakam.prototype.startTimer = function (saveOnClose) {

    startTime = (new Date()).getTime();

    ifvisible.on("idle", function(){
        idleTime = (new Date()).getTime();
    });

    ifvisible.on("wakeup", function(){
        gapMillis += (new Date()).getTime() - idleTime;
        idleTime = null;
    });

    if(saveOnClose) {
        var func;
        if(window.onbeforeunload !== null) {
            func = window.onbeforeunload;
        }
        var _this = this;
        window.onbeforeunload = function (e) {
            if(func !== null) {
                func(e);
            }
            Cookie.set("_rakam_time", _this.getTimeOnPage());
        };
    }
};

Rakam.prototype.getTimeOnPage = function () {
    return ((idleTime > 0 ? idleTime : (new Date()).getTime()) - startTime - gapMillis)/1000;
};

Rakam.prototype.getTimeOnPreviousPage = function () {
    return Cookie.get('_rakam_time');
};

Rakam.prototype.nextEventId = function () {
    this._eventId++;
    return this._eventId;
};

// returns true if sendEvents called immediately
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

var _loadCookieData = function (scope) {
    var cookieData = Cookie.get(scope.options.cookieName);
    if (cookieData) {
        if (cookieData.deviceId) {
            scope.options.deviceId = cookieData.deviceId;
        }
        if (cookieData.userId) {
            scope.options.userId = cookieData.userId;
        }
        if (cookieData.userProps) {
            scope.options.userProperties = cookieData.userProps;
        }
        if (cookieData.eventProps) {
            scope.options.userPropertiesForEvent = cookieData.eventProps;
        }
        if (cookieData.optOut !== undefined) {
            scope.options.optOut = cookieData.optOut;
        }
    }
};

var _saveCookieData = function (scope) {
    Cookie.set(scope.options.cookieName, {
        deviceId: scope.options.deviceId,
        userId: scope.options.userId,
        userProps: scope.options.userProperties,
        eventProps: scope.options.userPropertiesForEvent,
        optOut: scope.options.optOut
    });
};

Rakam._getUtmParam = function (name, query) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(query);
    return results === null ? undefined : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Rakam._getUtmData = function (rawCookie, query) {
    // Translate the utmz cookie format into url query string format.
    var cookie = rawCookie ? '?' + rawCookie.split('.').slice(-1)[0].replace(/\|/g, '&') : '';

    var fetchParam = function (queryName, query, cookieName, cookie) {
        return Rakam._getUtmParam(queryName, query) ||
            Rakam._getUtmParam(cookieName, cookie);
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
    var utmData = ['utm_campaign', 'utm_content', 'utm_medium', 'utm_source', 'utm_term'];

    this.options.userPropertiesForEvent = this.options.userPropertiesForEvent || [];
    for (var i=0; i < utmData.length; i++) {
        this.options.userPropertiesForEvent.push(utmData[i]);
    }
};

Rakam.prototype._initTrackForms = function () {
    document.addEventListener('submit', function(event) {
        var targetElement = event.target || event.srcElement;
        var collection = targetElement.getAttribute('rakam-event-track');
        if(targetElement.tagName === 'FORM' && collection) {
            var properties = {};

            var extraAttributes = targetElement.getAttribute("rakam-event-extra");
            if(extraAttributes !== null) {
                for (var key in JSON.parse(extraAttributes)) {
                    if (extraAttributes.hasOwnProperty(key)) {
                        properties[key] = extraAttributes[key];
                    }
                }
            }

            for(var i=0; i<targetElement.elements.length; i++) {
                var element = targetElement.elements[i];

                var type = element.getAttribute('rakam-event-attribute-type');

                if(!element.hasAttribute("rakam-event-form-element")) {
                    continue;
                }

                var attribute = element.getAttribute("name");
                if(element.tagName === 'SELECT') {
                    properties[attribute] = transformValue(attribute, element.options[element.selectedIndex].value, type);
                } else
                if(element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    properties[attribute] = transformValue(attribute, element.value, type);
                } else {
                    log("Couldn't get value of form element: "+attribute);
                }

            }

            this.logEvent(collection, properties);
        }
    });
};

Rakam.prototype._initTrackClicks = function () {
    document.addEventListener('click', function(event) {
        var targetElement = event.target || event.srcElement;
        var collection = targetElement.getAttribute('rakam-event-track');
        if(targetElement.tagName === 'FORM' && collection) {
            var properties = {};

            var extraAttributes = targetElement.getAttribute("rakam-event-properties");
            if(extraAttributes !== null) {
                for (var key in JSON.parse(extraAttributes)) {
                    if (extraAttributes.hasOwnProperty(key)) {
                        properties[key] = extraAttributes[key];
                    }
                }
            }

            this.logEvent(collection, properties);
        }
    });
};

Rakam.prototype._getReferrer = function () {
    return document.referrer;
};

Rakam.prototype.saveEvents = function () {
    try {
        localStorage.setItem(this.options.unsentKey, JSON.stringify(this._unsentEvents));
    } catch (e) {
        log(e);
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
        log('set domain=' + domain);
    } catch (e) {
        log(e);
    }
};

Rakam.prototype.setUserId = function (userId) {
    try {
        this.options.userId = (userId !== undefined && userId !== null && ('' + userId)) || null;
        _saveCookieData(this);
        log('set userId=' + userId);
    } catch (e) {
        log(e);
    }
};

Rakam.prototype.setOptOut = function (enable) {
    try {
        this.options.optOut = enable;
        _saveCookieData(this);
        log('set optOut=' + enable);
    } catch (e) {
        log(e);
    }
};

Rakam.prototype.setDeviceId = function (deviceId) {
    try {
        if (deviceId) {
            this.options.deviceId = ('' + deviceId);
            _saveCookieData(this);
        }
    } catch (e) {
        log(e);
    }
};

Rakam.prototype.setUserProperties = function (userProperties, opt_replace, eventProps) {
    try {
        if (opt_replace) {
            this.options.userProperties = userProperties;
        } else {
            this.options.userProperties = object.merge(this.options.userProperties || {}, userProperties);
        }
        this.options.userPropertiesForEvent = this.options.userPropertiesForEvent || [];
        for (var i=0; i < eventProps.length; i++) {
            this.options.userPropertiesForEvent.push(eventProps[i]);
        }
        _saveCookieData(this);
        log('set userProperties=' + JSON.stringify(userProperties));
    } catch (e) {
        log(e);
    }
};

Rakam.prototype.setVersionName = function (versionName) {
    try {
        this.options.versionName = versionName;
        log('set versionName=' + versionName);
    } catch (e) {
        log(e);
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
            localStorage.setItem(LocalStorageKeys.SESSION_ID, this._sessionId);
        }
        this._lastEventTime = eventTime;
        localStorage.setItem(LocalStorageKeys.LAST_EVENT_TIME, this._lastEventTime);
        localStorage.setItem(LocalStorageKeys.LAST_id, eventId);

        var userProperties = {};
        object.merge(userProperties, this.options.userProperties || {});

        // Add the utm properties, if any, onto the user properties.
        object.merge(userProperties, this._utmProperties);

        // Add referral info onto the user properties
        if (this.options.includeReferrer) {
            object.merge(userProperties, {
                'referrer': this._getReferrer()
            });
        }

        apiProperties = apiProperties || {};
        eventProperties = eventProperties || {};
        var event = {
            project: this.options.apiKey,
            collection: eventType,
            properties: {
                device_id: this.options.deviceId,
                _user: this.options.userId || this.options.deviceId,
                _time: eventTime/1000,
                session_id: this._sessionId || -1,
                platform: this.options.platform,
                language: this.options.language
                //uuid: UUID()
            }
        };

        //if (typeof window.performance === 'object' && typeof window.performance.timing === 'object') {
        //    event.properties.load_time = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        //}

        for (var key in userProperties) {
            if (userProperties.hasOwnProperty(key) && indexOf.call(this.options.userPropertiesForEvent, key) > -1) {
                event.properties["user_" + key] = userProperties[key];
            }
        }

        object.merge(event.properties, apiProperties);
        object.merge(event.properties, eventProperties);

        log('logged eventType=' + eventType + ', properties=' + JSON.stringify(eventProperties));

        this._unsentEvents.push({id: eventId, event: event});

        // Remove old events from the beginning of the array if too many
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
        log(e);
    }
};

Rakam.prototype.logEvent = function (eventType, eventProperties, callback) {
    return this._logEvent(eventType, eventProperties, null, callback);
};

/**
 * Remove events in storage with event ids up to and including maxEventId. Does
 * a true filter in case events get out of order or old events are removed.
 */
Rakam.prototype.removeEvents = function (maxEventId) {
    var filteredEvents = [];
    for (var i = 0; i < this._unsentEvents.length; i++) {
        if (this._unsentEvents[i].id > maxEventId) {
            filteredEvents.push(this._unsentEvents[i]);
        }
    }
    this._unsentEvents = filteredEvents;
};

Rakam.prototype.sendEvents = function (callback) {
    if (!this._sending && !this.options.optOut && this._unsentEvents.length > 0) {
        this._sending = true;
        var url = ('https:' === window.location.protocol ? 'https' : 'http') + '://' +
            this.options.apiEndpoint + this.options.apiEndpointPath;

        // Determine how many events to send and track the maximum event id sent in this batch.
        var numEvents = Math.min(this._unsentEvents.length, this.options.uploadBatchSize);
        var maxEventId = this._unsentEvents[numEvents - 1].id;

        this._unsentEvents.slice(0, numEvents);
        var events = this._unsentEvents.slice(0, numEvents).map(function(e)  {
            return e.event;
        });
        var uploadTime = new Date().getTime();

        var headers = {
            "Upload-Time": uploadTime,
            "Api-Version": API_VERSION,
            "write_key": this.options.write_key,
            "Content-MD5": md5(API_VERSION + JSON.stringify(events) + uploadTime).toUpperCase()
        };
        var scope = this;
        new Request(url, events, headers).send(function (status, response, headers) {
            scope._sending = false;
            try {
                if (status === 200 && response === '1') {
                    log('successful upload');
                    scope.removeEvents(maxEventId);

                    // Update the event cache after the removal of sent events.
                    if (scope.options.saveEvents) {
                        scope.saveEvents();
                    }

                    // Send more events if any queued during previous send.
                    if (!scope._sendEventsIfReady(callback) && callback) {
                        callback(status, response);
                    }

                } else if (status === 413) {
                    log('request too large');
                    // Can't even get this one massive event through. Drop it.
                    if (scope.options.uploadBatchSize === 1) {
                        scope.removeEvents(maxEventId);
                    }

                    // The server complained about the length of the request.
                    // Backoff and try again.
                    scope.options.uploadBatchSize = Math.ceil(numEvents / 2);
                    scope.sendEvents(callback);

                } else if (callback) { // If server turns something like a 400
                    callback(status, response);
                }
            } catch (e) {
                log('failed upload');
            }

            if (scope.options.eventCallbacks !== null) {
                try {
                    for (var i = 0; i < scope.options.eventCallbacks.length; i++) {
                        scope.options.eventCallbacks[i](status, response, headers);
                    }
                } catch (e) {
                    log('callback throwed an exception', e);
                }
            }
        });
    } else if (callback) {
        callback(0, 'No request sent');
    }
};


Rakam.prototype.__VERSION__ = version;

module.exports = Rakam;
