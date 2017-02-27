(function (window, document) {
    var rakam = window.rakam || {};
    var as = document.createElement('script');
    as.type = 'text/javascript';
    as.async = true;
    as.src = 'https://d2f7xo8n6nlhxf.cloudfront.net/rakam.min.js';
    as.onload = function () {window.rakam.runQueuedFunctions();};
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(as, s);


    function proxy(obj, fn) {
        obj[fn] = function () {
            this._q.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
            return this;
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
                 "onEvent", "startTimer"];
    for (var j = 0; j < funcs.length; j++) {
        proxy(rakam, funcs[j]);
    }
    var nofuncs = ["getTimeOnPreviousPage", "getTimeOnPage", "isReturningUser"];
    var errFunc = (window.console ? (window.console.error || window.console.log) : null) || function () {};
    var notifyFunc = function (funcName) {
        return function () {
            errFunc("The method rakam." + funcName + "() must be called inside rakam.init callback function!");
        };
    };

    for (j = 0; j < nofuncs.length; j++) {
        rakam[nofuncs[j]] = notifyFunc(nofuncs[j]);
        proxy(rakam, nofuncs[j]);
    }

    window.rakam = rakam;
})(window, document);
