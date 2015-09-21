describe('Snippet', function() {

  it('rakam object should exist', function() {
    assert.isObject(window);
    assert.isObject(window.rakam);
    assert.isFunction(window.rakam.init);
    assert.isFunction(window.rakam.logEvent);
  });

  it('rakam object should proxy functions', function() {
    rakam.init("API_KEY");
    rakam.logEvent("Event", {prop: 1});
    assert.lengthOf(rakam._q, 2);
    assert.deepEqual(rakam._q[0], ["init", "API_KEY"]);
  });

});