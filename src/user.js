import type from './type';
import Request from './xhr';

/*
 * Wrapper for a user properties JSON object that supports operations.
 * Note: if a user property is used in multiple operations on the same User object,
 * only the first operation will be saved, and the rest will be ignored.
 */

var API_VERSION = 1;

var wrapCallback = function (operation, props, callback) {
    return function (status, response, headers) {
        if (callback !== undefined) {
            callback(status, response, headers);
        }
    };
};

var getUrl = function (options) {
    return ('https:' === window.location.protocol ? 'https' : 'http') + '://' + options.apiEndpoint + "/user";
};

var User = function () {
};

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

User.prototype._merge = function (deviceId, createdAt, callback) {
    new Request(getUrl(this.options) + "/merge", {
        api: {
            "api_version": API_VERSION,
            "api_key": this.options.apiKey,
            "upload_time": new Date().getTime()
        },
        anonymous_id: deviceId,
        id: this.options.userId,
        created_at: createdAt ? createdAt.getTime() : null,
        merged_at: new Date().getTime()
    }).send(wrapCallback("merge", null, callback));

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

export default User;
