
// Rally service

//		- Stateless data access service to interact with Rally web services.
//		- Manage caching of data in window.localStorage.
//		- Transformation of Rally data into normalized local data (discard stuff we don't need).

app.factory('Rally', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window) {
	"use strict";

	// An overview of Rally web services we use.

	// Entry point (hard coded url)
	// https://rally1.rallydev.com/slm/webservice/v3.0/subscription

	// Workspaces list (get this from inside Subscription)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces

	// Workspace (get this from Workspaces list)
	// https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab

	// Projects list (get this from workspace)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?pagesize=200

	// Project (get this from projects list)
	// https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c

	// Iterations list (get this from project)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?pagesize=200

	// Sprint 82 iteration (get this from iteration list)
	// https://rally1.rallydev.com/slm/webservice/v3.0/iteration/a2f5bfa9-23b3-4dd3-be80-a999e5e54041

	// Test Sets Per Iteration is not navigated to from another request, but queried manually.
	// https://rally1.rallydev.com/slm/webservice/v3.0/testset
	//		?workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab
	//		&project=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fproject%2Fd0e34bc7-55c0-4757-857d-6be2604a6c6c
	//		&query=%28Iteration%20=%20%22https://rally1.rallydev.com/slm/webservice/v3.0/iteration/a2f5bfa9-23b3-4dd3-be80-a999e5e54041%22%29

	// Test Cases Per Test Set (get this from test set)
	// https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a/TestCases

	var service = {};

	var rallyMaxPageSize = 200;

	function getRallyJson(url, data) {
		var querystring = $.param(_.extend({jsonp:'JSON_CALLBACK'}, data));
		url = url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
		return $http.jsonp(url);
	};

	function allItemPromises(listOfItems, getPromiseForItem) {
		var promises = [];
		_.each(listOfItems, function(item) {
			promises.push(getPromiseForItem(item));
		});
		return $q.all(promises);
	}

	// As an internal tool, someone not familiar with Rally, AngularJS or this tool will be assigned to fix it as Rally changes their web services (as happens regularly)
	// I am making an effort to over-validate expectations about Rally's services with runtime assertinos
	function assert(test, message) {
		if (!test) throw new Error(message);
	}

	service.getSubscriptionData = function() {
		return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/subscription').then(function(subscriptionResponse){
			$log.info('subscriptionResponse', subscriptionResponse);

			var subscriptionData = {
				_ref: subscriptionResponse.data.Subscription._ref,
				workspacesRef: subscriptionResponse.data.Subscription.Workspaces._ref
			};

			assert(typeof subscriptionData._ref === 'string', 'Expected to get subscription _ref');
			assert(typeof subscriptionData.workspacesRef === 'string', 'Expected to get workspacesRef from subscription.');

			return subscriptionData;
		})
	};

	service.getWorkspaceList = function (workspacesRef) {
		return getRallyJson(workspacesRef, {pagesize: rallyMaxPageSize}).then(function(workspacesResponse){
			$log.info('workspacesResponse', workspacesResponse);

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

	service.getProjectList = function(projectsRef) {
		return getRallyJson(projectsRef, {pagesize: rallyMaxPageSize}).then(function(projectsResponse){
			$log.info('projectsResponse', projectsResponse);

			assert(projectsResponse.data.QueryResult.TotalResultCount <= projectsResponse.data.QueryResult.PageSize, 'Expect few projects (20 or so).');

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

	service.getIterationList = function(iterationsRef) {
		return getRallyJson(iterationsRef, {pagesize: rallyMaxPageSize}).then(function(iterationsResponse){
			$log.info('iterationsResponse', iterationsResponse);

			// This assertion may fail in the next year or so.
			// Consider order desc by date and take the first page (this tool is about active testing, not ancient iterations),
			// or traversing all pages, but be careful not to waste too much localStorage and download time on old data that won't be used.
			assert(iterationsResponse.data.QueryResult.TotalResultCount <= iterationsResponse.data.QueryResult.PageSize, 'Expect few iterations (100 or so).');

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

	service.getTestSetList = function (workspaceRef, iterationRef) {
		return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/testset', {
				  workspace: workspaceRef
				, query: '(Iteration = "' + iterationRef + '")' // space to left+right of = is important (30 minutes of my life...)
				, pagesize: rallyMaxPageSize
		}).then(function(testSetsResponse){
			$log.info('testSetsResponse', testSetsResponse);

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
	}

	// Here are some stats about the number of test cases per test set for our data:
	//		  6 test cases have > 1000        TC's (1482 max TC in one TS)
	//		 14 test cases have >  500 < 1000 TC's
	//		254 test cases have >  100 <  500 TC's
	//		434 test cases have >   10 <  100 TC's
	//		160 test cases have        <   10 TC's  <-- many are probably experiments or for dummy projects. I would discount these.
	// Rally TC's are about 3-4KB of JSON over the wire. About 1KB if we reduce  unused data and pseudo-minify it.

	var TestCaseKeys = {
		  _ref 							: 'a'
		, Description					: 'b'
		, FormattedID					: 'c'
		, Name 							: 'd'
		, Notes							: 'e'
		, ObjectId						: 'f'
		, Objective						: 'g'
		, PostConditions				: 'h'
		, PreConditions					: 'i'
		, TestFolderRef					: 'j'
		, Type							: 'k'
		, ValidationExpectedResult		: 'l'
		, ValidationInput				: 'm'
		, WorkProductRef				: 'n'
	};

	// expose for unit tests
	service.$testCaseKeys = TestCaseKeys;

	// It would be nice to store and use rally Test Cases in their native format.
	// This is prohibitive when localStorage is limited to 5 MB.
	// Here we eliminate/ignore unused properties and minify property names to 'a', 'b', etc.
	// This takes us from about 5KB to about 1KB per test case.
	service.transformTestCaseFromRallyToStorage  = function(testCase) {
		var newTc = {};
		newTc[TestCaseKeys.Description] = testCase.Description;
		assert(typeof newTc[TestCaseKeys.Description] === 'string', 'Description is required.');

		newTc[TestCaseKeys.FormattedID] = testCase.FormattedID;
		assert(/^TC[0-9]+$/.test(newTc[TestCaseKeys.FormattedID]), 'FormattedID must match the TC### pattern.');

		newTc[TestCaseKeys.Name] = testCase.Name;
		assert(typeof newTc[TestCaseKeys.Name] === 'string', 'Name is required.');

		newTc[TestCaseKeys.Notes] = testCase.Notes;
		newTc[TestCaseKeys.ObjectId] = testCase.ObjectId;
		newTc[TestCaseKeys.Objective] = testCase.Objective;
		newTc[TestCaseKeys.PostConditions] = testCase.PostConditions;
		newTc[TestCaseKeys.PreConditions] = testCase.PreConditions;
		newTc[TestCaseKeys.Type] = testCase.Type;
		newTc[TestCaseKeys.ValidationExpectedResult] = testCase.ValidationExpectedResult;
		newTc[TestCaseKeys.ValidationInput] = testCase.ValidationInput;
		if (testCase.TestFolder) {
			newTc[TestCaseKeys.TestFolderRef] = testCase.TestFolder._ref
		}
		if (testCase.WorkProduct) {
			newTc[TestCaseKeys.WorkProductRef] = testCase.WorkProduct._ref
		}
		return newTc;
	}

	// Transform the stored format to one that is easy to code against.
	service.transformTestCaseFromStorageToWorking = function(testCase) {

		var tc = _.reduce(TestCaseKeys, function(memo, minifiedKey, unminifiedKey){ memo[unminifiedKey] = testCase[minifiedKey]; return memo; }, {})

		// Produce a string containing all the text that can be searched.
 		// ... looks like they only want Name. Possibly remove this and just go by name

		tc._searchContent = (tc.Name||'')
			// + ' ' + (tc.Description||'')
			// + ' ' + (tc.Notes||'') 
			// etc
			.toUpperCase();

		// TODO layer in test results

		return tc;
	}

	service.getTestSetDetails = function(testSetRef) {

		// Test Set Details is a package containing a bunch of data for a test set: primarilly the test cases.
		var testSetDetails = {
			testCases: {},
			testFolders: {},
			workProducts: {}
		};

		return getRallyJson(testSetRef).then(function(testSetResponse) {
			$log.info('testSetResponse', testSetResponse);

			var pageStarts = [];
			for (var start = 1; start < testSetResponse.data.TestSet.TestCases.Count; start = start + rallyMaxPageSize) {
				pageStarts.push(start);
			}
			return allItemPromises(pageStarts, function(start) {
				return getRallyJson(testSetResponse.data.TestSet.TestCases._ref, {pagesize: rallyMaxPageSize, start: start})
					.then(function(testCaseListResponse){
						$log.info('testCaseListResponse', testCaseListResponse);
						_.each(testCaseListResponse.data.QueryResult.Results, function(tc) {
							var newTc = service.transformTestCaseFromRallyToStorage(tc)

							if (testCase.TestFolder && !testSetDetails.testFolders[testCase.TestFolder._ref]){
								testSetDetails.testFolders[testCase.TestFolder._ref] = {
									_ref: testCase.TestFolder._ref,
									name: testCase.TestFolder._refObjectName
								};
							}
							if (testCase.WorkProduct && !testSetDetails.workProducts[testCase.WorkProduct._ref]) {
								testSetDetails.workProducts[testCase.WorkProduct._ref] = {
									_ref: testCase.WorkProduct._ref,
									name: testCase.WorkProduct._refObjectName
								};
							}

							testSetDetails.testCases[tc._ref] = newTc;
						})
					});
			});
		}).then(function() {
			$log.debug('getTestCasesForTestSet', testSetDetails);
			return testSetDetails;
		});
	}

	// Traverse Subscription -> Workspace -> Project -> Iteration
	service.getAllSubscriptionData = function() {

		// TODO review. Single or multiple subscriptions.
		// 		When I started this app it was intended to be used by our QA people against our Rally subscription.
		//		It seems that our QA people work on contract for more than one client, some of whom also have Rally subscriptions.
		//		Consider (but I'm not decided yet) to support N subscriptions.
		//		Concern: I wouldn't want to accidentally write data to the wrong subscription.
		//		The single subscription approach forces people to clear the localStorage and start over when switching accounts (or use a different browser)
		// If I go with the N-subscription model, I'd probably refactor WPI to be SWPI and make them choose the subscription also.

		var subscriptionData;

		// Entry point is subscription data.

		return service.getSubscriptionData()
			.then(function(_subscriptionData){
				subscriptionData = _subscriptionData;

		// That leads into the list of workspaces

				return service.getWorkspaceList(subscriptionData.workspacesRef);
			}).then(function(workspaceList){
				subscriptionData.workspaces = _.reduce(workspaceList, function(memo, ws) { memo[ws._ref] = ws; return memo; }, {});

		// The query for each workspaces project list may run concurrently. This promise finishes when all of them are done.

				return allItemPromises(workspaceList, function(workspace) {
					return service.getProjectList(workspace.projectsRef)
						.then(function(projectList) {
							workspace.projects = _.reduce(projectList, function(memo, p) { memo[p._ref] = p; return memo; }, {});

		// For each project, drill into the iterations in the same way.

							return allItemPromises(projectList, function(project){
								return service.getIterationList(project.iterationsRef)
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

				return subscriptionData
			});
	};

	// Wrap getAllSubscriptionData in a caching layer
	service.initSubscriptionData = function(ignoreCache) {

		// increment currentVersion if the schema if cached data is changed.
		var currentVersion = 3;
		var storageKey = 'subscriptionData'
		var deferred = $q.defer();

		var innerData;
		if (!ignoreCache) {
			var outerDataJson = $window.localStorage[storageKey];
			if (outerDataJson) {
				var outerData = JSON.parse(outerDataJson);
				// no upgrade path provided for this data. It is a pure cache; no user data is here.
				if (outerData.version === currentVersion) {
					innerData = outerData.data;
				}
			}
		}

		if (innerData) {
			deferred.resolve(innerData);
		}
		else {
			service.getAllSubscriptionData().then(function(subscriptionData){
				$window.localStorage[storageKey] = {
					version: currentVersion,
					data: subscriptionData
				};
				deferred.resolve(subscriptionData)
			});

		}

		return deferred.promise;
	};

	service.initTestSetDetails = function(testSetRef, ignoreCache) {

		var currentVersion = 1;
		var storageKey = 'tsd_' + testSetRef;
		var lastAccessedKey = 'tsd_lastAccessed';
		var deferred = $q.defer();
		var resave;

		function ensureCacheSpaceFor(size) {

			// The goal here is to ensure that all test set details do not exceed 4MB.
			// NOT to guarantee that there is at least 4MB available: do not stomp other data if they exceed their limits.

			var maxSizeForAllTestSetDetails = 1024 * 1024 * 4;
			
			if (typeof size !== 'number' || size == NaN || size <= 0 || size >= maxSizeForAllTestSetDetails) {
				throw new Error('ensureCacheSpaceFor: size is invalid: ' + size);
			}

			var lastAccessed = {};
			var lastAccessedJson = $window.localStorage[lastAccessedKey];
			if (lastAccessedJson) {
				lastAccessedOuter = JSON.parse(lastAccessedJson);
				if (lastAccessedOuter.version == 1) {
					lastAccessed = lastAccessedOuter.data;
				}
			}

			var existingTestSets = {};
			for(var key in $window.localStorage) {
				if (key != storageKey) { // ignore the one being saved
					if (key.indexOf('tsd_') === 0) {
						existingTestSets[key] = {
							size: $window.localStorage[key].length,
							lastAccessed: lastAccessed ? lastAccessed[key] : undefined
						};
					}
				}
			}

			// while the sum of existing ones > target number, find the one that was accessed longest ago and delete it
			var targetSize = maxSizeForAllTestSetDetails - size;
			while (_.reduce(existingTestSets, function(memo, ts) { return memo + ts.size }, 0) > targetSize) {
				var victimKey = _.reduce(existingTestSets, function(bestYetKey, ts, key) {
					if (!bestYetKey) return key;
					var bestYet = existingTestSets[bestYetKey];
					if (bestYet.lastAccessed && ts.lastAccessed) {
						return bestYet.lastAccessed < ts.lastAccessed ? bestYetKey : key;
					}
					if (!bestYet.lastAccessed) {
						return bestYetKey;
					}
					return key;
				});
				$log.info('test set data de-cached to make room: ' + victimKey, $window.localStorage[victimKey]);
				$window.localStorage.removeItem(victimKey);
				delete existingTestSets[victimKey];
			}
		}

		function cacheIt(testSetDetails) {
			var outerDataJson = JSON.stringify({
				version: currentVersion,
				data: testSetDetails
			})

			var cacheSize = outerDataJson.length;
			ensureCacheSpaceFor(outerDataJson.length + storageKey.length + 100); // 100 is an arbitrary safety :/
			$window.localStorage[storageKey] = outerDataJson;
		}

		var innerData;
		if (!ignoreCache) {
			var outerDataJson = $window.localStorage[storageKey];
			if (outerDataJson) {
				var outerData = JSON.parse(outerDataJson);
				if (outerData.version === currentVersion) {
					innerData = outerData.data;
				}
			}
		}

		if (innerData){
			if (resave) {
				cacheIt(innerData);
			}
			deferred.resolve(innerData);
		}
		else {
			service.getTestSetDetails(testSetRef).then(function(testSetDetails) {
				cacheIt(testSetDetails);
				deferred.resolve(testSetDetails);
			})
		}

		return deferred.promise;
	}

	return service;
}]);

