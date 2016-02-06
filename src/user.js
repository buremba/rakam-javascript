var type = require('./type');
var Request = require('./xhr');

/*
 * Wrapper for a user properties JSON object that supports operations.
 * Note: if a user property is used in multiple operations on the same User object,
 * only the first operation will be saved, and the rest will be ignored.
 */

var API_VERSION = 1;
var log = function (s, opts) {
    console.log('[Rakam] ' + s, opts);
};

var wrapCallback = function (operation, props, callback) {
    return function (status, response, headers) {
        log("Successfully sent " + operation, props);
        callback(status, response, headers);
    };
};

var getUrl = function (options) {
    return ('https:' === window.location.protocol ? 'https' : 'http') + '://' + options.apiEndpoint + "/user";
};

var User = function () {};

User.prototype.init = function (options) {
    this.options = options;
};


User.prototype.set = function (properties, callback) {
    new Request(getUrl(this.options) + "/set_properties", {
        api: {
            "apiVersion": API_VERSION,
            "writeKey": this.options.writeKey
        },
        project: this.options.apiKey,
        user: this.options.userId || this.options.deviceId,
        properties: properties
    }).send(wrapCallback("set_properties", properties, callback));

    return this;
};

User.prototype._merge = function (createdAt, callback) {
    new Request(getUrl(this.options) + "/merge", {
        api: {
            "apiVersion": API_VERSION,
            "writeKey": this.options.writeKey
        },
        project: this.options.apiKey,
        id: this.options.deviceId,
        user: this.options.userId,
        created_at: createdAt,
        merged_at: new Date().getTime()
    }).send(wrapCallback("merge", null, callback));

    return this;
};

User.prototype.setOnce = function (properties, callback) {
    new Request(getUrl(this.options) + "/set_properties_once", {
        api: {
            "apiVersion": API_VERSION,
            "writeKey": this.options.writeKey
        },
        user: this.options.userId || this.options.deviceId,
        project: this.options.apiKey,
        properties: properties
    }).send(wrapCallback("set_properties_once", properties, callback));

    return this;
};


User.prototype.increment = function (property, value, callback) {
    new Request(getUrl(this.options) + "/increment_property", {
        api: {
            "apiVersion": API_VERSION,
            "writeKey": this.options.writeKey
        },
        user: this.options.userId || this.options.deviceId,
        project: this.options.apiKey,
        property: property,
        value: value
    }).send(wrapCallback("increment_property", property + " by " + value, callback));

    return this;
};

User.prototype.unset = function (properties, callback) {
    new Request(getUrl(this.options) + "/unset_properties", {
        api: {
            "apiVersion": API_VERSION,
            "writeKey": this.options.writeKey
        },
        user: this.options.userId || this.options.deviceId,
        project: this.options.apiKey,
        properties: type(properties) === "array" ? properties : [properties]
    }).send(wrapCallback("unset_properties", properties, callback));

    return this;
};

module.exports = User;