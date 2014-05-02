'use strict';

describe('Service Rally', function(){

  // unit under test
  var rallySvc;

  // Dependency Injections
  var mockWindow, $rootScope, $httpBackend;
  
  beforeEach(function() {

    module('QaRally');

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
    return angular.fromJson(angular.toJson(x));
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

      mockWindow.localStorage.subscriptionData = angular.toJson({
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

      mockWindow.localStorage.subscriptionData = angular.toJson({
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

      mockWindow.localStorage.subscriptionData = angular.toJson({
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

  // These caching functions should be moved to a separate service.
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
    
    it('will will return undefined if input is absent.', function() {

      // Arrange

      // Act

      var testSetDetails, rejection;
      rallySvc.initTestSetDetails(undefined) // <-- undefined as input; 
        .then(
          function(data) { testSetDetails = data; },
          function(r) { rejection = r; }
          );

      $rootScope.$apply(); // force promises to resolve

      // Assert

      expect(testSetDetails).not.toBeDefined();
      expect(typeof rejection).toEqual('string'); // some error message. Expecting a particular message makes the test fragile.
    });
    
    it('may explicitly ignore the cache.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.testCaseList.data.QueryResult.Results[0].Name = 'updated name'; // service is different from cache.
      fakeBackend.setup($httpBackend);

      // TODO this technique of using the output of the previous test was a bad idea. refator.
      mockWindow.localStorage['tsd_' + fakeBackend.testSetDetails.inputs.testSetRef] = cachedTestSetDetails;

      // Act

      var ignoreCache = true; // <-- point of the test
      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef, ignoreCache)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0].Name).toEqual('updated name'); // from service, not cache
    });

    it('will ignore the cache if the version is old.', function() {

      // Arrange

      var fakeBackend = window.fakeBackendFactory.create();
      fakeBackend.testCaseList.data.QueryResult.Results[0].Name = 'updated name'; // service is different from cache.
      fakeBackend.setup($httpBackend);

      // TODO this technique of using the output of the previous test was a bad idea. refator.
      var temp = angular.fromJson(cachedTestSetDetails);
      expect(temp.version).toEqual(rallySvc._testSetDetailsStorageVersion);
      temp.version = temp.version - 1; // <-- point of the test: old data in the cache
      mockWindow.localStorage['tsd_' + fakeBackend.testSetDetails.inputs.testSetRef] = angular.toJson(temp);

      // Act

      var testSetDetails;
      rallySvc.initTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
        .then(function(data) { testSetDetails = data; });

      $httpBackend.flush(); // simulate async http completing

      // Assert

      expect(testSetDetails.testCases[0].Name).toEqual('updated name'); // from service, not cache
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

});




