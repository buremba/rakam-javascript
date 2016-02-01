(function(window, document) {
  var rakam = window.rakam || {};
  var as = document.createElement('script');
  as.type = 'text/javascript';
  as.async = true;
  as.src = 'http://127.0.0.1:8080/dist/rakam-2.4.0.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(as, s);
  rakam._q = [];
  function proxy(fn) {
    rakam[fn] = function() {
      rakam._q.push([fn].concat(Array.prototype.slice.call(arguments, 0)));
    };
  }
  var funcs = ["init", "logEvent", "logInlinedEvent", "setUserId", "getUserId", "getDeviceId", "setSuperProperties",
               "setOptOut", "setVersionName", "setDomain", "setDeviceId", "onload",
               "onEvent", "getTimeOnPreviousPage", "getTimeOnPage", "startTimer", "isReturningUser",
               "User"];
  for (var i = 0; i < funcs.length; i++) {
    proxy(funcs[i]);
  }
  window.rakam = rakam;
})(window, document);
