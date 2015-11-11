describe('Rakam', function () {
    var Rakam = require('../src/rakam.js');
    var localStorage = require('../src/localstorage.js');
    var cookie = require('../src/cookie.js');
    var JSON = require('json');
    var apiKey = '000000';
    var userId = 'user';
    var rakam;
    var server;

    beforeEach(function () {
        rakam = new Rakam();
        server = sinon.fakeServer.create();
    });

    afterEach(function () {
        server.restore();
    });

    it('rakam object should exist', function () {
        assert.isObject(rakam);
    });

    function reset() {
        localStorage.clear();
        cookie.remove(rakam.options.cookieName);
        cookie.reset();
    }

    describe('init', function () {
        beforeEach(function () {
        });

        afterEach(function () {
            reset();
        });

        it('should accept userId', function () {
            rakam.init(apiKey, userId);
            assert.equal(rakam.options.userId, userId);
        });

        it('should set cookie', function () {
            rakam.init(apiKey, userId);
            var stored = cookie.get(rakam.options.cookieName);
            assert.property(stored, 'deviceId');
            assert.propertyVal(stored, 'userId', userId);
            assert.lengthOf(stored.deviceId, 36);
        });

        it('should set language', function () {
            rakam.init(apiKey, userId);
            assert.property(rakam.options, 'language');
            assert.isNotNull(rakam.options.language);
        });

        it('should allow language override', function () {
            rakam.init(apiKey, userId, {language: 'en-GB'});
            assert.propertyVal(rakam.options, 'language', 'en-GB');
        });

        it('should not run callback if invalid callback', function () {
            rakam.init(apiKey, userId, null, 'invalid callback');
        });

        it('should run valid callbacks', function () {
            var counter = 0;
            var callback = function () {
                counter++;
            };
            rakam.init(apiKey, userId, null, callback);
            assert.equal(counter, 1);
        });
    });

    describe('setUserProperties', function () {
        beforeEach(function () {
            rakam.init(apiKey);
        });

        afterEach(function () {
            reset();
        });

        it('should set user properties', function () {
            rakam.setUserProperties({'prop': true});
            assert.propertyVal(rakam.options.userProperties, 'prop', true);
        });

        it('should merge user properties by default', function () {
            rakam.setUserProperties({'prop': true, 'prop2': true});
            assert.propertyVal(rakam.options.userProperties, 'prop', true);

            rakam.setUserProperties({'prop': false, 'prop3': false});
            assert.propertyVal(rakam.options.userProperties, 'prop', false);
            assert.propertyVal(rakam.options.userProperties, 'prop2', true);
            assert.propertyVal(rakam.options.userProperties, 'prop3', false);
        });

        it('should allow overwriting user properties', function () {
            rakam.setUserProperties({'prop': true, 'prop2': true});
            assert.propertyVal(rakam.options.userProperties, 'prop', true);

            rakam.setUserProperties({'prop': false, 'prop3': false}, true);
            assert.notProperty(rakam.options.userProperties, 'prop2');
            assert.propertyVal(rakam.options.userProperties, 'prop', false);
            assert.propertyVal(rakam.options.userProperties, 'prop3', false);
        });
    });

    describe('setDeviceId', function () {

        afterEach(function () {
            reset();
        });

        it('should change device id', function () {
            rakam.setDeviceId('deviceId');
            rakam.init(apiKey);
            assert.equal(rakam.options.deviceId, 'deviceId');
        });

        it('should not change device id if empty', function () {
            rakam.setDeviceId('');
            rakam.init(apiKey);
            assert.notEqual(rakam.options.deviceId, '');
        });

        it('should not change device id if null', function () {
            rakam.setDeviceId(null);
            rakam.init(apiKey);
            assert.notEqual(rakam.options.deviceId, null);
        });

        it('should store device id in cookie', function () {
            rakam.setDeviceId('deviceId');
            var stored = cookie.get(rakam.options.cookieName);
            assert.propertyVal(stored, 'deviceId', 'deviceId');
        });
    });

    describe('logEvent', function () {

        var clock;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            rakam.init(apiKey);
        });

        afterEach(function () {
            reset();
            clock.restore();
        });

        it('should send request', function () {
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 1);
            assert.equal(server.requests[0].url, 'http://api.rakam.com/event/batch');
            assert.equal(server.requests[0].method, 'POST');
            assert.equal(server.requests[0].async, true);
        });

        it('should reject empty event types', function () {
            rakam.logEvent();
            assert.lengthOf(server.requests, 0);
        });

        it('should send api key', function () {
            rakam.logEvent('Event Type 2');
            assert.lengthOf(server.requests, 1);
            assert.equal(JSON.parse(server.requests[0].requestBody)[0].project, apiKey);
        });

        //it('should send api version', function () {
        //    rakam.logEvent('Event Type 3');
        //    assert.lengthOf(server.requests, 1);
        //    assert.equal(server.requests[0].requestHeaders['Api-Version'], '1');
        //});

        it('should send event JSON', function () {
            rakam.logEvent('Event Type 4');
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events.length, 1);
            assert.equal(events[0].collection, 'Event Type 4');
        });

        it('should send language', function () {
            rakam.logEvent('Event Should Send Language');
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events.length, 1);
            assert.isNotNull(events[0].properties.language);
        });

        it('should accept properties', function () {
            rakam.logEvent('Event Type 5', {prop: true});
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events[0].properties.prop, true);
        });

        it('should queue events', function () {
            rakam._sending = true;
            rakam.logEvent('Event', {index: 1});
            rakam.logEvent('Event', {index: 2});
            rakam.logEvent('Event', {index: 3});
            rakam._sending = false;

            rakam.logEvent('Event', {index: 100});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 4);
            assert.equal(events[0].properties.index, 1);
            assert.equal(events[3].properties.index, 100);
        });

        it('should limit events queued', function () {
            rakam.init(apiKey, null, {savedMaxCount: 10});

            rakam._sending = true;
            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;

            rakam.logEvent('Event', {index: 100});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 10);
            assert.equal(events[0].properties.index, 6);
            assert.equal(events[9].properties.index, 100);
        });

        it('should remove only sent events', function () {
            rakam._sending = true;
            rakam.logEvent('Event', {index: 1});
            rakam.logEvent('Event', {index: 2});
            rakam._sending = false;
            rakam.logEvent('Event', {index: 3});

            server.respondWith('1');
            server.respond();

            rakam.logEvent('Event', {index: 4});

            assert.lengthOf(server.requests, 2);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 1);
            assert.equal(events[0].properties.index, 4);
        });

        it('should save events', function () {
            rakam.init(apiKey, null, {saveEvents: true});
            rakam.logEvent('Event', {index: 1});
            rakam.logEvent('Event', {index: 2});
            rakam.logEvent('Event', {index: 3});

            var rakam2 = new Rakam();
            rakam2.init(apiKey);
            assert.deepEqual(rakam2._unsentEvents, rakam._unsentEvents);
        });

        it('should not save events', function () {
            rakam.init(apiKey, null, {saveEvents: false});
            rakam.logEvent('Event', {index: 1});
            rakam.logEvent('Event', {index: 2});
            rakam.logEvent('Event', {index: 3});

            var rakam2 = new Rakam();
            rakam2.init(apiKey);
            assert.deepEqual(rakam2._unsentEvents, []);
        });

        it('should limit events sent', function () {
            rakam.init(apiKey, null, {uploadBatchSize: 10});

            rakam._sending = true;
            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;

            rakam.logEvent('Event', {index: 100});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 10);
            assert.equal(events[0].properties.index, 0);
            assert.equal(events[9].properties.index, 9);

            server.respondWith('1');
            server.respond();

            assert.lengthOf(server.requests, 2);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 6);
            assert.equal(events[0].properties.index, 10);
            assert.equal(events[5].properties.index, 100);
        });

        it('should batch events sent', function () {
            var eventUploadPeriodMillis = 10 * 1000;
            rakam.init(apiKey, null, {
                batchEvents: true,
                eventUploadThreshold: 10,
                eventUploadPeriodMillis: eventUploadPeriodMillis
            });

            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 10);
            assert.equal(events[0].properties.index, 0);
            assert.equal(events[9].properties.index, 9);

            server.respondWith('1');
            server.respond();

            assert.lengthOf(server.requests, 1);
            var unsentEvents = rakam._unsentEvents;
            assert.lengthOf(unsentEvents, 5);
            assert.equal(unsentEvents[4].event.properties.index, 14);

            // remaining 5 events should be sent by the delayed sendEvent call
            clock.tick(eventUploadPeriodMillis);
            assert.lengthOf(server.requests, 2);
            server.respondWith('1');
            server.respond();
            assert.lengthOf(rakam._unsentEvents, 0);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 5);
            assert.equal(events[4].properties.index, 14);
        });

        it('should send events after a delay', function () {
            var eventUploadPeriodMillis = 10 * 1000;
            rakam.init(apiKey, null, {
                batchEvents: true,
                eventUploadThreshold: 2,
                eventUploadPeriodMillis: eventUploadPeriodMillis
            });
            rakam.logEvent('Event');

            // saveEvent should not have been called yet
            assert.lengthOf(rakam._unsentEvents, 1);
            assert.lengthOf(server.requests, 0);

            // saveEvent should be called after delay
            clock.tick(eventUploadPeriodMillis);
            assert.lengthOf(server.requests, 1);
            server.respondWith('1');
            server.respond();
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 1);
            assert.deepEqual(events[0].collection, 'Event');
        });

        it('should not send events after a delay if no events to send', function () {
            var eventUploadPeriodMillis = 10 * 1000;
            rakam.init(apiKey, null, {
                batchEvents: true,
                eventUploadThreshold: 2,
                eventUploadPeriodMillis: eventUploadPeriodMillis
            });
            rakam.logEvent('Event1');
            rakam.logEvent('Event2');

            // saveEvent triggered by 2 event batch threshold
            assert.lengthOf(rakam._unsentEvents, 2);
            assert.lengthOf(server.requests, 1);
            server.respondWith('1');
            server.respond();
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 2);
            assert.deepEqual(events[1].collection, 'Event2');

            // saveEvent should be called after delay, but no request made
            assert.lengthOf(rakam._unsentEvents, 0);
            clock.tick(eventUploadPeriodMillis);
            assert.lengthOf(server.requests, 1);
        })

        it('should back off on 413 status', function () {
            rakam.init(apiKey, null, {uploadBatchSize: 10});

            rakam._sending = true;
            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;

            rakam.logEvent('Event', {index: 100});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 10);
            assert.equal(events[0].properties.index, 0);

            assert.equal(events[9].properties.index, 9);

            server.respondWith([413, {}, ""]);
            server.respond();

            assert.lengthOf(server.requests, 2);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 5);
            assert.equal(events[0].properties.index, 0);
            assert.equal(events[4].properties.index, 4);
        });

        it('should back off on 413 status all the way to 1 event with drops', function () {
            rakam.init(apiKey, null, {uploadBatchSize: 9});

            rakam._sending = true;
            for (var i = 0; i < 10; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;
            rakam.logEvent('Event', {index: 100});

            for (var i = 0; i < 6; i++) {
                assert.lengthOf(server.requests, i + 1);
                server.respondWith([413, {}, ""]);
                server.respond();
            }

            var events = JSON.parse(server.requests[6].requestBody);
            assert.lengthOf(events, 1);
            assert.equal(events[0].properties.index, 2);
        });

        it('should run callback if no eventType', function () {
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            }
            rakam.logEvent(null, null, callback);
            assert.equal(counter, 1);
            assert.equal(value, 0);
            assert.equal(message, 'No request sent');
        });

        it('should run callback if optout', function () {
            rakam.setOptOut(true);
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };
            rakam.logEvent('test', null, callback);
            assert.equal(counter, 1);
            assert.equal(value, 0);
            assert.equal(message, 'No request sent');
        });

        it('should not run callback if invalid callback and no eventType', function () {
            rakam.logEvent(null, null, 'invalid callback');
        });

        it('should run callback after logging event', function () {
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };
            rakam.logEvent('test', null, callback);

            // before server responds, callback should not fire
            assert.lengthOf(server.requests, 1);
            assert.equal(counter, 0);
            assert.equal(value, -1);
            assert.equal(message, '');

            // after server response, fire callback
            server.respondWith('1');
            server.respond();
            assert.equal(counter, 1);
            assert.equal(value, 200);
            assert.equal(message, '1');
        });

        it('should run callback if batchEvents but under threshold', function () {
            var eventUploadPeriodMillis = 5 * 1000;
            rakam.init(apiKey, null, {
                batchEvents: true,
                eventUploadThreshold: 2,
                eventUploadPeriodMillis: eventUploadPeriodMillis
            });
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };
            rakam.logEvent('test', null, callback);
            assert.lengthOf(server.requests, 0);
            assert.equal(counter, 1);
            assert.equal(value, 0);
            assert.equal(message, 'No request sent');

            // check that request is made after delay, but callback is not run a second time
            clock.tick(eventUploadPeriodMillis);
            assert.lengthOf(server.requests, 1);
            server.respondWith('1');
            server.respond();
            assert.equal(counter, 1);
        });

        it('should run callback once and only after all events are uploaded', function () {
            rakam.init(apiKey, null, {uploadBatchSize: 10});
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };

            // queue up 15 events, since batchsize 10, need to send in 2 batches
            rakam._sending = true;
            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;

            rakam.logEvent('Event', {index: 100}, callback);

            assert.lengthOf(server.requests, 1);
            server.respondWith('1');
            server.respond();

            // after first response received, callback should not have fired
            assert.equal(counter, 0);
            assert.equal(value, -1);
            assert.equal(message, '');

            assert.lengthOf(server.requests, 2);
            server.respondWith('1');
            server.respond();

            // after last response received, callback should fire
            assert.equal(counter, 1);
            assert.equal(value, 200);
            assert.equal(message, '1');
        });

        it('should run callback once and only after 413 resolved', function () {
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };

            // queue up 15 events
            rakam._sending = true;
            for (var i = 0; i < 15; i++) {
                rakam.logEvent('Event', {index: i});
            }
            rakam._sending = false;

            // 16th event with 413 will backoff to batches of 8
            rakam.logEvent('Event', {index: 100}, callback);

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 16);

            // after 413 response received, callback should not have fired
            server.respondWith([413, {}, ""]);
            server.respond();
            assert.equal(counter, 0);
            assert.equal(value, -1);
            assert.equal(message, '');

            // after sending first backoff batch, callback still should not have fired
            assert.lengthOf(server.requests, 2);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 8);
            server.respondWith('1');
            server.respond();
            assert.equal(counter, 0);
            assert.equal(value, -1);
            assert.equal(message, '');

            // after sending second backoff batch, callback should fire
            assert.lengthOf(server.requests, 3);
            var events = JSON.parse(server.requests[1].requestBody);
            assert.lengthOf(events, 8);
            server.respondWith('1');
            server.respond();
            assert.equal(counter, 1);
            assert.equal(value, 200);
            assert.equal(message, '1');
        });

        it('should run callback if server returns something other than 200 and 413', function () {
            var counter = 0;
            var value = -1;
            var message = '';
            var callback = function (status, response) {
                counter++;
                value = status;
                message = response;
            };

            rakam.logEvent('test', null, callback);
            server.respondWith([404, {}, 'Not found']);
            server.respond();
            assert.equal(counter, 1);
            assert.equal(value, 404);
            assert.equal(message, 'Not found');
        });

    });

    describe('optOut', function () {
        beforeEach(function () {
            rakam.init(apiKey);
        });

        afterEach(function () {
            reset();
        });

        it('should not send events while enabled', function () {
            rakam.setOptOut(true);
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 0);
        });

        it('should not send saved events while enabled', function () {
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 1);

            rakam._sending = false;
            rakam.setOptOut(true);
            rakam.init(apiKey);
            assert.lengthOf(server.requests, 1);
        });

        it('should start sending events again when disabled', function () {
            rakam.setOptOut(true);
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 0);

            rakam.setOptOut(false);
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 1);

            var events = JSON.parse(server.requests[0].requestBody);
            assert.lengthOf(events, 1);
        });

        it('should have state be persisted in the cookie', function () {
            var rakam = new Rakam();
            rakam.init(apiKey);
            assert.strictEqual(rakam.options.optOut, false);

            rakam.setOptOut(true);

            var rakam2 = new Rakam();
            rakam2.init(apiKey);
            assert.strictEqual(rakam2.options.optOut, true);
        });
    });

    describe('gatherUtm', function () {
        beforeEach(function () {
            rakam.init(apiKey);
        });

        afterEach(function () {
            reset();
        });

        it('should not send utm data when the includeUtm flag is false', function () {
            cookie.set('__utmz', '133232535.1424926227.1.1.utmcct=top&utmccn=new');
            reset();
            rakam.init(apiKey, undefined, {});

            rakam.setUserProperties({user_prop: true});
            rakam.logEvent('UTM Test Event', {});
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events[0].properties.user_utm_campaign, undefined);
            assert.equal(events[0].properties.user_utm_content, undefined);
            assert.equal(events[0].properties.user_utm_medium, undefined);
            assert.equal(events[0].properties.user_utm_source, undefined);
            assert.equal(events[0].properties.user_utm_term, undefined);
        });

        it('should send utm data when the includeUtm flag is true', function () {
            cookie.set('__utmz', '133232535.1424926227.1.1.utmcct=top&utmccn=new');
            reset();
            rakam.init(apiKey, undefined, {includeUtm: true});

            rakam.logEvent('UTM Test Event', {});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events[0].properties.user_utm_campaign, 'new');
            assert.equal(events[0].properties.user_utm_content, 'top');
        });

        it('should add utm params to the user properties', function () {
            cookie.set('__utmz', '133232535.1424926227.1.1.utmcct=top&utmccn=new');

            var utmParams = '?utm_source=rakam&utm_medium=email&utm_term=terms';
            rakam._initUtmData(utmParams);

            rakam.setUserProperties({prop: true}, true, ['prop']);
            rakam.logEvent('UTM Test Event', {});

            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events[0].properties.user_prop, true);
            assert.equal(events[0].properties.user_utm_campaign, 'new');
            assert.equal(events[0].properties.user_utm_content, 'top');
            assert.equal(events[0].properties.user_utm_medium, 'email');
            assert.equal(events[0].properties.user_utm_source, 'rakam');
            assert.equal(events[0].properties.user_utm_term, 'terms');
        });

        it('should get utm params from the query string', function () {
            var query = '?utm_source=rakam&utm_medium=email&utm_term=terms' +
                '&utm_content=top&utm_campaign=new';
            var utms = Rakam._getUtmData('', query);
            assert.deepEqual(utms, {
                utm_campaign: 'new',
                utm_content: 'top',
                utm_medium: 'email',
                utm_source: 'rakam',
                utm_term: 'terms'
            });
        });

        it('should get utm params from the cookie string', function () {
            var cookie = '133232535.1424926227.1.1.utmcsr=google|utmccn=(organic)' +
                '|utmcmd=organic|utmctr=(none)|utmcct=link';
            var utms = Rakam._getUtmData(cookie, '');
            assert.deepEqual(utms, {
                utm_campaign: '(organic)',
                utm_content: 'link',
                utm_medium: 'organic',
                utm_source: 'google',
                utm_term: '(none)'
            });
        });

        it('should prefer utm params from the query string', function () {
            var query = '?utm_source=rakam&utm_medium=email&utm_term=terms' +
                '&utm_content=top&utm_campaign=new';
            var cookie = '133232535.1424926227.1.1.utmcsr=google|utmccn=(organic)' +
                '|utmcmd=organic|utmctr=(none)|utmcct=link';
            var utms = Rakam._getUtmData(cookie, query);
            assert.deepEqual(utms, {
                utm_campaign: 'new',
                utm_content: 'top',
                utm_medium: 'email',
                utm_source: 'rakam',
                utm_term: 'terms'
            });
        });
    });

    describe('gatherReferrer', function () {
        beforeEach(function () {
            rakam.init(apiKey);
            sinon.stub(rakam, '_getReferrer').returns('https://rakam.com/contact');
        });

        afterEach(function () {
            reset();
        });

        it('should not send referrer data when the includeReferrer flag is false', function () {
            rakam.init(apiKey, undefined, {});

            rakam.setUserProperties({user_prop: true});
            rakam.logEvent('Referrer Test Event', {});
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events[0].properties.user_referrer, undefined);
        });

        //it('should send referrer data when the includeReferrer flag is true', function () {
        //    reset();
        //    rakam.init(apiKey, undefined, {includeReferrer: true});
        //
        //    rakam.logEvent('Referrer Test Event', {});
        //
        //    assert.lengthOf(server.requests, 1);
        //    var events = JSON.parse(server.requests[0].requestBody);
        //    assert.equal(events[0].properties.user_referrer, 'https://rakam.com/contact');
        //});

        //it('should add referrer data to the user properties', function () {
        //    reset();
        //    rakam.init(apiKey, undefined, {includeReferrer: true});
        //
        //    rakam.setUserProperties({prop: true}, true, ['prop']);
        //    rakam.logEvent('Referrer Test Event', {});
        //
        //    assert.lengthOf(server.requests, 1);
        //    var events = JSON.parse(server.requests[0].requestBody);
        //    assert.equal(events[0].properties.user_referrer, 'https://rakam.com/contact');
        //    assert.equal(events[0].properties.user_prop, true);
        //});
    });

    describe('sessionId', function () {

        var clock;

        beforeEach(function () {
            clock = sinon.useFakeTimers();
            rakam.init(apiKey);
        });

        afterEach(function () {
            reset();
            clock.restore();
        });

        it('should create new session IDs on timeout', function () {
            var sessionId = rakam._sessionId;
            clock.tick(30 * 60 * 1000 + 1);
            rakam.logEvent('Event Type 1');
            assert.lengthOf(server.requests, 1);
            var events = JSON.parse(server.requests[0].requestBody);
            assert.equal(events.length, 1);
            assert.notEqual(events[0].session_id, sessionId);
            assert.notEqual(rakam._sessionId, sessionId);
            assert.equal(events[0].properties.session_id, rakam._sessionId);
        });
    });
});
