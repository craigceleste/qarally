'use strict';

describe('Service Settings', function() {

  var settingsSvc; // object under test

  var mockWindow; // DI's

  beforeEach(function(){

    module('QaRally');

    mockWindow = { localStorage: {} };

    module(function($provide){
      $provide.value('$window', mockWindow);
    });

    inject(function(Settings){
      settingsSvc = Settings;
    });

  });

  it('will set/get/delete a simple JavaScript object to localStorage.', function(){

    expect(settingsSvc).toBeDefined();

    // Set an object

    var expected = {mySetting: 'setting'};
    settingsSvc.set(expected);

    // Get to compare it

    var actual = settingsSvc.get();
    expect(angular.toJson(actual)).toBe(angular.toJson(expected)); // cheap way to deep compare

    // Set undefined

    settingsSvc.set(undefined);

    // Get to compare it

    actual = settingsSvc.get();
    expect(angular.toJson(actual)).toBe(angular.toJson({})); // get will return empty object if not present

  });

});
