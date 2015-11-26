var type = require('./type');

/*
 * Wrapper for a user properties JSON object that supports operations.
 * Note: if a user property is used in multiple operations on the same User object,
 * only the first operation will be saved, and the rest will be ignored.
 */

var log = function(s) {
    console.log('[Rakam] ' + s);
};

var User = function() {
    this.userPropertiesOperations = {};
    this.properties = []; // keep track of keys that have been added
};

User.prototype.add = function(property, value) {
    if (type(value) === 'number' || type(value) === 'string') {
        this._addOperation('add', property, value);
    } else {
        log('Unsupported type for value: ' + type(value) + ', expecting number or string');
    }
    return this;
};

User.prototype.set = function(property, value) {
    this._addOperation('set', property, value);
    return this;
};

User.prototype.setOnce = function(property, value) {
    this._addOperation('setOnce', property, value);
    return this;
};

User.prototype.unset = function(property) {
    this._addOperation('unset', property, '-');
    return this;
};

User.prototype._addOperation = function(operation, property, value) {
    // check that property wasn't already used in this Identify
    if (this.properties.indexOf(property) !== -1) {
        log('User property "' + property + '" already used in this identify, skipping operation ' + operation);
        return;
    }

    if (!(operation in this.userPropertiesOperations)){
        this.userPropertiesOperations[operation] = {};
    }
    this.userPropertiesOperations[operation][property] = value;
    this.properties.push(property);
};

module.exports = User;