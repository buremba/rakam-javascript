[![Build Status](https://travis-ci.org/buremba/rakam-javascript.svg?branch=master)](https://travis-ci.org/buremba/rakam-javascript)

# Setup #
1. If you haven't already, go to http://rakam.io and register for an account. You will receive an API Key.
2. On every page that uses analytics, paste the following Javascript code between the `<head>` and `</head>` tags:

        <script type="text/javascript">
          (function(e,t){var r=e.rakam||{};var n=t.createElement("script");n.type="text/javascript";
          n.async=true;n.src="https://d2f7xo8n6nlhxf.cloudfront.net/rakam.min.js";
          n.onload=function(){e.rakam.runQueuedFunctions()};var a=t.getElementsByTagName("script")[0];
          a.parentNode.insertBefore(n,a);function s(e,t){e[t]=function(){this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));
          return this}}var i=function(){this._q=[];return this};var o=["set","setOnce","increment","unset"];
          for(var c=0;c<o.length;c++){s(i.prototype,o[c])}r.User=i;r._q=[];var u=["init","logEvent","logInlinedEvent","setUserId","getUserId","getDeviceId","setSuperProperties","setOptOut","setVersionName","setDomain","setUserProperties","setDeviceId","onload","onEvent","getTimeOnPreviousPage","getTimeOnPage","startTimer","isReturningUser"];
          for(var m=0;m<u.length;m++){s(r,u[m])}e.rakam=r})(window,document);

          rakam.init("YOUR_PROJECT_WRITE_KEY", "USER_ID_HERE", { 
                apiEndpoint:"127.0.0.1:9999", 
                includeUtm: true, 
                trackClicks: true, 
                trackForms: true, 
                includeReferrer: true 
           });
        </script>

3. Replace `YOUR_API_KEY_HERE` with the Write API Key given to you.
4. To track an event anywhere on the page, call:

        rakam.logEvent("EVENT_IDENTIFIER_HERE");

5. Events are uploaded immediately and saved to the browser's local storage until the server confirms the upload. After calling logEvent in your app, you will immediately see data appear on Rakam.

# Tracking Events #

It's important to think about what types of events you care about as a developer. You should aim to track between 5 and 50 types of events on your site. Common event types are actions the user initiates (such as pressing a button) and events you want the user to complete (such as filling out a form, completing a level, or making a payment). Shoot me an email if you want assistance determining what would be best for you to track.

# Setting Event Properties #

You can attach additional data to any event by passing a Javascript object as the second argument to `logEvent`:

    var eventProperties = {};
    eventProperties.key = "value";
    rakam.logEvent("EVENT_COLLECTION_HERE", eventProperties);

# Setting User Properties #

To add properties to a user you can use the User API.

    new rakam.User().set({'property', 'value'}, callback);

Currently, we have `set`, `setOnce`, `increment` and `unset` methods in User API.

# Super properties #

If you want to track extra attributes in all the events that are occurred for a given user, you can use super properties. They're usually handful for tracking user properties in events.

    rakam.setSuperProperties({user_gender: 'male'}, replaceExisting);

# Settings Custom User IDs #

If your app has its own login system that you want to track users with, you can call `setUserId` at any time:

    rakam.setUserId("USER_ID_HERE");

A user's data will be merged on the backend so that any events up to that point from the same browser will be tracked under the same user.

# Event tracking based on DOM elements #

Rakam has a spesific method that is similar to `rakam.logEvent` but lets you to track events automatically by adding attributes to DOM elements. When you call `rakam.logInlinedEvent` method,  Rakam searches all DOM elements that have `rakam-event-attribute` attribute and include their values to event that is collected. It also works for various elements including for elements such as `SELECT`, `INPUT`, `TEXTAREA`.
For example, let's say that you want to collect user search events in your website. The search page already includes data that you want to use as attributes of the event so instead of generating event properties manually and using `rakam.logEvent` you may set `rakam-event-attribute` attribute to DOM elements such as result count, category, sorting criteria etc. and call `rakam.logInlinedEvent`.

    rakam.logInlinedEvent("EVENT_COLLECTION_NAME", extraProperties, callback);
    
Since all

Full example:

