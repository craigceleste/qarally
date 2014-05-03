'use strict';

describe('Service Wpi', function() {

  // Unit under test
  var wpiSvc;

  // Dependency Injections
  var mockWindow, $rootScope, $q, rallySvc;

  // Fakes
  var rallyFakes; // inputs
  var wpiFakes;   // expected results

  beforeEach(function(){

    // Load app

    module('QaRally');

    // Inject mock services into provider

    mockWindow = { localStorage: {} };

    module(function($provide) {
      $provide.value('$window', mockWindow);
    });

    // Get a reference to services

    inject(function(_$rootScope_, _$q_, $injector, Rally, Wpi) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      rallySvc = Rally;
      wpiSvc = Wpi;
    });

    // Create fake factories

    rallyFakes = window.rallyServiceFakes.create();
    wpiFakes = window.wpiServiceFakes.create();
  });


  it('is wired for construction.', function() {
    expect(wpiSvc).toBeDefined();
  });


  describe('defaultWpiLabel', function() {

    it('is defined.', function() {
      
      // Looking at a particular value makes the test fragile. Just make sure it's set.

      expect(typeof wpiSvc.defaultWpiLabel).toEqual('string');
    });

  });


  describe('createWpi', function() {

    it('creates a blank wpi', function(){

      // Arrange

      spyOn(wpiSvc, 'clearFilter').andCallThrough();

      // Act

      var wpi = wpiSvc.createWpi();

      // Assert

      expect(typeof wpi.id).toEqual('string');
      wpi.id = (wpiFakes.createWpi.id); // real id is non-deterministic. push it to the expected result
      expect(wpi).toEqual(wpiFakes.createWpi);

    });

  });


  describe('clearFilter', function() {

    it('does not fail if there is no wpi.', function() {

      wpiSvc.clearFilter(undefined); // ...does not cause an exception.

    });

    it('clears the filter of the passed-in wpi.', function() {

      // Arrange

      var wpi = {};

      // Act

      wpiSvc.clearFilter(wpi);

      // Assert

      expect(wpi.filter).toEqual(wpiFakes.createWpi.filter);
    });

  });


  describe('wpiIsValid', function() {

    it('validates a WPI.', function() {

      // Multiple tests in 1 (bad but easy)

      // Valid
      
      expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: 'set', label: 'set'})).toBe(true);

      // Invalid

      expect(wpiSvc.wpiIsValid(null))     .toBe(false);
      expect(wpiSvc.wpiIsValid(undefined)).toBe(false);
      expect(wpiSvc.wpiIsValid({}))       .toBe(false);

      expect(wpiSvc.wpiIsValid({workspaceRef: '',    projectRef: 'set', iterationRef: 'set', label: 'set'})).toBe(false);
      expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: '',    iterationRef: 'set', label: 'set'})).toBe(false);
      expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: '',    label: 'set'})).toBe(false);
      expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: 'set', label: ''   })).toBe(false);
    });

  });


  describe('setCurrentId', function() {

    it ('and getCurrentId saves and retrieves to local storage.', function() {

      // Testing set and get in the same test allow tests to not care about the internal storage format,
      // only that once saved it can restore the correct state.

      mockWindow.localStorage = {};

      wpiSvc.setCurrentId(555);
      expect(wpiSvc.getCurrentId()).toBe(555);
      expect(Object.keys(mockWindow.localStorage).length).toBeGreaterThan(0); // this test should not know the key or storage format. only that it stored something and retrieved it correctly.

      wpiSvc.setCurrentId('some string');
      expect(wpiSvc.getCurrentId()).toBe('some string');
      expect(Object.keys(mockWindow.localStorage).length).toBeGreaterThan(0);

      wpiSvc.setCurrentId(''); // any falsey value
      expect(wpiSvc.getCurrentId()).not.toBeDefined();
      expect(Object.keys(mockWindow.localStorage).length).toEqual(0);
    });

  });


  describe('setList', function() {

    it('saves the list to local storage, and getList retrieves it.', function() {

      mockWindow.localStorage = {};

      // Set then get some object. It returns the same one.

      var expected = {my:'list'};
      wpiSvc.setList(expected);
      expect(Object.keys(mockWindow.localStorage).length).toBeGreaterThan(0);

      var actual = wpiSvc.getList();
      expect(actual).toEqual(expected);

      // Set then get null/undefined. It returns an empty object.

      wpiSvc.setList(null); // any falsey value, really
      expect(Object.keys(mockWindow.localStorage).length).toEqual(0);

      actual = wpiSvc.getList();
      expect(actual).toEqual({});
    });

  });


  describe('getList', function() {

    it('upgrade from 1 to current.', function() {

      // Arrange

      mockWindow.localStorage.wpiList = angular.toJson({
        version: 1,
        data:{my:'list'}
      });

      // Act

      var wpi = wpiSvc.getList();

      // Assert

      expect(wpi).toEqual({
        my: 'list',               // <-- existing value
        test1: '1 to 2',          // <-- got transformed
        test2: '2 to 3'
      });
    });

    it('upgrade from 2 to current.', function() {

      // Arrange

      mockWindow.localStorage.wpiList = angular.toJson({
        version: 2,
        data:{my:'list'}
      });

      // Act

      var wpi = wpiSvc.getList();

      // Assert

      expect(wpi).toEqual({
        my: 'list',
        test2: '2 to 3'
      });
    });

    it('throws for unrecognized version.', function() {

      // Arrange

      mockWindow.localStorage.wpiList = angular.toJson({
        version: 555,
        data:{my:'list'}
      });

      // Act

      function shouldThrow() { wpiSvc.getList(); }

      // Assert

      // wpiList contains user data 
      expect(shouldThrow).toThrow();
    });

  });


  describe('refreshTestSets', function() {

    it('will clear, then asynchronously reload the test sets of a wpi.', function() {

      // Arrange


      var wpi = angular.extend(wpiFakes.createWpi, {
        workspaceRef: rallyFakes.getWorkspaceList[0]._ref,
        projectRef:   rallyFakes.getProjectList[0]._ref,
        iterationRef: rallyFakes.getIterationList[0]._ref,
        testSets: 'something',       // <----- will be cleared
        testSetRef: 'something else' // <----- will be cleared
      });

      spyOn(rallySvc, 'getTestSetList').andReturn($q.when(rallyFakes.getTestSetList));

      // Act

      var wpiOut;
      wpiSvc.refreshTestSets(wpi)
        .then(function(data) { wpiOut = data; });

      // Assert: it should clear out the test sets while it's loading

      expect(wpi.testSets).not.toBeDefined();
      expect(wpi.testSetRef).not.toBeDefined();

      // Act: simulate async http completing

      $rootScope.$apply();

      // Assert
      
      expect(wpiOut).toBe(wpi); // echo's back wpi
      expect(wpiOut).toEqual(wpiFakes.refreshTestSets);

    });

    it('silently ignores it when there is no current wpi.', function() {

      // TODO review if this case is required. You shouldn't be using this function when there isn't a current wpi.

      wpiSvc.refreshTestSets(undefined); // ...to not throw an error

    });

    it('silently ignores it when there the current wpi has no iteration.', function() {

      var wpi = {
        // no iteration here
      };

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data){
        wpiOut = data;
      });

      $rootScope.$apply(); // resolve $q promises

      expect(wpiOut).toBe(wpi); // ...and having not blown up

    });

    it('silently ignores concurrency errors.', function() {

      // Arrange

      var wpi = angular.extend(wpiFakes.createWpi, {
        workspaceRef: rallyFakes.getWorkspaceList[0]._ref,
        projectRef:   rallyFakes.getProjectList[0]._ref,
        iterationRef: rallyFakes.getIterationList[0]._ref
      });

      spyOn(rallySvc, 'getTestSetList').andReturn($q.when(rallyFakes.getTestSetList));

      // Act: someone calls the function to fetch test sets for an iteration.

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data) {
        wpiOut = data;
      });

      // Act: before $http completes, different code concurrently edits the wpi.

      wpi.iterationRef = 'something different';

      $rootScope.$apply(); // simulate async http completing

      // Assert: the function should discard the requested data if it is stale.

      expect(wpi.testSets).not.toBeDefined();
      expect(wpi.testSetRef).not.toBeDefined();

    });

    it('sets current test set to undefined, if the query returned 0 test sets.', function() {

      // Arrange

      var wpi = angular.extend(wpiFakes.createWpi, {
        workspaceRef: rallyFakes.getWorkspaceList[0]._ref,
        projectRef:   rallyFakes.getProjectList[0]._ref,
        iterationRef: rallyFakes.getIterationList[0]._ref
      });

      var serverData = rallyFakes.getTestSetList;
      serverData.testSets = {}; // <-- no results

      spyOn(rallySvc, 'getTestSetList').andReturn($q.when(serverData));

      // Act

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data) {
        wpiOut = data;
      });

      $rootScope.$apply(); // simulate async http completing

      // Assert

      expect(wpi.testSets).toEqual({ }); // empty list
      expect(wpi.testSetRef).not.toBeDefined(); // no current one

    });

  });

});



