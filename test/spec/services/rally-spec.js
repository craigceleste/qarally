'use strict';

describe('Service Rally', function(){

  // unit under test
  var rallySvc;

  // Dependency Injections
  var mockWindow, $rootScope, $httpBackend, $q;

  // Fakes
  var inFakes, outFakes;
  
  beforeEach(function() {

    // Load app

    module('QaRally');

    // Inject mock services into provider

    mockWindow = { localStorage: {} };

    module(function($provide) {
      $provide.value('$window', mockWindow);
    });

    // Get a reference to services

    inject(function(_$rootScope_, _$q_, $injector, Rally) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      $httpBackend = $injector.get('$httpBackend');
      rallySvc = Rally;
    });

    // Create fake factories

    inFakes = window.rallyHttpFakes.create();
    outFakes = window.rallyServiceFakes.create();
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // this is not meant to be robust.
  function deepCopy(x) {
    return angular.fromJson(angular.toJson(x));
  }
  

  it('is wired for construction.', function() {
    expect(rallySvc).toBeDefined();
  });


  describe('getSubscriptionData', function() {

    it('extracts data correctly from the response.', function() {

      // Arrange

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/subscription?jsonp=JSON_CALLBACK')
        .respond(inFakes.SubscriptionResponse);

      // Act

      var subscriptionData;
      rallySvc._getSubscriptionData()
        .then(function(data) { subscriptionData = data; });

      $httpBackend.flush();

      // Assert

      expect(subscriptionData).toEqual(outFakes.getSubscriptionData);

    });

  });


  describe('getWorkspaceList', function() {

    it('extracts data correctly from the response.', function() {

      // Arrange

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces?jsonp=JSON_CALLBACK&pagesize=200')
        .respond(inFakes.SubscriptionWorkspacesResponse);

      // Act

      var workspaceList;
      rallySvc._getWorkspaceList(outFakes.getSubscriptionData.workspacesRef)
        .then(function(data) { workspaceList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(workspaceList).toEqual(outFakes.getWorkspaceList);

    });

  });


  describe('getProjectList', function() {

    it('extracts data correctly from the response.', function() {

      // Arrange

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?jsonp=JSON_CALLBACK&pagesize=200')
        .respond(inFakes.WorkspaceProjectsResponse);

      // Act

      var projectList;
      rallySvc._getProjectList(outFakes.getWorkspaceList[0].projectsRef)
        .then(function(data) { projectList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(projectList).toEqual(outFakes.getProjectList);
    });

  });


  describe('getIterationList', function() {

    it('extracts data correctly from the response.', function() {

      // Arrange

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?jsonp=JSON_CALLBACK&pagesize=200')
        .respond(inFakes.ProjectIterationsResponse);

      // Act

      var iterationList;
      rallySvc._getIterationList(outFakes.getProjectList[0].iterationsRef)
        .then(function(data) { iterationList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(iterationList).toEqual(outFakes.getIterationList);
    });

  });


  describe('getAllSubscriptionData', function() {

    it('will traverse promises and aggregate data.', function() {

      // Arrange

      spyOn(rallySvc, '_getSubscriptionData') .andReturn($q.when(outFakes.getSubscriptionData));
      spyOn(rallySvc, '_getWorkspaceList')    .andReturn($q.when(outFakes.getWorkspaceList));
      spyOn(rallySvc, '_getProjectList')      .andReturn($q.when(outFakes.getProjectList));
      spyOn(rallySvc, '_getIterationList')    .andReturn($q.when(outFakes.getIterationList));

      // Act

      var subscriptionData;
      rallySvc._getAllSubscriptionData()
        .then(function(data) { subscriptionData = data; });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual(outFakes.getAllSubscriptionData);
    });

  });


  describe('initSubscriptionData', function() {

    it('will fetch, cache and return.', function() {

      // Arrange

      delete mockWindow.localStorage.subscriptionData; // redundant, but... it's not cached.

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn($q.when('from the service'));

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData().then(function(data){
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from the service');

      expect(mockWindow.localStorage.subscriptionData).toEqual(angular.toJson({
        version: rallySvc._subscriptionDataVersion,
        data: 'from the service'
      }));

    });

    it('will return cached data.', function(){

      // Arrange

      mockWindow.localStorage.subscriptionData = angular.toJson({
        version: rallySvc._subscriptionDataVersion,
        data: 'from the cache'
      });

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData().then(function(data) {
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from the cache');
    });

    it('can be foreced to ignoreCache.', function() {

      // Arrange

      mockWindow.localStorage.subscriptionData = angular.toJson({
        version: rallySvc._subscriptionDataVersion,
        data: 'from the cache'
      });

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn($q.when('from the service'));

      var ignoreCache = true;

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData(ignoreCache).then(function(data){
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from the service');
    });

    it('will reject the cache if it is stale.', function() {

      // Arrange

      mockWindow.localStorage.subscriptionData = angular.toJson({
        version: rallySvc._subscriptionDataVersion - 1, // <-- old version in the cache
        data: 'from the cache'
      });

      spyOn(rallySvc, '_getAllSubscriptionData').andReturn($q.when('from the service'));

      // Act

      var subscriptionData;
      rallySvc.initSubscriptionData().then(function(data){
        subscriptionData = data;
      });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(subscriptionData).toEqual('from the service');
    });

  });

  describe('getTestSetList', function() {

    it('extracts data correctly from the response.', function() {

      // Arrange

      $httpBackend
        .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/testset?jsonp=JSON_CALLBACK&workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab&query=(Iteration%20%3D%20%22https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fiteration%2F1becc454-eca1-4b00-ae02-fcdf8cade4d5%22)&pagesize=200')
        .respond(inFakes.TestSetListResponse);

      // Act

      var testSetList;
      rallySvc.getTestSetList(
        outFakes.getWorkspaceList[0]._ref,
        outFakes.getIterationList[0]._ref
      ).then(function(data) { testSetList = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetList).toEqual(outFakes.getTestSetList);

    });

  });

  describe('initTestSetDetails', function() {

    var testSetUrl = 'https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da?jsonp=JSON_CALLBACK';
    var testCaseUrl = 'https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/TestCases?jsonp=JSON_CALLBACK&pagesize=200&start=1';

    // minified version of outFakes.initTestSetDetails (capture the output of the first test with a console.log to regen, and take the data property)
    var cachedTestSetDetails = angular.fromJson('{"_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da","name":"My Test Set","testCases":[{"_":"https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9","a":"My Test Case Description","b":"TC33319","c":"My Test Case","d":"My Notes","f":"My Objective","g":"My PostConditions","h":"My PostConditions","j":"Sanitized","k":"My Expected Result","l":"My Input","i":"https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04","m":"https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9"}],"workProducts":{"https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9":{"_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9","Name":"My User Story","FormattedID":"US1234"}},"testFolders":{"https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04":{"_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04","Name":"My Folder","FormattedID":"TF1234"}}}');

    it('will fetch, cache and return.', function() {

      // Arrange

      $httpBackend
        .whenJSONP(testSetUrl)
        .respond(inFakes.TestSetResponse);
        
      $httpBackend
        .whenJSONP(testCaseUrl)
        .respond(inFakes.TestSetTestCasesResponse);
      
      spyOn(rallySvc, '_cacheIt').andCallThrough();

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails).toEqual(outFakes.initTestSetDetails);

      expect(rallySvc._cacheIt).toHaveBeenCalled();
    });

    it('will use the cached version.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      spyOn(rallySvc, '_decacheIt').andReturn(cachedTestSetDetails);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(testSetRef)
        .then(function(data) { testSetDetails = data; });

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(testSetDetails).toEqual(outFakes.initTestSetDetails);
    });

    it('will will return undefined if input is absent.', function() {

      // Arrange

      // Act

      var rejection;
      rallySvc.initTestSetDetails(undefined) // <-- bad input; 
        .then(
          function() { },
          function(r) { rejection = r; }
          );

      $rootScope.$apply(); // cause $q promises to fulfill

      // Assert

      expect(typeof rejection).toEqual('string'); // some error message.
    });

    it('may explicitly ignore the cache.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      spyOn(rallySvc, '_decacheIt').andReturn(cachedTestSetDetails); // <-- cache is good

      var ignoreCache = true;                                        // <-- but ignore it

      var serverData = inFakes.TestSetTestCasesResponse;
      serverData.QueryResult.Results[0].Name = 'from server';

      $httpBackend
        .whenJSONP(testSetUrl)
        .respond(inFakes.TestSetResponse);
        
      $httpBackend
        .whenJSONP(testCaseUrl)
        .respond(serverData);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(testSetRef, ignoreCache)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0].Name).toEqual('from server');
    });

    it('will handle test cases without a test folder or test set.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      var serverData = inFakes.TestSetTestCasesResponse;
      serverData.QueryResult.Results[0].TestFolder = null;
      serverData.QueryResult.Results[0].WorkProduct = null;
      
      $httpBackend
        .whenJSONP(testSetUrl)
        .respond(inFakes.TestSetResponse);
        
      $httpBackend
        .whenJSONP(testCaseUrl)
        .respond(serverData);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref           ).toEqual(serverData.QueryResult.Results[0]._ref);
      expect(testSetDetails.testCases[0].TestFolderRef  ).not.toBeDefined();
      expect(testSetDetails.testCases[0].WorkProductRef ).not.toBeDefined();

    });

    it('will handle multiple test cases with the same grouping.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      var serverData = inFakes.TestSetTestCasesResponse;
      serverData.QueryResult.Results.push(
        deepCopy(serverData.QueryResult.Results[0]));                     // <--- copy of existing item
      serverData.QueryResult.Results[0]._ref = 'ref0'; // with unique ids; same grouping and other data
      serverData.QueryResult.Results[1]._ref = 'ref1';

      $httpBackend
        .whenJSONP(testSetUrl)
        .respond(inFakes.TestSetResponse);
        
      $httpBackend
        .whenJSONP(testCaseUrl)
        .respond(serverData);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0]._ref).toEqual('ref0'); // tc's made it in the list
      expect(testSetDetails.testCases[1]._ref).toEqual('ref1');

      expect(Object.keys(testSetDetails.testFolders).length).toEqual(1); // groupings are shared
      expect(Object.keys(testSetDetails.workProducts).length).toEqual(1);

      var testFolderRef = serverData.QueryResult.Results[0].TestFolder._ref;
      expect(testSetDetails.testFolders[testFolderRef]._ref).toEqual(testFolderRef);
      expect(testSetDetails.testFolders[testFolderRef].Name).toEqual('My Folder');

      var workProductRef = serverData.QueryResult.Results[0].WorkProduct._ref;
      expect(testSetDetails.workProducts[workProductRef]._ref).toEqual(workProductRef);
      expect(testSetDetails.workProducts[workProductRef].Name).toEqual('My User Story');
    });
  });


  describe('getTestCaseResultsForTestSet', function() {

    var testCaseResultUrl = 'https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult?jsonp=JSON_CALLBACK&query=(TestSet%20%3D%20https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Ftestset%2Faf931b07-a8d0-4157-87a3-9772e435a8da)&pagesize=200&start=1&fetch=true';

    it('parses the response correctly.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      $httpBackend
        .whenJSONP(testCaseResultUrl)
        .respond(inFakes.TestCaseResultListFetchResponse);

      // Act

      var testCaseResults;
      rallySvc.getTestCaseResultsForTestSet(testSetRef)
        .then(function(data) { testCaseResults = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testCaseResults).toEqual(outFakes.getTestCaseResultsForTestSet);

    });

    it('sorts multiple TestCaseResult objects for the same TestCase.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      var serverData = inFakes.TestCaseResultListFetchResponse;

      var tcr0 = serverData.QueryResult.Results[0];
      var tcr1 = deepCopy(tcr0);
      var tcr2 = deepCopy(tcr0);

      tcr1._ref = 'new key';
      tcr2._ref = 'another key';

      serverData.QueryResult.Results.push(tcr1);
      serverData.QueryResult.Results.push(tcr2);

      tcr0.CreationDate = '2014-01-08T20:10:31.089Z'; // <-- middle date
      tcr1.CreationDate = '2014-01-09T20:10:31.089Z'; // <-- more recent
      tcr2.CreationDate = '2014-01-07T20:10:31.089Z'; // <-- least recent

      $httpBackend
        .whenJSONP(testCaseResultUrl)
        .respond(serverData);

      // Act

      var testCaseResults;
      rallySvc.getTestCaseResultsForTestSet(testSetRef)
        .then(function(data) { testCaseResults = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(Object.keys(testCaseResults).length).toEqual(1);  // 1 TC...
      var tcActual = testCaseResults[tcr0.TestCase._ref];
      expect(tcActual.all.length).toEqual(3);                 // ...with multiple TR's

      // The one with the more recent CreationDate is at .mostRecent
      expect(tcActual.mostRecent.CreationDate).toEqual(new Date(tcr1.CreationDate));

    });

    it('supports multiple pages.', function() {

      // Arrange

      var testSetRef = Object.keys(outFakes.getTestSetList.testSets)[0];

      var page1Data = inFakes.TestCaseResultListFetchResponse;

      page1Data.QueryResult.PageSize         = 200; // a lie, but that's okay
      page1Data.QueryResult.TotalResultCount = 210; // more than 1 page

      var page2Data = deepCopy(page1Data);

      page2Data.QueryResult.StartIndex = 201;
      page2Data.QueryResult.Results[0]._ref = 'different id';
      page2Data.QueryResult.Results[0].TestCase._ref = 'different tc for fun';

      $httpBackend
        .whenJSONP(testCaseResultUrl)
        .respond(page1Data);

      $httpBackend
        .whenJSONP(testCaseResultUrl.replace('&start=1', '&start=201'))
        .respond(page2Data);

      // Act

      var testCaseResults;
      rallySvc.getTestCaseResultsForTestSet(testSetRef)
        .then(function(data) { testCaseResults = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      // 2 TC's...
      expect(Object.keys(testCaseResults).length).toEqual(2);
      var tc1 = testCaseResults[page1Data.QueryResult.Results[0].TestCase._ref];
      var tc2 = testCaseResults[page2Data.QueryResult.Results[0].TestCase._ref];

      // With the right TR in each one
      expect(tc1.all[0]._ref).toEqual(page1Data.QueryResult.Results[0]._ref);
      expect(tc2.all[0]._ref).toEqual(page2Data.QueryResult.Results[0]._ref);

    });

  });


  // using roundabout ways to get coverage on internal helpers...
  describe('cheats to get 100% code coverage', function() {

    it('getRallyJson uses & instead of ? for querystring if url already has a ? in it.', function() {

      // Arrange

      var urlWithQuestionMark = 'http://whatever.dev?a=b';
      var expectedUrl         = 'http://whatever.dev?a=b&jsonp=JSON_CALLBACK&pagesize=200';

      var fakeBackend = window.fakeBackendFactory.create();

      $httpBackend
        .whenJSONP(expectedUrl)
        .respond(fakeBackend.workspaceList.data);

      // Act

      var workspaceList;
      rallySvc._getWorkspaceList(urlWithQuestionMark).then(function(data) {
        workspaceList = data;
      });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(workspaceList).toBeDefined(); // as I say, it's a hack to check the URL building of getRallyJson.
    });

  });

  // -----------------------------------------------------------

  // TODO move these caching functions to a separate service.
  describe('caching sub-service', function() {

    describe('cacheIt', function() {

      it('rejects bad arguments.', function() {

        expect(function() {    rallySvc._cacheIt( { prefix: 'xx', key: 'xx', maxSize: 5000, data: 'xx', version: null } );   }).toThrow();
        expect(function() {    rallySvc._cacheIt( { prefix: 'xx', key: 'xx', maxSize: 5000, data: null, version: 'xx' } );   }).toThrow();
        expect(function() {    rallySvc._cacheIt( { prefix: 'xx', key: 'xx', maxSize: null, data: 'xx', version: 'xx' } );   }).toThrow();
        expect(function() {    rallySvc._cacheIt( { prefix: 'xx', key: null, maxSize: 5000, data: 'xx', version: 'xx' } );   }).toThrow();
        expect(function() {    rallySvc._cacheIt( { prefix: null, key: 'xx', maxSize: 5000, data: 'xx', version: 'xx' } );   }).toThrow();

        expect(function() {    rallySvc._cacheIt( { /* nothing */ } );   }).toThrow();
        expect(function() {    rallySvc._cacheIt(   /* nothing */   );   }).toThrow();

      });

      it('does a successful save.', function() {

        // Arrange

        spyOn(rallySvc, '_ensureFreeStorageToSize').andReturn(/* nothing */);

        // Act

        rallySvc._cacheIt({
          prefix: 'xx',
          key: '123',
          maxSize: 5000,
          data: 'stuff',
          version: 1
        });

        // Assert

        expect(rallySvc._ensureFreeStorageToSize).toHaveBeenCalledWith({
          prefix: 'xx',
          key: '123',
          maxSize: 5000,
          size: angular.toJson({
            version:1,
            data: 'stuff'
          }).length
        });

        var key1 = 'xx_123';
        expect(mockWindow.localStorage[key1]).toEqual(
          angular.toJson({
            version: 1,
            data: 'stuff'
          }));

      });
  
    });

    describe('decacheIt', function() {

      it('rejects bad arguments.', function() {

        expect(function() {    rallySvc._decacheIt( { prefix: 'xx', key: 'xx', version: null } );   }).toThrow();
        expect(function() {    rallySvc._decacheIt( { prefix: 'xx', key: null, version: 'xx' } );   }).toThrow();
        expect(function() {    rallySvc._decacheIt( { prefix: null, key: 'xx', version: 'xx' } );   }).toThrow();

        expect(function() {    rallySvc._decacheIt( { /* nothing */ } );   }).toThrow();
        expect(function() {    rallySvc._decacheIt(   /* nothing */   );   }).toThrow();

      });

      it('does a successful load.', function() {

        // Arrange

        var key1 = 'xx_123';
        mockWindow.localStorage[key1] = angular.toJson({
            version: 1,
            data: 'stuff'
          });

        // Act

        var data = rallySvc._decacheIt({
          prefix: 'xx',
          key: '123',
          version: 1
        });

        // Assert

        expect(data).toEqual('stuff');

      });
  
      it('returns undefined if item is not in cache.', function() {

        // Arrange

        var key1 = 'xx_123';
        delete mockWindow.localStorage[key1]; // redundant, but: it's not in the cache.

        // Act

        var data = rallySvc._decacheIt({
          prefix: 'xx',
          key: '123',
          version: 1
        });

        // Assert

        expect(data).not.toBeDefined();

      });
  
      it('returns undefined if item in the cache is stale.', function() {

        // Arrange

        var key1 = 'xx_123';
        mockWindow.localStorage[key1] = angular.toJson({
            version: 1, // <-- old
            data: 'stuff'
          });

        // Act

        var data = rallySvc._decacheIt({
          prefix: 'xx',
          key: '123',
          version: 2 // <-- new
        });

        // Assert

        expect(data).not.toBeDefined();

      });

    });

    describe('ensureFreeStorageToSize', function() {

      it('rejects bad arguments.', function() {

        expect(function() {    rallySvc._ensureFreeStorageToSize( { prefix: 'xx', key: 'xx', maxSize: 5000, size: null } );   }).toThrow();
        expect(function() {    rallySvc._ensureFreeStorageToSize( { prefix: 'xx', key: 'xx', maxSize: null, size: 500  } );   }).toThrow();
        expect(function() {    rallySvc._ensureFreeStorageToSize( { prefix: 'xx', key: null, maxSize: 5000, size: 500  } );   }).toThrow();
        expect(function() {    rallySvc._ensureFreeStorageToSize( { prefix: null, key: 'xx', maxSize: 5000, size: 500  } );   }).toThrow();

        expect(function() {    rallySvc._ensureFreeStorageToSize( { /* nothing */ } );   }).toThrow();
        expect(function() {    rallySvc._ensureFreeStorageToSize(   /* nothing */   );   }).toThrow();

      });

      it('does nothing if no elements in the localStorage yet.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested'
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '123',
          maxSize: 5000,
          size: 500
        });

        // Assert

        expect(mockWindow.localStorage).toEqual(angular.fromJson(before)); // no change

      });

      it('will delete nothing if there is room.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'), //   100 x's
          'xx_2': new Array(101).join('x'), // + 100 x's = 200 characters used

          'xx_lastAccessed': angular.toJson({
            version: 1,
            data: {
              'xx_1': 12345,
              'xx_2': 67890
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300,
          size: 100           // 200 used, requesting 100, it should be fine.
        });

        // Assert

        expect(mockWindow.localStorage).toEqual(angular.fromJson(before));

      });

      it('will delete something to make room.', function() {

        // Arrange

        var key1 = 'xx_1';
        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'), //   100 x's
          'xx_2': new Array(101).join('x'), // + 100 x's = 200 characters used

          'xx_lastAccessed': angular.toJson({
            version: 1,
            data: {
              'xx_1': 1, // <-- oldest one
              'xx_2': 2,
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var expected = angular.fromJson(before);
        delete expected[key1];
//TODO not done yet        delete expected.xx_lastModified.data.xx_1;

        expect(mockWindow.localStorage).toEqual(expected);

      });

      it('will delete something to make room (second item is victim).', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'), //   100 x's
          'xx_2': new Array(101).join('x'), // + 100 x's = 200 characters used

          'xx_lastAccessed': angular.toJson({
            version: 1,
            data: {
              'xx_1': 2,
              'xx_2': 1, // <-- oldest one ~~~~~~~~~~ this test inverses the dates to verify it's the date order, not the first one in the list. 
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var key2 = 'xx_2';
        var expected = angular.fromJson(before);
        delete expected[key2];
//TODO not done yet        delete expected.xx_lastModified.data.xx_1;

        expect(mockWindow.localStorage).toEqual(expected);

      });

      it('will ignore item being replaced.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'),  //   100 x's
          'xx_2': new Array(101).join('x'),  // + 100 x's = 200 characters used
          'xx_3': new Array(5000).join('x'), // ... item being replaced will not count

          'xx_lastAccessed': angular.toJson({
            version: 1,
            data: {
              'xx_1': 1, // <-- oldest one
              'xx_2': 2,
              'xx_3': 3
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used (not counting item being replaced)...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var key1 = 'xx_1';
        var expected = angular.fromJson(before);
        delete expected[key1];
//TODO not done yet        delete expected.xx_lastModified.data.xx_1;

        expect(mockWindow.localStorage).toEqual(expected);

      });

      it('if lastAccessed is absent, each item is equal in value.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'),  //   100 x's
          'xx_2': new Array(101).join('x'),  // + 100 x's = 200 characters used
          'xx_3': new Array(5000).join('x') // ... item being replaced will not count

          // xx_lastAccessed: ... is absent

        };

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used (not counting item being replaced)...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var key1 = 'xx_1', key2 = 'xx_2';
        expect(
          // it will delete one or the other, but it is semi-nondeterministic.
          typeof mockWindow.localStorage[key1] === 'undefined' ||
          typeof mockWindow.localStorage[key2] === 'undefined'
        ).toEqual(true);

      });

      it('will ignore lastAccessed dates with old version.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'),  //   100 x's
          'xx_2': new Array(101).join('x'),  // + 100 x's = 200 characters used
          'xx_3': new Array(5000).join('x'), // ... item being replaced will not count

          'xx_lastAccessed': angular.toJson({
            version: 'bad', // <----- wrong version
            data: {
              'xx_1': 3,
              'xx_2': 2,
              'xx_3': 1 // <-- oldest one won't be deleted
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used (not counting item being replaced)...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var key1 = 'xx_1';
        var expected = angular.fromJson(before);
        delete expected[key1]; // <---- it removes the first one instead of the earliest date
//TODO not done yet        delete expected.xx_lastModified.data.xx_1;

        expect(mockWindow.localStorage).toEqual(expected);

      });

      it('will prioritize victims without a lastAccessed higher.', function() {

        // Arrange

        mockWindow.localStorage = {
          a: 'unrelated stuf',
          b: 'is unmollested',

          'xx_1': new Array(101).join('x'),  //   100 x's
          'xx_2': new Array(101).join('x'),  // + 100 x's = 200 characters used
          'xx_3': new Array(5000).join('x'), // ... item being replaced will not count

          'xx_lastAccessed': angular.toJson({
            version: 1,
            data: {
              'xx_1': 1,
              // 'xx_2': 2, <-- absent from lastModified
              'xx_3': 3
            }
          })
        };

        var before = angular.toJson(mockWindow.localStorage);

        // Act

        rallySvc._ensureFreeStorageToSize({
          prefix: 'xx',
          key: '3',
          maxSize: 300, // 200 of 300 used (not counting item being replaced)...
          size: 101     // ...need 101 so it should make space
        });

        // Assert

        var key2 = 'xx_2';
        var expected = angular.fromJson(before);
        delete expected[key2];
//TODO not done yet        delete expected.xx_lastModified.data.xx_1;

        expect(mockWindow.localStorage).toEqual(expected);

      });

    });

  });

});