```html
    <html>
        <body>
            <h1>
                <input type="search" rakam-event-attribute="query_term" value="phones">
                <span rakam-event-attribute="result_count" rakam-event-attribute-type="long">12</span>
                results found
                <span rakam-event-attribute="category">electronics</span>
                category.
                <select rakam-event-attribute="sorting_criteria">
                   <option value="relevance" selected>relevance</option>
                   <option value="name">name</option>
                   <option value="price">price</option>
                </select>
            </h1>
        <body>
    <html>
    <script>
    rakam.init("shop");
    rakam.logInlinedEvent("search");
    </script>
```

It produces the following JSON that will be used as event properties:

```json
    {
        "project": "shop",
        "collection": "search",
        "properties": {
             "query_term": "phones",
             "result_count": 12,
             "category": "electronics",
             "sorting_criteria": "relevance"
        }
   }
```

| DOM attribute | description | default |
|------------|----------------------------------------------------------------------------------|-----------|
| rakam-event-attribute | The value is the event attribute name, if a DOM element doesn't have this attribute it will be ignored. | `null` |
| rakam-event-attribute-type | The type of the event attribute. The valid values are `string`, `long`, `time` (The format is 24:00:00), `timestamp` and `date` (The value must be epoch unix timestamp), `double`, `boolean`  | `string` |
| rakam-event-attribute-value | If the attribute is present, the DOM element value will be ignored and the value of this attribute will be used. | `null` |

# Tracking Forms #
If `trackForms` option is set true, Rakam automatically track forms that have `rakam-event-form` attribute. When a visitor submits a form that has `rakam-event-form` attribute, Rakam visits all the form elements, generate event properties and send event to Rakam. If the form causes page redirection, the event will be saved in `localStorage` and sent after redirection. (If the form redirects to another domain and the visitor never returns to the website, the event will be lost. We may use [sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) API to fix this issue in the future but unfortunately there is no cross-browser version of this API).

Available options for FORM tag:

| DOM attribute | description | default |
|------------|----------------------------------------------------------------------------------|-----------|
| rakam-event-form | If the form that is submitted doesn't have this attribute, Rakam doesn't track it. The value will be the event collection. | `null` |
| rakam-event-extra | An optional attribute for forms that are tracked by Rakam. If the form that is submitted have this attribute the value will be merged with the generated event properties from the form elements. | `null` (Must be a JSON string) |

Available options for FORM elements:

| DOM attribute | description | default |
|------------|----------------------------------------------------------------------------------|-----------|
| rakam-event-form-element-ignore | The form element will be ignored if this is attribute is set. | `string` |

You can also use `rakam-event-attribute`, `rakam-event-attribute-type` and `rakam-event-attribute-value` attributes that are explained in previous section. If `rakam-event-attribute` is not set, the `name` attribute of the form element will be used as event attribute.

If the form element is an INPUT and the type is PASSWORD, it will be ignored automatically.

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

# Timer

Timer calculates the actual duration that the visitor spent on your website. You can use this feature attach `time_on_page` metric to your events.


| method | description
|------------|----------------------------------------------------------------------------------|
| `rakam.startTimer(isSaveOnClose)` | Starts a timer that indicates the active duration of the visitor in the webpage. It uses [ifvisible.js](https://github.com/serkanyersen/ifvisible.js/) to find out the actual duration that visitor spent on the website. `isSaveOnClose` is a boolean parameter, when user closes the webpage, it saves the final duration to a cookie so that you can use `rakam.getTimeOnPreviousPage()` on the next page. If it's not set, the other methods is not functional.|
|`rakam.timeOnPage()` |returns the current duration the user spent on the webpage.|
|`rakam.getTimeOnPreviousPage()`| reads the cookie parameter that is saved Rakam Timer. If you called `rakam.startTimer(true)` on previous page, it will save the final duration to a cookie automatically before the visitor arrives on this page.|

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


# Advanced #

This SDK automatically grabs useful data about the browser, including browser type and operating system version.

By default, no version name is set. You can specify a version name to distinguish between different versions of your site by calling `setVersionName`:

    rakam.setVersionName("VERSION_NAME_HERE");

User IDs are automatically generated and stored in cookies if not specified.

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

**This library is a fork of [Amplitude-Javascript](https://github.com/amplitude/Amplitude-Javascript)**
