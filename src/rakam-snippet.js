(function (window, document) {
    var rakam = window.rakam || {};
    var as = document.createElement('script');
    as.type = 'text/javascript';
    as.async = true;
    as.src = 'https://cdn.rawgit.com/buremba/rakam-javascript/master/rakam.js';
    as.onload = function() {window.rakam.runQueuedFunctions();};
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(as, s);


    function proxy(obj, fn) {
        obj[fn] = function() {
            this._q.push([fn].concat(Array.prototype.slice.call(arguments, 0))); return this;
        };
    }

    var User = function () {
        this._q = [];
        return this;
    };

    var identifyFuncs = ['set', 'setOnce', 'increment', 'unset'];
    for (var i = 0; i < identifyFuncs.length; i++) {
        proxy(User.prototype, identifyFuncs[i]);
    }
    rakam.User = User;
    rakam._q = [];

    var funcs = ["init", "logEvent", "logInlinedEvent", "setUserId", "getUserId", "getDeviceId", "setSuperProperties",
        "setOptOut", "setVersionName", "setDomain", "setUserProperties", "setDeviceId", "onload",
        "onEvent", "getTimeOnPreviousPage", "getTimeOnPage", "startTimer", "isReturningUser"];
    for (var j = 0; j < funcs.length; j++) {
        proxy(rakam, funcs[j]);
    }
    window.rakam = rakam;
})(window, document);
