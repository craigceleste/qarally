'use strict';

describe('Rally', function(){

  // unit under test
  var rallySvc;

  // Dependency Injections
  var mockWindow, $rootScope, $httpBackend;

  beforeEach(function() {

    module('qa-rally');

    mockWindow = { localStorage: {} };

    module(function($provide) {
      $provide.value('$window', mockWindow);
    });

    inject(function(_$rootScope_, $injector) {
      $rootScope = _$rootScope_;
      $httpBackend = $injector.get('$httpBackend');
    });

    inject(function(Rally) {
      rallySvc = Rally;
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('is wired for construction.', function() {
    expect(rallySvc).toBeDefined();
  });

  describe('getSubscriptionData', function() {

    it('prepares the request correctly and extracts data correctly from the response.', function() {

      // Arrange

      var subscriptionData;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc._getSubscriptionData()
        .then(function(data) { subscriptionData = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(subscriptionData._ref).toEqual(fakeBackend.subscription.data.Subscription._ref);
      expect(subscriptionData.workspacesRef).toEqual(fakeBackend.subscription.data.Subscription.Workspaces._ref);
    });

  });

  describe('getWorkspaceList', function() {

    it('prepares the request correctly and extracts data correctly from the response.', function() {

      // Arrange

      var workspaceList;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc._getWorkspaceList(fakeBackend.workspaceList.inputs.workspacesRef)
        .then(function(data) { workspaceList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(workspaceList.length).toEqual(fakeBackend.workspaceList.data.QueryResult.Results.length);
      expect(workspaceList[0]._ref).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0]._ref);
      expect(workspaceList[0].name).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Name);
      expect(workspaceList[0].projectsRef).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Projects._ref);
    });

  });

  describe('getProjectList', function() {

    it('prepares request correctly and extracts data correctly from the response.', function() {

      // Arrange

      var projectList;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc._getProjectList(fakeBackend.projectList.inputs.projectsRef)
        .then(function(data) { projectList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(projectList.length).toEqual(fakeBackend.projectList.data.QueryResult.Results.length);
      expect(projectList[0]._ref).toEqual(fakeBackend.projectList.data.QueryResult.Results[0]._ref);
      expect(projectList[0].name).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Name);
      expect(projectList[0].iterationsRef).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Iterations._ref);
    });

  });

  describe('getIterationList', function() {

    it('prepares request correctly and extracts data correctly from the response.', function() {

      // Arrange

      var iterationList;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc._getIterationList(fakeBackend.iterationList.inputs.iterationsRef)
        .then(function(data) { iterationList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(iterationList.length).toEqual(fakeBackend.iterationList.data.QueryResult.Results.length);
      expect(iterationList[0]._ref).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0]._ref);
      expect(iterationList[0].name).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].Name);
      expect(iterationList[0].startDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].StartDate);
      expect(iterationList[0].endDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].EndDate);
    });

  });

  describe('getAllSubscriptionData', function() {

    it('traverses the promises correctly and aggregates data correctly', function() {

      // Arrange

      var subscriptionData;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc._getAllSubscriptionData()
        .then(function(data) { subscriptionData = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(subscriptionData._ref).toEqual(fakeBackend.subscription.data.Subscription._ref);
      expect(subscriptionData.workspacesRef).toEqual(fakeBackend.subscription.data.Subscription.Workspaces._ref);

      var workspaceRef = fakeBackend.workspaceList.data.QueryResult.Results[0]._ref;
      expect(subscriptionData.workspaces[workspaceRef]._ref).toEqual(workspaceRef);
      expect(subscriptionData.workspaces[workspaceRef].name).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Name);
      expect(subscriptionData.workspaces[workspaceRef].projectsRef).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Projects._ref);

      var projectRef = fakeBackend.projectList.data.QueryResult.Results[0]._ref;
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef]._ref).toEqual(projectRef);
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].name).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Name);
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterationsRef).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Iterations._ref);

      var iterationRef = fakeBackend.iterationList.data.QueryResult.Results[0]._ref;
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef]._ref).toEqual(iterationRef);
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].name).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].Name);
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].startDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].StartDate);
      expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].endDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].EndDate);
    });

  });

  describe('initSubscriptionData', function() {

    it('will return cached data.', function(){

      // Arrange

      mockWindow.localStorage.subscriptionData = JSON.stringify({
        version: 3,
        data: 'from cache'
      });

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData().then(function(data) {
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from cache');
    });

  });

  describe('initSubscriptionData', function() {

    it('will fetch from service.', function() {

      // Arrange

      delete mockWindow.localStorage.subscriptionData; // redundant, but... it's not cached.

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn({
        then: function(thenCallback) {
          thenCallback('from service');
        }
      });

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData().then(function(data){
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from service');
    });

  });

  describe('initSubscriptionData', function() {

    it('can be foreced to ignoreCache.', function() {

      // Arrange

      mockWindow.localStorage.subscriptionData = JSON.stringify({
        version: 3,
        data: 'from cache'
      });

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn({
        then: function(thenCallback) {
          thenCallback('from service');
        }
      });

      var ignoreCache = true;

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData(ignoreCache).then(function(data){
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from service');
    });

  });

  describe('getTestSetList', function() {

    it('makes the request and handles the response correctly.', function() {

      // Arrange

      var resultData;
      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      rallySvc.getTestSetList(fakeBackend.testSetsList.inputs.workspaceRef, fakeBackend.testSetsList.inputs.iterationRef)
        .then(function(data) { resultData = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(resultData.iterationRef).toEqual(fakeBackend.testSetsList.inputs.iterationRef);
      expect(resultData.testSets[fakeBackend.testSetsList.data.QueryResult.Results[0]._ref]._ref).toEqual(fakeBackend.testSetsList.data.QueryResult.Results[0]._ref);
      expect(resultData.testSets[fakeBackend.testSetsList.data.QueryResult.Results[0]._ref].name).toEqual(fakeBackend.testSetsList.data.QueryResult.Results[0]._refObjectName);

    });

  });

  describe('initTestSetDetails', function() {

    // Cheat: capture the cached data in the first test,
    // re-use it in the second test
    var cachedTestSetDetails;

    it('will fetch from $http if not cached.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0]._ref);
      expect(testSetDetails.testCases[0].Description             ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Description);
      expect(testSetDetails.testCases[0].FormattedID             ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].FormattedID);
      expect(testSetDetails.testCases[0].Name                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Name);
      expect(testSetDetails.testCases[0].Notes                   ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Notes);
      expect(testSetDetails.testCases[0].ObjectId                ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ObjectId);
      expect(testSetDetails.testCases[0].Objective               ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Objective);
      expect(testSetDetails.testCases[0].PostConditions          ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].PostConditions);
      expect(testSetDetails.testCases[0].PreConditions           ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].PreConditions);
      expect(testSetDetails.testCases[0].TestFolderRef           ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder._ref);
      expect(testSetDetails.testCases[0].Type                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Type);
      expect(testSetDetails.testCases[0].ValidationExpectedResult).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ValidationExpectedResult);
      expect(testSetDetails.testCases[0].ValidationInput         ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ValidationInput);
      expect(testSetDetails.testCases[0].WorkProductRef          ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct._ref);

      // Hack: I feel (but probably am wrong) that it makes the tests fragile to hard code knowledge about internal cache format.
      // So long as it can cache it, and decache it, and it's in the right format, we should be good.
      // To that end, capture the minified version that this test caches, and use it in the next test to decache it.

      cachedTestSetDetails = mockWindow.localStorage['tsd_' + fakeBackend.testSetDetails.inputs.testSetRef];
      expect(cachedTestSetDetails).toBeDefined();
    });

    it('will fetch from cache.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      // not setup --> fakeBackend.setup($httpBackend);

      mockWindow.localStorage['tsd_' + fakeBackend.testSetDetails.inputs.testSetRef] = cachedTestSetDetails;

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(testSetDetails.testCases[0]._ref                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0]._ref);
      expect(testSetDetails.testCases[0].Description             ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Description);
      expect(testSetDetails.testCases[0].FormattedID             ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].FormattedID);
      expect(testSetDetails.testCases[0].Name                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Name);
      expect(testSetDetails.testCases[0].Notes                   ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Notes);
      expect(testSetDetails.testCases[0].ObjectId                ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ObjectId);
      expect(testSetDetails.testCases[0].Objective               ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Objective);
      expect(testSetDetails.testCases[0].PostConditions          ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].PostConditions);
      expect(testSetDetails.testCases[0].PreConditions           ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].PreConditions);
      expect(testSetDetails.testCases[0].TestFolderRef           ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder._ref);
      expect(testSetDetails.testCases[0].Type                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].Type);
      expect(testSetDetails.testCases[0].ValidationExpectedResult).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ValidationExpectedResult);
      expect(testSetDetails.testCases[0].ValidationInput         ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].ValidationInput);
      expect(testSetDetails.testCases[0].WorkProductRef          ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct._ref);

    });
    
  });

  describe('getTestCaseResultsForTestSet', function() {

    it('parses the response correctly.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.setup($httpBackend);

      // Act

      var testResults;
      rallySvc.getTestCaseResultsForTestSet(fakeBackend.testCasesByTestSet.inputs.testSetRef)
      .then(function(data) {
        testResults = data;
      });

      $httpBackend.flush(); // simulate async http completing

      // Assert

    });

  });

});




