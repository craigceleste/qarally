'use strict';

describe('The WPI Service', function() {

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

  it('defaultWpiLabel is defined.', function() {
    // Expecting it to be a particular value makes the test fragile.
    expect(typeof wpiSvc.defaultWpiLabel).toEqual('string');
  });

  it('createWpi creates a blank wpi', function(){

    spyOn(wpiSvc, 'clearFilter').andCallThrough();

    var wpi = wpiSvc.createWpi();

    expect(wpi.id).toBeDefined();
    expect(wpi.label).toEqual(wpiSvc.defaultWpiLabel);
    expect(wpiSvc.clearFilter).toHaveBeenCalled();

  });

  it('clearFilter clears the filter.', function() {

    var wpi = {};

    wpiSvc.clearFilter(wpi);

    expect(wpi.filter.nameContains).toEqual('');
    expect(wpi.filter.withoutTestFolder).toEqual(false);
    expect(wpi.filter.withoutWorkProduct).toEqual(false);
    expect(wpi.filter.workProducts).toBeDefined();
    expect(wpi.filter.testFolders).toBeDefined();
  });

  it('wpiIsValid validates a WPI.', function() {

    expect(wpiSvc.wpiIsValid(null)).toBe(false);
    expect(wpiSvc.wpiIsValid(undefined)).toBe(false);
    expect(wpiSvc.wpiIsValid({})).toBe(false);

    expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: 'set', label: 'set'})).toBe(true);

    expect(wpiSvc.wpiIsValid({workspaceRef: '',    projectRef: 'set', iterationRef: 'set', label: 'set'})).toBe(false);
    expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: '',    iterationRef: 'set', label: 'set'})).toBe(false);
    expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: '',    label: 'set'})).toBe(false);
    expect(wpiSvc.wpiIsValid({workspaceRef: 'set', projectRef: 'set', iterationRef: 'set', label: ''   })).toBe(false);
  });

  it ('setCurrentId and getCurrentId saves and retrieves to local storage.', function() {

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

  it('setList saves the list to local storage, and getList retrieves it.', function() {

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

  it('getList upgrade from 1 to current.', function() {
    mockWindow.localStorage.wpiList = JSON.stringify({
      version: 1,
      data:{my:'list'}
    });

    var wpi = wpiSvc.getList();

    expect(wpi).toEqual({
      my: 'list',
      test1: '1 to 2',
      test2: '2 to 3'
    });
  });

  it('getList upgrade from 2 to current.', function() {
    mockWindow.localStorage.wpiList = JSON.stringify({
      version: 2,
      data:{my:'list'}
    });

    var wpi = wpiSvc.getList();

    expect(wpi).toEqual({
      my: 'list',
      test2: '2 to 3'
    });
  });

  it('getList upgrade from 2 to current.', function() {
    mockWindow.localStorage.wpiList = JSON.stringify({
      version: 555,
      data:{my:'list'}
    });

    expect(function () { wpiSvc.getList(); }).toThrow();
  });

  it('refreshTestSets will clear, then asynchronously reload the test sets of a wpi.', function() {

    var fakeBackend = window.fakeBackendFactory.create();
    fakeBackend.setup($httpBackend);

    // start with a WPI pointing to an iteration.

    var wpi = {
      workspaceRef: fakeBackend.workspaceList.data.QueryResult.Results[0]._ref,
      projectRef:   fakeBackend.projectList  .data.QueryResult.Results[0]._ref,
      iterationRef: fakeBackend.iterationList.data.QueryResult.Results[0]._ref,
      testSets: 'something',
      testSetRef: 'something else'
    };

    var wpiOut;
    wpiSvc.refreshTestSets(wpi).then(function(data) {
      wpiOut = data;
    });

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

  it('refreshTestSets ignores nulls.', function() {

    var wpi = 'whatever';

    var wpiOut;
    wpiSvc.refreshTestSets(wpi).then(function(data){
      wpiOut = data;
    });

    $rootScope.$apply(); // resolve $q promises

    expect(wpiOut).toBe(wpi);

  });
});



