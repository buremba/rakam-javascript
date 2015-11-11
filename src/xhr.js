var JSON = require('json'); // jshint ignore:line

/*
 * Simple AJAX request object
 */
var Request = function (url, data, headers) {
    this.url = url;
    this.data = data || {};
    this.headers = headers || null;
};

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
        xhr.open('POST', this.url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                callback(xhr.status, xhr.responseText, xhr.getAllResponseHeaders());
            }
        };
        xhr.setRequestHeader('Content-Type', 'application/json charset=utf-8');
        for (var key in this.headers) {
            if (this.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, this.headers[key]);
            }
        }
        xhr.send(JSON.stringify(this.data));
    }
    //log('sent request to ' + this.url + ' with data ' + decodeURIComponent(queryString(this.data)));
};

module.exports = Request;
