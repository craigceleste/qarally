'use strict';

// Rally service

//		- Stateless data access service to interact with Rally web services.
//		- Manage caching of data in window.localStorage.
//		- Transformation of Rally data into normalized local data (discard stuff we don't need).

app.factory('Rally', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window) {

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

	// Entry point (hard coded url)
	// https://rally1.rallydev.com/slm/webservice/v3.0/subscription

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

	// Workspaces list (get this from inside Subscription)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces

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

	// Projects list (get this from workspace)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?pagesize=200

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

	// Iterations list (get this from project)
	// https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?pagesize=200

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

	// Test Sets Per Iteration is not navigated to from another request, but queried manually.
	// https://rally1.rallydev.com/slm/webservice/v3.0/testset
	//		?workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab
	//		&query=%28Iteration%20=%20%22https://rally1.rallydev.com/slm/webservice/v3.0/iteration/a2f5bfa9-23b3-4dd3-be80-a999e5e54041%22%29

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

	// "Test Set Details" is going to be an aggregate structure, with the test cases list as the central piece.
	// Test Cases Per Test Set (get this from test set)
	// https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a
	// https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a/TestCases

	service.getTestCaseList = function(testSetRef) {

		// Test Set Details is a package containing a bunch of data for a test set: primarilly the test cases.
		var testCases = {};

		return getRallyJson(testSetRef).then(function(testSetResponse) {
			$log.info('testSetResponse', testSetResponse);

			// Make an array with the first TC on each page (1, 200, 400, etc). It makes the allItemPromises easier.
			var pageStarts = [];
			for (var start = 1; start < testSetResponse.data.TestSet.TestCases.Count; start = start + rallyMaxPageSize) {
				pageStarts.push(start);
			}

			// separate request for each page of test cases
			return allItemPromises(pageStarts, function(start) {
				return getRallyJson(testSetResponse.data.TestSet.TestCases._ref, {pagesize: rallyMaxPageSize, start: start})
					.then(function(testCaseListResponse){

						$log.info('testCaseListResponse', testCaseListResponse);
						_.each(testCaseListResponse.data.QueryResult.Results, function(tc) {
							testCases[tc._ref] = tc;

							assert(typeof testCases[tc._ref].Description === 'string', 'Description is required.');
							assert(/^TC[0-9]+$/.test(testCases[tc._ref].FormattedID), 'FormattedID must match the TC### pattern.');
							assert(typeof testCases[tc._ref].Name === 'string', 'Name is required.');
						})
					});
			});
		}).then(function() {
			$log.debug('getTestCasesList', testCases);
			return testCases;
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
				$window.localStorage[storageKey] = JSON.stringify({
					version: currentVersion,
					data: subscriptionData
				});
				deferred.resolve(subscriptionData)
			});

		}

		return deferred.promise;
	};

	// TODO old version
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

	service.initTestSetDetails = function(testSetRef, ignoreCache) {

		// Here are some stats about the number of test cases per test set for our data:
		//		  6 test cases have > 1000        TC's (1482 max)
		//		 14 test cases have >  500 < 1000 TC's
		//		254 test cases have >  100 <  500 TC's (most closer to 100)
		//		434 test cases have >   10 <  100 TC's (most closer to 100)
		//		160 test cases have        <   10 TC's  <-- many are probably experiments or for dummy projects. I would discount these.

		// This function is one of the more complicated bits parts of the app, but central to the app's concept of "cache it locally and work from there"
		// In order to store large numbers of test cases in localStorage, they need to be heavily transformed between 3 states: Rally's native state, a minimized state for storage and the unminified working in memory copy.
		// Rally TC's are about 3-4KB of JSON over the wire. About 1KB if we reduce  unused data and pseudo-minify it.

		var storageVersion = 1;
		var storageKey = 'tsd_' + testSetRef;
		var lastAccessedKey = 'tsd_lastAccessed';

		var minificationKeys = {
			  _ref                          : '_'
			, Description					: 'a'
			, FormattedID					: 'b'
			, Name 							: 'c'
			, Notes							: 'd'
			, ObjectId						: 'e'
			, Objective						: 'f'
			, PostConditions				: 'g'
			, PreConditions					: 'h'
			, TestFolderRef					: 'i'
			, Type							: 'j'
			, ValidationExpectedResult		: 'k'
			, ValidationInput				: 'l'
			, WorkProductRef				: 'm'
		};

		// transform from Rally format to a minified state for storage: ignore/remove unused data and replace key names with a short form.
		function minifyTestCase(testCase) {
			var minifiedTc = {};
			minifiedTc[minificationKeys._ref] = testCase._ref;
			minifiedTc[minificationKeys.Description] = testCase.Description;
			minifiedTc[minificationKeys.FormattedID] = testCase.FormattedID;
			minifiedTc[minificationKeys.Name] = testCase.Name;
			minifiedTc[minificationKeys.Notes] = testCase.Notes;
			minifiedTc[minificationKeys.ObjectId] = testCase.ObjectId;
			minifiedTc[minificationKeys.Objective] = testCase.Objective;
			minifiedTc[minificationKeys.PostConditions] = testCase.PostConditions;
			minifiedTc[minificationKeys.PreConditions] = testCase.PreConditions;
			minifiedTc[minificationKeys.Type] = testCase.Type;
			minifiedTc[minificationKeys.ValidationExpectedResult] = testCase.ValidationExpectedResult;
			minifiedTc[minificationKeys.ValidationInput] = testCase.ValidationInput;
			if (testCase.TestFolder) {
				minifiedTc[minificationKeys.TestFolderRef] = testCase.TestFolder._ref
			}
			if (testCase.WorkProduct) {
				minifiedTc[minificationKeys.WorkProductRef] = testCase.WorkProduct._ref
			}
			// TODO there are probably more properties we need.
			return minifiedTc;
		}

		// Expect the result of getTestCaseList (a dictionary of test cases in rally's format)
		function minifyTestSetDetails(testCaseList) {

			// produce an aggregate package containing details about the test set, mostly inferred from the test cases
			var storedTestSetDetails = {
				testCases: [],
				testFolders: {},
				workProducts: {}
			}
			_.chain(testCaseList)
				.sortBy(function(tc) { return parseInt(tc.FormattedID.substring(2)); })
				.each(function(tc){
					storedTestSetDetails.testCases.push(minifyTestCase(tc));
					if (tc.TestFolder && !storedTestSetDetails.testFolders[tc.TestFolder._ref]) {
						storedTestSetDetails.testFolders[tc.TestFolder._ref] = tc.TestFolder._refObjectName;
					}
					if (tc.WorkProduct && !storedTestSetDetails.workProducts[tc.WorkProduct._ref]) {
						storedTestSetDetails.workProducts[tc.WorkProduct._ref] = tc.WorkProduct._refObjectName;
					}
			});
			return storedTestSetDetails;
		}

		// Transform the minified storage format to the working format; restore minified property names. eliminated properties remain gone.
		function deminifyTestCase(testCase) {

			var tc = _.reduce(minificationKeys, function(tc, minifiedKey, unminifiedKey){
				tc[unminifiedKey] = testCase[minifiedKey]; return tc;
			}, {})

			tc._searchContent = (tc.Name||'')
				// + ' ' + (tc.Description||'')
				// + ' ' + (tc.Notes||'') 
				// etc
				.toUpperCase();

			// TODO layer in test results or other in-memory helpers

			return tc;
		}

		// Deminify the stored format into the working format
		function deminifyTestSetDetails(storedTestSetDetails) {

			var workingTestSetDetails = {
				testCases: [], // array (I don't want to sort repeatedly in the view)
				testFolders: {},
				workProducts: {}
			}

			_.each(storedTestSetDetails.testFolders, function(name, _ref) {
				workingTestSetDetails.testFolders[_ref] = {
					_ref: _ref,
					Name: name
				};
			});

			_.each(storedTestSetDetails.workProducts, function(name, _ref) {
				workingTestSetDetails.workProducts[_ref] = {
					_ref: _ref,
					Name: name
				};
			});

			_.each(storedTestSetDetails.testCases, function(tc) {
				workingTestSetDetails.testCases.push(deminifyTestCase(tc))
			});

			return workingTestSetDetails;
		}

		// Ensure that all test set details do not exceed 4MB.
		// Do NOT guarantee that there is at least 4MB available. Only guarantee that existing test sets do not use more than this much. It is up to other people not to go over their bucket sizes
		function ensureExistingTestSetsDoNotExceedSize(size) {

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

			// eliminate existing ones until the size is lower than the target number
			var targetSize = maxSizeForAllTestSetDetails - size;
			assert(targetSize > 0, 'it should not be possible for targetSize to be <= 0 as this could result in an infinite loop.')
			while (_.reduce(existingTestSets, function(memo, ts) { return memo + ts.size }, 0) // sum of sizes for existing ones
				> targetSize) {
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
				$log.info('test set data de-cached to make room: ' + victimKey, existingTestSets[victimKey].size, $window.localStorage[victimKey]);
				$window.localStorage.removeItem(victimKey);
				delete existingTestSets[victimKey];
			}
		}

		function cacheIt(storedTestSetDetails) {
			var outerDataJson = JSON.stringify({
				version: storageVersion,
				data: storedTestSetDetails
			})
			ensureExistingTestSetsDoNotExceedSize(outerDataJson.length + storageKey.length);
			$window.localStorage[storageKey] = outerDataJson;
		}

		var deferred = $q.defer();

		var testSetDetails;
		if (!ignoreCache) {
			var outerDataJson = $window.localStorage[storageKey];
			if (outerDataJson) {
				var outerData = JSON.parse(outerDataJson);
				if (outerData.version === storageVersion) {
					var storedTestSetDetails = outerData.data;
					var testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
				}
			}
		}

		if (testSetDetails){
			deferred.resolve(testSetDetails);
		}
		else {
			service.getTestCaseList(testSetRef).then(function(testCaseList) {
				var storedTestSetDetails = minifyTestSetDetails(testCaseList)
				cacheIt(storedTestSetDetails);
				var testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
				deferred.resolve(testSetDetails);
			})
		}

		return deferred.promise;
	}

	return service;
}]);

