var object = {};
var has = object.hasOwnProperty;

export function merge(a, b) {
    for (var key in b) {
        if (has.call(b, key)) {
            a[key] = b[key];
        }
    }
    return a;
}
