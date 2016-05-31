var JSON = require('json'); // jshint ignore:line

/*
 * Simple AJAX request object
 */
var Request = function (url, data, headers) {
    this.url = url;
    this.data = data || {};
    this.headers = headers || {};
};

function parseResponseHeaders(headerStr) {
    var headers = {};
    if (!headerStr) {
        return headers;
    }
    var headerPairs = headerStr.split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i];
        // Can't use split() here because it does the wrong thing
        // if the header value has the string ": " in it.
        var index = headerPair.indexOf('\u003a\u0020');
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

module.exports = Request;
