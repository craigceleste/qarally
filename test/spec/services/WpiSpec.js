'use strict';

describe('Service Wpi', function() {

  var wpiSvc; // unit under test

  var mockWindow, $rootScope, $httpBackend;

  beforeEach(function(){

    module('qa-rally');

    mockWindow = {
      localStorage: {}
    };

    module(function($provide){
      $provide.value('$window', mockWindow);
    });

    inject(function(Wpi, _$rootScope_, $injector){
      $rootScope = _$rootScope_;
      $httpBackend = $injector.get('$httpBackend');

      wpiSvc = Wpi;
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
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

      expect(wpi.id).toBeDefined();
      expect(wpi.label).toEqual(wpiSvc.defaultWpiLabel);
      expect(wpiSvc.clearFilter).toHaveBeenCalled();

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

      expect(wpi.filter.nameContains).toEqual('');
      expect(wpi.filter.withoutTestFolder).toEqual(false);
      expect(wpi.filter.withoutWorkProduct).toEqual(false);
      expect(wpi.filter.workProducts).toBeDefined();
      expect(wpi.filter.testFolders).toBeDefined();
    });

  });

  describe('wpiIsValid', function() {

    it('validates a WPI.', function() {

      // Multiple tests in 1 (bad but easy)

      // Valid
      
      expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: 'set', label: 'set'})).toBe(true);

      // Invalid

      expect(wpiSvc.wpiIsValid(null)).toBe(false);
      expect(wpiSvc.wpiIsValid(undefined)).toBe(false);
      expect(wpiSvc.wpiIsValid({})).toBe(false);

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

      mockWindow.localStorage.wpiList = JSON.stringify({
        version: 1,
        data:{my:'list'}
      });

      // Act

      var wpi = wpiSvc.getList();

      // Assert

      expect(wpi).toEqual({
        my: 'list',
        test1: '1 to 2',
        test2: '2 to 3'
      });
    });

  });

  describe('getList', function() {

    it('upgrade from 2 to current.', function() {

      // Arrange

      mockWindow.localStorage.wpiList = JSON.stringify({
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

  });

  describe('getList', function() {

    it('upgrade from 2 to current.', function() {

      // Arrange

      mockWindow.localStorage.wpiList = JSON.stringify({
        version: 555,
        data:{my:'list'}
      });

      // Act

      function shouldThrow() { wpiSvc.getList(); }

      // Assert

      expect(shouldThrow).toThrow();
    });

  });

  describe('refreshTestSets', function() {

    it('will clear, then asynchronously reload the test sets of a wpi.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      var wpi = {
        workspaceRef: fakeBackend.workspaceList.data.QueryResult.Results[0]._ref,
        projectRef:   fakeBackend.projectList  .data.QueryResult.Results[0]._ref,
        iterationRef: fakeBackend.iterationList.data.QueryResult.Results[0]._ref,
        testSets: 'something', // <----- will be cleared
        testSetRef: 'something else' // <----- will be cleared
      };

      // Act

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data) {
        wpiOut = data;
      });

      // Assert

      // It should clear out the test sets while it's loading

      expect(wpi.testSets).not.toBeDefined();
      expect(wpi.testSetRef).not.toBeDefined();

      // simulate async http completing

      $httpBackend.flush();

      // It should echo back the wpi in the promise, having populated the testSetDetails

      expect(wpiOut).toBe(wpi);
      var testSetRef = fakeBackend.testSetsList.data.QueryResult.Results[0]._ref;
      expect(wpi.testSets[testSetRef]._ref).toEqual(testSetRef);
      expect(wpi.testSetRef).toEqual(testSetRef);
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

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      var wpi = {
        workspaceRef: fakeBackend.workspaceList.data.QueryResult.Results[0]._ref,
        projectRef:   fakeBackend.projectList  .data.QueryResult.Results[0]._ref,
        iterationRef: fakeBackend.iterationList.data.QueryResult.Results[0]._ref,
      };

      // Act: someone calls the function to fetch test sets for an iteration.

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data) {
        wpiOut = data;
      });

      // Act: before $http completes, different code concurrently edits the wpi.

      wpi.iterationRef = 'something different';

      $httpBackend.flush(); // simulate async http completing

      // Assert: the function should discard the requested data if it is stale.

      expect(wpi.testSets).not.toBeDefined();
      expect(wpi.testSetRef).not.toBeDefined();

    });

    it('sets current test set to undefined, if the query returned 0 test sets.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.testSetsList.data.QueryResult.Results = []; // delete stock test results
      fakeBackend.setup($httpBackend);

      var wpi = {
        workspaceRef: fakeBackend.workspaceList.data.QueryResult.Results[0]._ref,
        projectRef:   fakeBackend.projectList  .data.QueryResult.Results[0]._ref,
        iterationRef: fakeBackend.iterationList.data.QueryResult.Results[0]._ref,
      };

      // Act

      var wpiOut;
      wpiSvc.refreshTestSets(wpi).then(function(data) {
        wpiOut = data;
      });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(wpi.testSets).toEqual({ }); // empty list
      expect(wpi.testSetRef).not.toBeDefined(); // no current one

    });

  });

});



