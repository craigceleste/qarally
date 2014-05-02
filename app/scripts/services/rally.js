'use strict';

// Rally service

//    - Stateless data access service to interact with Rally web services.
//    - Manage caching of data in window.localStorage   TODO clean embedded logic and move to a separate caching service
//    - Transformation of Rally data into normalized local data (discard stuff we don't need) TODO find a third party JavaScript object mapper library

// Methods that begin with _ are to be considered private but are exposed for ease of testing.

angular.module('QaRally')
  .factory('Rally', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window) {

    var service = {};

    // TODO figure out how to inject underscore
    var _ = window._;

    var rallyMaxPageSize = 200;

    // I am making an effort to over-validate and assert expectations about Rally's services,
    // because this app will be maintained by people not familiar with Rally, AngularJS or this code.
    // Also, Rally (no disrespect to them: they are awesome!) is an external connection point and may change without us noticing.

    function assert(test, message) {
      if (!test) {
        $log.error('ASSERT FAILED: ' + message);

        // TODO see if we can bubble an error (not message) up to the UI, to look at the console.
        // Instead of throwing here, see if we can $log the error and reject promises.
        throw new Error(message);
      }
    }

    // Internal helper to handle the JSONP stuff

    function getRallyJson(url, data) {
      var querystring = _.reduce(data, function(memo, value, key){
        return memo += '&' + key + '=' + encodeURIComponent(value);
      }, 'jsonp=JSON_CALLBACK');
      url += (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
      return $http.jsonp(url);
    }

    // Internal helper to produce a single promise for a list of items.

    function allItemPromises(listOfItems, getPromiseForItem) {
      var promises = [];
      angular.forEach(listOfItems, function(item) {
        promises.push(getPromiseForItem(item));
      });
      return $q.all(promises);
    }

    // hard coded starting point: https://rally1.rallydev.com/slm/webservice/v3.0/subscription
    service._getSubscriptionData = function() {
      return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/subscription').then(function(subscriptionResponse){

        var subscriptionData = {
          _ref: subscriptionResponse.data.Subscription._ref,
          workspacesRef: subscriptionResponse.data.Subscription.Workspaces._ref
        };

        assert(typeof subscriptionData._ref === 'string', 'Expected to get subscription _ref');
        assert(typeof subscriptionData.workspacesRef === 'string', 'Expected to get workspacesRef from subscription.');

        return subscriptionData;
      });
    };

    // workspacesRef example: https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces
    service._getWorkspaceList = function(workspacesRef) {
      return getRallyJson(workspacesRef, {pagesize: rallyMaxPageSize}).then(function(workspacesResponse){

        assert(workspacesResponse.data.QueryResult.TotalResultCount <= workspacesResponse.data.QueryResult.PageSize, 'This app expects few workspaces (2 or 3 max) workspaces, but exceeded the page size.');

        var workspaceList = _.map(workspacesResponse.data.QueryResult.Results, function(workspace) {

          var workspaceData = {
            _ref: workspace._ref,
            name: workspace.Name,
            projectsRef: workspace.Projects._ref
          };

          assert(typeof workspaceData._ref === 'string', 'Expected to find workspace _ref for ' + workspacesRef);
          assert(typeof workspaceData.name === 'string', 'Expected to find workspace name for ' + workspacesRef);
          assert(typeof workspaceData.projectsRef === 'string', 'Expected to find projectsRef for ' + workspacesRef);

          return workspaceData;
        });

        return workspaceList;
      });
    };

    // projectsRef example: https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?pagesize=200
    service._getProjectList = function(projectsRef) {
      return getRallyJson(projectsRef, {pagesize: rallyMaxPageSize}).then(function(projectsResponse){

        assert(projectsResponse.data.QueryResult.TotalResultCount <= projectsResponse.data.QueryResult.PageSize, 'Expect few projects (20 or so). If there are more items than fit on 1 page, this function should be refactored.');

        var projectList = _.map(projectsResponse.data.QueryResult.Results, function(project) {

          var projectData = {
            _ref: project._ref,
            name: project.Name,
            iterationsRef: project.Iterations._ref
          };

          assert(typeof projectData._ref === 'string', 'Expect to find project _ref for ' + projectsRef);
          assert(typeof projectData.name === 'string', 'Expect to find project name for ' + projectsRef);
          assert(typeof projectData.iterationsRef === 'string', 'Expect to find iterationsRef for ' + projectsRef);

          return projectData;
        });

        return projectList;
      });
    };

    // projectsRef example: https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?pagesize=200
    service._getIterationList = function(iterationsRef) {
      return getRallyJson(iterationsRef, {pagesize: rallyMaxPageSize}).then(function(iterationsResponse){

        // This assertion may fail in the next year or so.
        // Option 1: order desc by date and take the first page. Older iterations fall out of use by this tool.
        // Option 2: traversing all pages in parallel promises; aggregate and return all of them at the end. While not hard to implement, and technically more accurate, it introduces another problem of local storage size. Once we have hundreds of iterations, we probably shouldn't cache them all.
        assert(iterationsResponse.data.QueryResult.TotalResultCount <= iterationsResponse.data.QueryResult.PageSize, 'Expect few iterations (100 or so). If there are more items than fit on 1 page, this function should be refactored.');

        var iterationList = _.map(iterationsResponse.data.QueryResult.Results, function(iteration) {

          var iterationData = {
            _ref: iteration._ref,
            name: iteration.Name,
            startDate: iteration.StartDate,
            endDate: iteration.EndDate
          };

          assert(typeof iterationData._ref === 'string', 'Expect to find iteration _ref for ' + iterationsRef);
          assert(typeof iterationData.name === 'string', 'Expect to find iteration name for ' + iterationsRef);
          assert(typeof iterationData.startDate === 'string', 'Expect to find iteration startDate for ' + iterationsRef);
          assert(typeof iterationData.endDate === 'string', 'Expect to find iteration endDate for ' + iterationsRef);

          return iterationData;
        });

        return iterationList;
      });
    };

    // Traverse Subscription -> Workspace -> Project -> Iteration, and returns aggregate object for caching.
    service._getAllSubscriptionData = function() {

      var subscriptionData;

      // Entry point is a single call into subscription data.

      return service._getSubscriptionData()
        .then(function(_subscriptionData){
          subscriptionData = _subscriptionData;

      // That leads into exactly 1 call for the list of workspaces

          return service._getWorkspaceList(subscriptionData.workspacesRef);
        }).then(function(workspaceList){
          subscriptionData.workspaces = _.reduce(workspaceList, function(memo, ws) { memo[ws._ref] = ws; return memo; }, {});

      // For each workspace in the list, make a separate call for the projects of that workspace.
      // allItemPromises waits until each concurrent request is complete before returning.

          return allItemPromises(workspaceList, function(workspace) {
            return service._getProjectList(workspace.projectsRef)
              .then(function(projectList) {
                workspace.projects = _.reduce(projectList, function(memo, p) { memo[p._ref] = p; return memo; }, {});

      // For each project, drill into the iterations in the same way.

                return allItemPromises(projectList, function(project) {
                  return service._getIterationList(project.iterationsRef)
                    .then(function(iterationList){
                      project.iterations = _.reduce(iterationList, function(memo, it) { memo[it._ref] = it; return memo; }, {});
                    });
                });

              });
          });
        })

      // When all the recursion has completed, return the aggregated subscriptionData.

        .then(function() {
          $log.info('getAllSubscriptionData', subscriptionData);

          return subscriptionData;
        });
    };

    // Wrap getAllSubscriptionData in a caching layer
    service._subscriptionDataVersion = 3;
    service.initSubscriptionData = function(ignoreCache) {

      var storageKey = 'subscriptionData';
      var deferred = $q.defer();

      var innerData;
      if (!ignoreCache) {
        var outerDataJson = $window.localStorage[storageKey];
        if (outerDataJson) {
          var outerData = angular.fromJson(outerDataJson);
          // no upgrade path provided for this data. It is a pure cache; no user data is here.
          if (outerData.version === service._subscriptionDataVersion) {
            innerData = outerData.data;
          }
        }
      }

      if (innerData) {
        deferred.resolve(innerData);
      }
      else {
        service._getAllSubscriptionData().then(function(subscriptionData){
          $window.localStorage[storageKey] = angular.toJson({
            version: service._subscriptionDataVersion,
            data: subscriptionData
          });
          deferred.resolve(subscriptionData);
        });

      }

      return deferred.promise;
    };

    // Test Sets Per Iteration is not navigated to from another request, but queried manually.
    // https://rally1.rallydev.com/slm/webservice/v3.0/testset
    //    ?workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab
    //    &query=%28Iteration%20=%20%22https://rally1.rallydev.com/slm/webservice/v3.0/iteration/a2f5bfa9-23b3-4dd3-be80-a999e5e54041%22%29
    service.getTestSetList = function(workspaceRef, iterationRef) {
      return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/testset', {
        workspace: workspaceRef,
        query: '(Iteration = "' + iterationRef + '")', // space to left+right of = is important (30 minutes of my life...)
        pagesize: rallyMaxPageSize
      }).then(function(testSetsResponse){

        return {
          // echo back iterationRef with the actual result for concurrency checking.
          iterationRef: iterationRef,
          testSets: _.reduce(testSetsResponse.data.QueryResult.Results, function(memo, testSet) {
            memo[testSet._ref] = {
              _ref: testSet._ref,
              name: testSet._refObjectName
            };
            return memo;
          }, {})
        };
      });
    };

    // localStorage is up to 5MB (which runs out fast). We will minify of the JSON (including discarding properties we don't need) is required.

    var tcMinificationKeys = {
      _ref                      : '_',
      Description               : 'a',
      FormattedID               : 'b',
      Name                      : 'c',
      Notes                     : 'd',
      ObjectId                  : 'e',
      Objective                 : 'f',
      PostConditions            : 'g',
      PreConditions             : 'h',
      TestFolderRef             : 'i',
      Type                      : 'j',
      ValidationExpectedResult  : 'k',
      ValidationInput           : 'l',
      WorkProductRef            : 'm'
    };

    function minifyTestCase(tc) {
      var minifiedTc = {};
      minifiedTc[tcMinificationKeys._ref] = tc._ref;
      minifiedTc[tcMinificationKeys.Description] = tc.Description;
      minifiedTc[tcMinificationKeys.FormattedID] = tc.FormattedID;
      minifiedTc[tcMinificationKeys.Name] = tc.Name;
      minifiedTc[tcMinificationKeys.Notes] = tc.Notes;
      minifiedTc[tcMinificationKeys.ObjectId] = tc.ObjectId;
      minifiedTc[tcMinificationKeys.Objective] = tc.Objective;
      minifiedTc[tcMinificationKeys.PostConditions] = tc.PostConditions;
      minifiedTc[tcMinificationKeys.PreConditions] = tc.PreConditions;
      minifiedTc[tcMinificationKeys.Type] = tc.Type;
      minifiedTc[tcMinificationKeys.ValidationExpectedResult] = tc.ValidationExpectedResult;
      minifiedTc[tcMinificationKeys.ValidationInput] = tc.ValidationInput;
      if (tc.TestFolder && tc.TestFolder._ref) {
        minifiedTc[tcMinificationKeys.TestFolderRef] = tc.TestFolder._ref;
      }
      if (tc.WorkProduct && tc.WorkProduct._ref) {
        minifiedTc[tcMinificationKeys.WorkProductRef] = tc.WorkProduct._ref;
      }
      return minifiedTc;
    }

    function deminifyTestCase(testCase) {

      var tc = _.reduce(tcMinificationKeys, function(tc, minifiedKey, unminifiedKey){
        tc[unminifiedKey] = testCase[minifiedKey];
        return tc;
      }, {});

      return tc;
    }

    // Example URLs
    // https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a
    // https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a/TestCases
    function getTestSetDetails(testSetRef) {

      assert(typeof testSetRef === 'string', 'testSetRef must be a string');

      // Test Set Details is our own structure containing the test cases for an iteration and some other data.

      var testSetDetails = {
        _ref: testSetRef,
        name: undefined,
        testCases: [], // array: I don't want to sort repeatedly in the view at runtime.
        workProducts: {},
        testFolders: {}
      };

      return getRallyJson(testSetRef).then(function(testSetResponse) {

        assert(testSetResponse.data.TestSet.Name, 'Test Set name is expected to be set.');
        testSetDetails.name = testSetResponse.data.TestSet.Name;

        // make an array containing the first index on each page: [1,201,401,...]
        var pageStarts = [];
        for (var pageStart = 1; pageStart <= testSetResponse.data.TestSet.TestCases.Count; pageStart = pageStart + rallyMaxPageSize) {
          pageStarts.push(pageStart);
        }

        // Create a set of requests for each page.
        return allItemPromises(pageStarts, function(pageStart) {
          return getRallyJson(testSetResponse.data.TestSet.TestCases._ref, {pagesize: rallyMaxPageSize, start: pageStart})
            .then(function(testCaseListResponse){

              angular.forEach(testCaseListResponse.data.QueryResult.Results, function(tc) {

                assert(typeof tc._ref === 'string' && !testSetDetails.testCases[tc._ref], 'TC must have a _ref and it must be unique.');
                assert(typeof tc.Name === 'string', 'Name is required.');
                assert(typeof tc.Description === 'string', 'Description is required.');
                assert(/^TC[0-9]+$/.test(tc.FormattedID), 'FormattedID must match the TC### pattern.');

                testSetDetails.testCases.push(minifyTestCase(tc));

                if (tc.TestFolder) {
                  assert(typeof tc.TestFolder._ref === 'string', 'TestFolder should contain a _ref');
                  assert(typeof tc.TestFolder._refObjectName === 'string', 'TestFolder should contain a _refObjectName');

                  if (!testSetDetails.testFolders[tc.TestFolder._ref]) {
                    testSetDetails.testFolders[tc.TestFolder._ref] = {
                      _ref: tc.TestFolder._ref,
                      Name: tc.TestFolder._refObjectName,
                      FormattedID: 'TF1234' // TODO. we'll probably have to query it separately.
                    };
                  }
                  else {
                    assert(testSetDetails.testFolders[tc.TestFolder._ref]._ref === tc.TestFolder._ref, 'Each TC that references the same TF is expected to have the same properties.');
                    assert(testSetDetails.testFolders[tc.TestFolder._ref].Name === tc.TestFolder._refObjectName, 'Each TC that references the same TF is expected to have the same properties.');
                    assert(testSetDetails.testFolders[tc.TestFolder._ref].FormattedID === 'TF1234', 'Each TC that references the same TF is expected to have the same properties.');
                  }
                }

                if (tc.WorkProduct) {
                  assert(typeof tc.WorkProduct._ref === 'string', 'WorkProduct should contain a _ref');
                  assert(typeof tc.WorkProduct._refObjectName === 'string', 'WorkProduct should contain a _refObjectName');

                  if (!testSetDetails.workProducts[tc.WorkProduct._ref]) {
                    testSetDetails.workProducts[tc.WorkProduct._ref] = {
                      _ref: tc.WorkProduct._ref,
                      Name: tc.WorkProduct._refObjectName,
                      FormattedID: 'US1234' // TODO. we'll probably have to query it separately.
                    };
                  }
                  else {
                    assert(testSetDetails.workProducts[tc.WorkProduct._ref]._ref === tc.WorkProduct._ref, 'Each TC that references the same WP is expected to have the same properties.');
                    assert(testSetDetails.workProducts[tc.WorkProduct._ref].Name === tc.WorkProduct._refObjectName, 'Each TC that references the same WP is expected to have the same properties.');
                    assert(testSetDetails.workProducts[tc.WorkProduct._ref].FormattedID === 'US1234', 'Each TC that references the same WP is expected to have the same properties.');
                  }
                }
              });
            });
        });
      }).then(function(){

        // TODO for each work product and test folder, we need to make an additional query to learn it's FormattedID (US123, DE456, etc). Maybe some other info while we're there, if it's handy.
        return $q.when(undefined);

      }).then(function() {
        $log.debug('getTestSetDetails', testSetDetails);

        testSetDetails.testCases = _.sortBy(testSetDetails.testCases, function(tc) {
          assert(tc[tcMinificationKeys.FormattedID].length > 2 && tc[tcMinificationKeys.FormattedID].substr(0,2) === 'TC', 'FormattedID expected in the TC123 format.');
          return parseInt(tc[tcMinificationKeys.FormattedID].substr(2));
        });

        $log.debug('getTestSetDetails', testSetDetails);
        return testSetDetails;
      });
    }

    // TODO move these caching helpers to a different service of their own.

    //  svc.ensureFreeStorageToSize({
    //    prefix: 'abc',                      // All localStorage items with a key using this prefix are in a bucket or namespace...
    //    maxSize: 1024 * 1024 * 4,           // ...whose maximum size is thiiis big.
    //    size: 5000,                         // Ensure that there is at least this much space available in that bucket by summing the size of all existing items with prefix...
    //    key: '123',                         // ...except this one, which will be replaced, (the prefix will be added later) ...
    //                                        // ...and deleting those items which have been accessed least recently, until there is room.
    //  }
    service._ensureFreeStorageToSize = function(options) {

      // Local Storage is limited to 5MB.
      // We expect to use 4MB for Test Set Detail structures and the rest for other stuff.
      // DO NOT: watchdog the 'other stuff'. If it goes over, we'll get an out of space exception which is fine for now.
      // DO NOT: get into the business of figuring out how much space is left in localStorage. Only care about how much space our 'bucket' is using.

      assert(options && options.prefix && options.key && options.size && options.maxSize, 'ensureFreeStorageToSize: required argument missing.');
      assert(options.maxSize >= 1 && options.maxSize <= 1024 * 1024 * 5, 'ensureFreeStorageToSize: maxSize is out of range.');
      assert(options.size > 0 && options.size <= options.maxSize, 'ensureFreeStorageToSize: size is out of range.');

      var targetSize = options.maxSize - options.size; // we need to reduce the storage used in the bucket to this amount.
      assert(targetSize > 0, 'ensureFreeStorageToSize: targetSize is out of range.');

      // Maintain a dictionary of last accessed dates, keyed on localStorage key, value is a date.
      // This structure does not count towards space inside the bucket.

      var lastAccessed = {};
      var lastAccessedJson = $window.localStorage[options.prefix + '_lastAccessed'];
      if (lastAccessedJson) {
        var lastAccessedOuter = angular.fromJson(lastAccessedJson);
        if (lastAccessedOuter.version === 1) {
          lastAccessed = lastAccessedOuter.data;
        }
      }

      // Produce a structure of the existing items in the bucket.

      var existingItems = {};
      for(var key in $window.localStorage) {
        if ( (key !== options.prefix + '_' + options.key) && (key !== options.prefix + '_lastAccessed')) { // ignore the one being replaced
          if (key.indexOf(options.prefix) === 0) {
            existingItems[key] = {
              size: $window.localStorage[key].length,
              lastAccessed: lastAccessed[key] // which might be undefined, which is fine
            };
          }
        }
      }

      // Eliminate items until there is room for the new one.

      var sanity = 5000;

      // these functions are not inline/anonymous becasue it is bad practice to define anonymous functions in a loop.
      
      function tallySizes(memo, item)
      {
        return memo + item.size;
      }

      function compareVictims(bestYetKey, item, key) {

        // if there is no better choice yet, choose this one
        if (!bestYetKey)
        {
          return key;
        }
        var bestYet = existingItems[bestYetKey];

        // If both the bestYet victim and the item being reviewed have dates, compare on date.
        if (bestYet.lastAccessed && item.lastAccessed) {
          return bestYet.lastAccessed < item.lastAccessed ? bestYetKey : key;
        }

        // Otherwise, choose the one that doesn't have a date.
        if (!bestYet.lastAccessed) {
          return bestYetKey;
        }
        return key;
      }

      // Repeat (killing a victim each iteration) until there is room
      while (targetSize < _.reduce(existingItems, tallySizes, 0)) { // sum of sizes for existing ones

        assert(--sanity > 0, 'ensureFreeStorageToSize: invinite loop guard.');

        var victimKey = _.reduce(existingItems, compareVictims, null);

        $log.info('test set data de-cached to make room: ' + victimKey, existingItems[victimKey].size, $window.localStorage[victimKey]);
        delete $window.localStorage[victimKey];
        delete existingItems[victimKey];
        // TODO delete victimKey from lastAccessed
      }

    };

    // Example:
    //    service._cacheIt({
    //      prefix: 'tsd',
    //      key: testSetRef,
    //      maxSize: 1024 * 1024 * 4,
    //      data: storedTestSetDetails,
    //      version: 1
    //    });
    service._cacheIt = function(options) {

      assert(options && options.prefix && options.key && options.maxSize && options.data && options.version, 'cacheIt: required argument missing.');

      var outerDataJson = angular.toJson({
        version: options.version,
        data: options.data
      });

      service._ensureFreeStorageToSize({
        prefix: options.prefix,
        key: options.key,
        maxSize: options.maxSize,
        size: outerDataJson.length,
      });

      // TODO update last accessed date

      $window.localStorage[options.prefix + '_' + options.key] = outerDataJson;
    };

    // Example:
    //    service._cacheIt({
    //      prefix: 'tsd',
    //      key: testSetRef,
    //      version: 1
    //    });
    service._decacheIt = function(options) {

      assert(options && options.prefix && options.key && options.version, 'cacheIt: required argument missing.');

      var outerDataJson = $window.localStorage[options.prefix + '_' + options.key];
      if (outerDataJson) {
        var outerData = angular.fromJson(outerDataJson);

        if (outerData.version === options.version) {

          // TODO update last accessed date

          return outerData.data;
        }

        // if I need an upgrade path, eventually have: if (typeof options.upgrade === 'function') return options.upgrade(outerData.data);
      }
      return undefined;
    };

    // Wrap getTestSetDetails in a caching layer
    service._testSetDetailsStorageVersion = 1;
    service.initTestSetDetails = function(testSetRef, ignoreCache) {

      var cacheOptions = {
        prefix: 'tsd',
        key: testSetRef,
        version: service._testSetDetailsStorageVersion,
        maxSize: 1024 * 1024 * 4
      };

      // Deminify the stored format into the working format
      function deminifyTestSetDetails(storedTestSetDetails) {

        var workingTestSetDetails = {
          testCases: [],
          testFolders: {},
          workProducts: {}
        };

        workingTestSetDetails.testFolders = angular.fromJson(angular.toJson(storedTestSetDetails.testFolders));
        workingTestSetDetails.workProducts = angular.fromJson(angular.toJson(storedTestSetDetails.workProducts));

        angular.forEach(storedTestSetDetails.testCases, function(tc) {
          workingTestSetDetails.testCases.push(deminifyTestCase(tc));
        });

        return workingTestSetDetails;
      }

      var deferred = $q.defer();

      if (!testSetRef) {
        deferred.reject('No test set specified.');
      }
      else {

        // Try to load it from the cache

        var testSetDetails;
        if (!ignoreCache) {
          var storedTestSetDetails = service._decacheIt(cacheOptions);
          if (storedTestSetDetails) {
            testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
          }
        }

        // If we got it from cache, return it

        if (testSetDetails){
          deferred.resolve(testSetDetails);

        }

        // If we didn't get it from cache, get it from $http
        else {
          getTestSetDetails(testSetRef).then(function(storedTestSetDetails) {

            service._cacheIt(
              angular.extend(cacheOptions, {data: storedTestSetDetails})
            );

            var testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
            deferred.resolve(testSetDetails);
          });
        }
      }

      return deferred.promise;
    };

    // Get all the test results for the Test Set.
    //    Note: this queries more than we need, since we get all result for all test cases in the test set. We only the most recent Result per test case,
    //          but a single request with excess data is more efficient than a separate query for each TC, with just the latest test result.

    // https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult?query=(TestSet%20=%20https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da)&pagesize=200&fetch=true

    // Note: Test Case Results are NOT cached. They change too often during day-to-day testing.

    service.getTestCaseResultsForTestSet = function(testSetRef) {

      // Final result is aggregated from multiple queries.
      var testResults = {
        // 'testCaseRef': {
        //   'all': [tcr,tcr,tcr,...]
        //   'mostRecent': tcr
        // }
      };

      // Helper to process each page
      function getPage(start) {

        // Query a page of data from Rally
        return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult', {
          query: '(TestSet = ' + testSetRef + ')', // spaces around = are required
          pagesize: rallyMaxPageSize,
          start: start, // first item on page. 1 based.
          fetch: true

        // Then aggregate that data into our final testResults structure.
        }).then(function(testCaseResultResponse) {

          assert(testCaseResultResponse.data.QueryResult.PageSize === rallyMaxPageSize, 'PageSize is expected to match.');

          angular.forEach(testCaseResultResponse.data.QueryResult.Results, function(tcr) {

            assert(typeof tcr.CreationDate === 'string', 'Test Case CreationDate is invalid.');

            var tcResult = {
              _ref: tcr._ref,
              TestCaseRef: tcr.TestCase._ref,
              CreationDate: new Date(tcr.CreationDate),
              Build: tcr.Build,
              TesterName: tcr.Tester._refObjectName,
              Verdict: tcr.Verdict,
              Notes: tcr.Notes
            };

            assert(typeof tcResult._ref         === 'string', 'Test Case _ref is invalid.');
            assert(typeof tcResult.TestCaseRef  === 'string', 'Test Case TestCaseRef is invalid.');
            assert(typeof tcResult.CreationDate === 'object', 'Test Case CreationDate is invalid.');
            assert(typeof tcResult.Build        === 'string', 'Test Case Build is invalid.');
            assert(typeof tcResult.TesterName   === 'string', 'Test Case TesterName is invalid.');
            assert(typeof tcResult.Verdict      === 'string', 'Test Case Verdict is invalid.');
            assert(typeof tcResult.Notes        === 'string', 'Test Case Notes is invalid.');

            // Create a structure on testResults, keyed on testCaseRef, containing an array of all tc results.
            if (!testResults[tcResult.TestCaseRef]) {
              testResults[tcResult.TestCaseRef] = { all: [] };
            }
            testResults[tcResult.TestCaseRef].all.push(tcResult);

            // Put the most recent tcResult for the TC on the object itself.

            if (!testResults[tcResult.TestCaseRef].mostRecent || tcResult.CreationDate > testResults[tcResult.TestCaseRef].mostRecent.CreationDate) {
              testResults[tcResult.TestCaseRef].mostRecent = tcResult;
            }

          });

          // Bit of a hack, but return the totalResultCount (of all pages) after each page, so we can request extra pages after page 1.
          return testCaseResultResponse.data.QueryResult.TotalResultCount;
        });
      }

      // Process the first page separately...
      return getPage(1).then(function(totalResultCount) {
        $log.info('totalResultCount', totalResultCount);

        // The first page tells us how many more pages there are.
        // The rest of the pages may be loaded concurrently.

        var pageStarts = [];
        for (var pageStart = rallyMaxPageSize + 1; pageStart <= totalResultCount; pageStart = pageStart + rallyMaxPageSize) {
          pageStarts.push(pageStart);
        }

        return allItemPromises(pageStarts, function(pageStart) {
          return getPage(pageStart);
        }).then(function() {

          // When all of the pages have been loaded, return the aggregate structure we've created.
          return testResults;
        });
      });
    };

    return service;
  }]);




