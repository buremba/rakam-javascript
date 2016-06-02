(function (window, document) {
    var rakam = window.rakam || {};
    var as = document.createElement('script');
    as.type = 'text/javascript';
    as.async = true;
    as.src = 'https://rawgit.com/buremba/rakam-javascript/master/rakam.min.js';
    as.onload = function() {window.rakam.runQueuedFunctions();};
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(as, s);
    var User = function () {
        this._q = [];
        return this;
    };

    function proxyIdentify(fn) {
        User.prototype[fn] = function () {
            this._q.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
            return this;
        };
    }

    var identifyFuncs = ['set', 'setOnce', 'increment', 'unset'];
    for (var i = 0; i < identifyFuncs.length; i++) {
        proxyIdentify(identifyFuncs[i]);
    }
    rakam.User = User;
    rakam._q = [];
    function proxy(fn) {
        rakam[fn] = function () {
            rakam._q.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
        };
    }

    var funcs = ["init", "logEvent", "logInlinedEvent", "setUserId", "getUserId", "getDeviceId", "setSuperProperties",
        "setOptOut", "setVersionName", "setDomain", "setDeviceId", "onload",
        "onEvent", "getTimeOnPreviousPage", "getTimeOnPage", "startTimer", "isReturningUser"];
    for (var j = 0; j < funcs.length; j++) {
        proxy(funcs[j]);
    }
    window.rakam = rakam;
})(window, document);
