[![Build Status](https://travis-ci.org/buremba/rakam-javascript.svg?branch=master)](https://travis-ci.org/buremba/rakam-javascript)

# Setup #
On every page that uses analytics, paste the following Javascript code between the `<head>` and `</head>` tags:

```
<script type="text/javascript">
   (function(e,t){var n=e.rakam||{};var r=t.createElement("script");r.type="text/javascript";
   r.async=true;r.src="https://cdn.rakam.io/sdk/rakam.beta.min.js";r.onload=function(){
   e.rakam.runQueuedFunctions()};var o=t.getElementsByTagName("script")[0];o.parentNode.insertBefore(r,o);
   function a(e,t){e[t]=function(){this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));
   return this}}var s=function(){this._q=[];return this};var i=["set","setOnce","increment","unset"];
   for(var c=0;c<i.length;c++){a(s.prototype,i[c])}n.User=s;n._q=[];var u=["init","logEvent","logInlinedEvent","setUserId","getUserId","getDeviceId","setSuperProperties","setOptOut","setVersionName","setDomain","setUserProperties","setDeviceId","onload","onEvent","startTimer"];
   for(var l=0;l<u.length;l++){a(n,u[l])}var m=["getTimeOnPreviousPage","getTimeOnPage","isReturningUser"];
   var v=(e.console?e.console.error||e.console.log:null)||function(){};var d=function(e){
   return function(){v("The method rakam."+e+"() must be called inside rakam.init callback function!");
   }};for(l=0;l<m.length;l++){n[m[l]]=d(m[l])}e.rakam=n})(window,document);

   rakam.init("YOUR_PROJECT_WRITE_KEY", "USER_ID_HERE", { 
         apiEndpoint:"YOUR_PROJECT_API_URL", 
         includeUtm: true, 
         trackClicks: true, 
         trackForms: true, 
         includeReferrer: true 
    });
 </script>
```

3. Replace `YOUR PROJECT WRITE KEY` with the write_key key of your project. If you know the user id (it may be e-mail, database id or any other identifier), you can pass it in `USER_ID_HERE`, otherwise you can just use `null` value. Please note that `YOUR_PROJECT_API_URL` should be used without http and https prefix. (i.e. `rakam.myapp.com`)
4. To track an event anywhere on the page, call:

```
rakam.logEvent("EVENT_IDENTIFIER_HERE");
```

5. Events are uploaded immediately and saved to the browser's local storage until the server confirms the upload. After calling logEvent in your app, you will immediately see data appear on Rakam.

# Tracking Events #

It's important to think about what types of events you care about as a developer. You should aim to track between 5 and 50 types of events on your site. Common event types are actions the user initiates (such as pressing a button) and events you want the user to complete (such as filling out a form, completing a level, or making a payment). Shoot me an email if you want assistance determining what would be best for you to track.

Here is an example for a typical setup:

    rakam.init("YOUR_PROJECT_WRITE_KEY", "USER_ID_HERE", { 
        apiEndpoint:"YOUR_PROJECT_API_URL", 
        includeUtm: true, 
        trackClicks: true, 
        trackForms: true, 
        includeReferrer: true 
    }, function() {
        var e = document.documentElement, g = document.getElementsByTagName('body')[0],
                x = window.innerWidth || e.clientWidth || g.clientWidth,
                y = window.innerHeight|| e.clientHeight|| g.clientHeight; 

        rakam.logEvent("pageview", {url: window.location.pathname, returning_session: rakam.isReturningUser(), color_depth: window.screen.colorDepth, viewport: x + ' × ' + y, title: document.title});
    });
    rakam.startTimer(true);

    rakam.setSuperProperties({_ip: true, _user_agent:true, _referrer:document.referrer, resolution: window.screen.width+" × "+window.screen.height}, true);

# Setting Event Properties #

You can attach additional data to any event by passing a Javascript object as the second argument to `logEvent`:

    var eventProperties = {};
    eventProperties.key = "value";
    rakam.logEvent("EVENT_COLLECTION_HERE", eventProperties);

# Setting User Properties #

```
Please note that you need to call `rakam.setUserId` before setting any user property.
```

To add properties to a user you can use the User API.

    rakam.User().set({'property': 'value'});

Currently, we have `set`, `setOnce`, `increment` and `unset` methods in User API.

# Super properties #

If you want to track extra attributes in all the events that are occurred for a given user, you can use super properties. They're usually handful for tracking user properties in events.

    rakam.setSuperProperties({user_gender: 'male'}, replaceExisting);

# Settings Custom User IDs #

If your app has its own login system that you want to track users with, you can call `setUserId` at any time:

    rakam.setUserId("USER_ID_HERE");

A user's data will be merged on the backend so that any events up to that point from the same browser will be tracked under the same user.

# Tracking Clicks #
If you add `rakam-event-track` attribute to the buttons, and enable the config `trackClicks`, Rakam will automatically track the clicks for you. Here is a simple example
```
Click here to show pets:
<button rakam-event-track="show_pets", rakam-event-properties='{"webpage": "petlist1"}'>
```

# Event Hooks #

You can add event hooks with `rakam.onEvent` method. The callback function will be executed when the events that are succesfully collected by the Rakam, the function parameters include the response data that is returned by the server.

This feature is useful if you use automation module or custom event mappers in your Rakam cluster. For example the automation module uses a custom header `_auto_action` to send client to take action in real-time. The following snippet displays an alert that includes the message that is sent from automation module to the client.

```javascript
rakam.onEvent(function(status, response, headers) {
      var actions = headers['_auto_action'];
      if(actions) {
          var actions = actions.split(",");
          for(var i=0; i < actions.length; i++) {
              var action = decodeURIComponent(escape(window.atob( actions[i] )));
              // we use JQuery in this example.
              var div = $("<div/>").text(action).attr('style', 'position: fixed; bottom: 20px; right: 20px; background: #FFF8EB; border: 1px solid #FFD17E; padding: 9px; z-index: 100; box-shadow: 0 0 5px #CCCCCC; color: #9E6600;')
                      .appendTo('body');
              setTimeout(function() {
                  div.fadeOut(300, function() { $(this).remove(); });
              }, 4000);
          }
      }
  });
```

# Sessions #
Rakam will automatically attach session_id attribute to each event that is unique for each session. When a new visitor visits your website, Rakam generates a unique session id for the visitor. This session id will be used in collected events for the next 30 minutes, and then the session timeouts and Rakam automatically generates a new session id. you can configure the interval of sessions with `sessionTimeout` option.

### Miscellaneous methods

`rakam.isReturningUser()` returns true if the session is a returning session.

# Opting User Out of Logging #

You can turn off logging for a given user:

    rakam.setOptOut(true);

No events will be saved or sent to the server while opt out is enabled. The opt out
setting will persist across page loads. Calling

    setOptOut(false)

will re-enable logging.

# Configuration Options #

| option | description | default |
|------------|----------------------------------------------------------------------------------|-----------|
| saveEvents | If `true`, saves events to localStorage and removes them upon successful upload.<br><i>NOTE:</i> Without saving events, events may be lost if the user navigates to another page before events are uploaded. | `true` |
| savedMaxCount | Maximum number of events to save in localStorage. If more events are logged while offline, old events are removed. | 1000 |
| uploadBatchSize | Maximum number of events to send to the server per request. | 100 |
| includeUtm | If `true`, finds utm parameters in the query string or the __utmz cookie, parses, and includes them as user propeties on all events uploaded. | `false` |
| includeReferrer | If `true`, includes `referrer` and `referring_domain` as user propeties on all events uploaded. | `false` |
| batchEvents | If `true`, events are batched together and uploaded only when the number of unsent events is greater than or equal to `eventUploadThreshold` or after `eventUploadPeriodMillis` milliseconds have passed since the first unsent event was logged. | `false` |
| eventUploadThreshold | Minimum number of events to batch together per request if `batchEvents` is `true`. | 30 |
| eventUploadPeriodMillis | Amount of time in milliseconds that the SDK waits before uploading events if `batchEvents` is `true`. | 30*1000 |
| deviceId | Custom device ID to set | Randomly generated UUID |
| useLocalStorageForSessionization | Whether to use localstorage for session ids (useful if you're tracking events from multiple hosts)| true |

# Advanced #

This SDK automatically grabs useful data about the browser, including browser type and operating system version.

By default, no version name is set. You can specify a version name to distinguish between different versions of your site by calling `setVersionName`:

    rakam.setVersionName("VERSION_NAME_HERE");

If you don't set the user id, the user id will be null in the target data warehouse. In that case, you should use unique devices for tracking.
When you set a user id, the value is stored in cookies so all the subsequent events will be attached to the given user id.

Device IDs are generated randomly, although you can define a custom device ID setting it as a configuration option or by calling:

    rakam.setDeviceId("CUSTOM_DEVICE_ID");

You can pass a callback function to logEvent, which will get called after receiving a response from the server:

    rakam.logEvent("EVENT_IDENTIFIER_HERE", null, callback_function);

The status and response from the server are passed to the callback function, which you might find useful. An example of a callback function which redirects the browser to another site after a response:

```javascript
  var callback_function = function(status, response) {
    if (status === 200 && response === '1') {
      // do something here
    }
    window.location.replace('URL_OF_OTHER_SITE');
  };
```

You can also pass a callback function to init, which will get called after the SDK finishes its asynchronous loading. Note: no values are passed to the init callback function:

    rakam.init("YOUR_API_KEY_HERE", "USER_ID_HERE", null, callback_function);

In the case that `optOut` is true, then no event will be logged, but the callback will be called. In the case that `batchEvents` is true, if the batch requirements `eventUploadThreshold` and `eventUploadPeriodMillis` are not met when `logEvent` is called, then no request is sent, but the callback is still called. In these cases, the callback will be called with an input status of 0 and response 'No request sent'.
