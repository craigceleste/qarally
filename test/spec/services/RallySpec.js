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

  // this is not meant to be robust.

  function deepCopy(x) {
    return JSON.parse(JSON.stringify(x));
  }

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
        version: rallySvc._subscriptionDataVersion,
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

    it('will fetch from the service.', function() {

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

    it('can be foreced to ignoreCache.', function() {

      // Arrange

      mockWindow.localStorage.subscriptionData = JSON.stringify({
        version: rallySvc._subscriptionDataVersion,
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

    it('will reject the cache if it is an older version.', function() {

      // Arrange

      mockWindow.localStorage.subscriptionData = JSON.stringify({
        version: rallySvc._subscriptionDataVersion - 1, // older version in the cache
        data: 'from cache'
      });

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn({
        then: function(thenCallback) {
          thenCallback('from service'); // new version from the service
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

      var testFolderRef = fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder._ref;
      expect(testSetDetails.testFolders[testFolderRef]._ref).toEqual(testFolderRef);
      expect(testSetDetails.testFolders[testFolderRef].Name).toEqual('My Folder');

      var workProductRef = fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct._ref;
      expect(testSetDetails.workProducts[workProductRef]._ref).toEqual(workProductRef);
      expect(testSetDetails.workProducts[workProductRef].Name).toEqual('My User Story');

      // Hack: I feel (but probably am wrong) that it makes the tests fragile to hard code knowledge about internal cache format.
      // So long as it can cache it, and decache it, and it's in the right format, we should be good.
      // To that end, capture the minified version that this test caches, and use it in the next test to decache it.
      // TODO this is a sin for conventional unit tests, but jasmine is guaranteed to be sequential execution, so maybe it isn't so bad here. We'll see...

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

      var testFolderRef = fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder._ref;
      expect(testSetDetails.testFolders[testFolderRef]._ref).toEqual(testFolderRef);
      expect(testSetDetails.testFolders[testFolderRef].Name).toEqual('My Folder');

      var workProductRef = fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct._ref;
      expect(testSetDetails.workProducts[workProductRef]._ref).toEqual(workProductRef);
      expect(testSetDetails.workProducts[workProductRef].Name).toEqual('My User Story');

    });
    
    it('will map test cases without a test folder or test set.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder = null;
      fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct = null;
      fakeBackend.setup($httpBackend);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0]._ref);
      expect(testSetDetails.testCases[0].TestFolderRef           ).not.toBeDefined();
      expect(testSetDetails.testCases[0].WorkProductRef          ).not.toBeDefined();

    });

    it('will map test cases without a test folder or test set.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder = null;
      fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct = null;
      fakeBackend.setup($httpBackend);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref                    ).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0]._ref);
      expect(testSetDetails.testCases[0].TestFolderRef           ).not.toBeDefined();
      expect(testSetDetails.testCases[0].WorkProductRef          ).not.toBeDefined();

    });

    it('will correctly handle multiple test cases with the same grouping.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();

      fakeBackend.testCaseList.data.QueryResult.Results.push(
        deepCopy(fakeBackend.testCaseList.data.QueryResult.Results[0])); // copy of existing item
      fakeBackend.testCaseList.data.QueryResult.Results[0]._ref = 'ref0'; // give them unique ids
      fakeBackend.testCaseList.data.QueryResult.Results[1]._ref = 'ref1';

      fakeBackend.setup($httpBackend);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref).toEqual('ref0'); // tc's made it in the list
      expect(testSetDetails.testCases[1]._ref).toEqual('ref1');

      expect(Object.keys(testSetDetails.testFolders).length).toEqual(1); // groupings are shared
      expect(Object.keys(testSetDetails.workProducts).length).toEqual(1);

      var testFolderRef = fakeBackend.testCaseList.data.QueryResult.Results[0].TestFolder._ref;
      expect(testSetDetails.testFolders[testFolderRef]._ref).toEqual(testFolderRef);
      expect(testSetDetails.testFolders[testFolderRef].Name).toEqual('My Folder');

      var workProductRef = fakeBackend.testCaseList.data.QueryResult.Results[0].WorkProduct._ref;
      expect(testSetDetails.workProducts[workProductRef]._ref).toEqual(workProductRef);
      expect(testSetDetails.workProducts[workProductRef].Name).toEqual('My User Story');
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

      // testResults is an object keyed on testCaseRef. There is 1 test case.
      expect(Object.keys(testResults).length).toEqual(1);

      // Pull the TestCaseResult original from the mock data
      var trExpected = fakeBackend.testCasesByTestSet.data.QueryResult.Results[0];

      // testResults is keyed on test case. Pull the structure for the TC
      var tcActual = testResults[trExpected.TestCase._ref];

      // The TC result object has a collection of all results. Pull this one.
      var trActual = tcActual.all[0];
      expect(trActual._ref          ).toEqual(trExpected._ref);
      expect(trActual.TestCaseRef   ).toEqual(trExpected.TestCase._ref);
      expect(trActual.CreationDate  ).toEqual(new Date(trExpected.CreationDate));
      expect(trActual.Build         ).toEqual(trExpected.Build);
      expect(trActual.TesterName    ).toEqual(trExpected.Tester._refObjectName);
      expect(trActual.Verdict       ).toEqual(trExpected.Verdict);
      expect(trActual.Notes         ).toEqual(trExpected.Notes);
    });

    it('sorts multiple TestCaseResult objects for the same TestCase.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();

      // duplicate the mock test case result
      var tcr0 = fakeBackend.testCasesByTestSet.data.QueryResult.Results[0];
      var tcr1 = deepCopy(tcr0);
      var tcr2 = deepCopy(tcr0);
      
      tcr1._ref = 'new key';
      tcr2._ref = 'another key';

      fakeBackend.testCasesByTestSet.data.QueryResult.Results.push(tcr1);
      fakeBackend.testCasesByTestSet.data.QueryResult.Results.push(tcr2);

      tcr0.CreationDate = '2014-01-08T20:10:31.089Z'; // <-- middle date
      tcr1.CreationDate = '2014-01-09T20:10:31.089Z'; // <-- more recent
      tcr2.CreationDate = '2014-01-07T20:10:31.089Z'; // <-- least recent

      fakeBackend.setup($httpBackend);

      // Act

      var testResults;
      rallySvc.getTestCaseResultsForTestSet(fakeBackend.testCasesByTestSet.inputs.testSetRef)
      .then(function(data) {
        testResults = data;
      });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(Object.keys(testResults).length).toEqual(1);  // 1 TC...
      var tcActual = testResults[tcr0.TestCase._ref];
      expect(tcActual.all.length).toEqual(3);              // ...with multiple TR's

      // The one with the more recent CreationDate is at .mostRecent
      expect(tcActual.mostRecent.CreationDate).toEqual(new Date(tcr1.CreationDate));

    });

    it('supports multiple pages.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();

      var page1Data = fakeBackend.testCasesByTestSet.data;
      page1Data.QueryResult.TotalResultCount = 210;
      page1Data.QueryResult.PageSize = 200; // a lie, but that's okay

      var page2Data = deepCopy(page1Data); // copy page1Data

      page2Data.QueryResult.StartIndex = 201;
      page2Data.QueryResult.Results[0]._ref = 'different id';
      page2Data.QueryResult.Results[0].TestCase._ref = 'different tc for fun';

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult?jsonp=JSON_CALLBACK&query=(TestSet%20%3D%20https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Ftestset%2Faf931b07-a8d0-4157-87a3-9772e435a8da)&pagesize=200&start=201&fetch=true')
        .respond(page2Data);

      fakeBackend.setup($httpBackend);

      // Act

      var testResults;
      rallySvc.getTestCaseResultsForTestSet(fakeBackend.testCasesByTestSet.inputs.testSetRef)
      .then(function(data) {
        testResults = data;
      });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      // 2 TC's...
      expect(Object.keys(testResults).length).toEqual(2);
      var tc1 = testResults[page1Data.QueryResult.Results[0].TestCase._ref];
      var tc2 = testResults[page2Data.QueryResult.Results[0].TestCase._ref];

      // With the right TR in each one
      expect(tc1.all[0]._ref).toEqual(page1Data.QueryResult.Results[0]._ref);
      expect(tc2.all[0]._ref).toEqual(page2Data.QueryResult.Results[0]._ref);

    });

  });

});




