module.exports = function (obj1, obj2) {
    for (var attrname in obj2) {
        if(obj2.hasOwnProperty(attrname)) {
            obj1[attrname] = obj2[attrname];
        }
    }
};