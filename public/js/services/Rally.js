'use strict';

// Rally service

//		- Stateless data access service to interact with Rally web services.
//		- Manage caching of data in window.localStorage.
//		- Transformation of Rally data into normalized local data (discard stuff we don't need).

app.factory('Rally', ['$log', '$q', '$http', '$window', function($log, $q, $http, $window) {

	var service = {};

	var rallyMaxPageSize = 200;

	// I am making an effort to over-validate and assert expectations about Rally's services,
	// because this app will be maintained by people not familiar with Rally, AngularJS or this code.

	function assert(test, message) {
		if (!test) throw new Error(message);
	}

	// Internal helper to handle the JSONP stuff

	function getRallyJson(url, data) {
		var querystring = $.param(_.extend({jsonp:'JSON_CALLBACK'}, data));
		url = url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
		return $http.jsonp(url);
	};

	// Internal helper to produce a single promise for a list of items.

	function allItemPromises(listOfItems, getPromiseForItem) {
		var promises = [];
		_.each(listOfItems, function(item) {
			promises.push(getPromiseForItem(item));
		});
		return $q.all(promises);
	}

	// hard coded starting point: https://rally1.rallydev.com/slm/webservice/v3.0/subscription
	service._getSubscriptionData = function() {
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

	// workspacesRef example: https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces
	service._getWorkspaceList = function(workspacesRef) {
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

	// projectsRef example: https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?pagesize=200
	service._getProjectList = function(projectsRef) {
		return getRallyJson(projectsRef, {pagesize: rallyMaxPageSize}).then(function(projectsResponse){
			$log.info('projectsResponse', projectsResponse);

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
			$log.info('iterationsResponse', iterationsResponse);

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

		// TODO review. Single or multiple subscriptions.
		// 		When I started this app it was intended to be used by our QA people against our Rally subscription.
		//		It seems that our QA people work on contract for more than one client, some of whom also have Rally subscriptions.
		//		The current approach forces them to clear all cached data when switching between subscriptions.

		var subscriptionData;

		// Entry point is subscription data.

		return service._getSubscriptionData()
			.then(function(_subscriptionData){
				subscriptionData = _subscriptionData;

		// That leads into the list of workspaces

				return service._getWorkspaceList(subscriptionData.workspacesRef);
			}).then(function(workspaceList){
				subscriptionData.workspaces = _.reduce(workspaceList, function(memo, ws) { memo[ws._ref] = ws; return memo; }, {});

		// The query for each workspaces project list may run concurrently. This promise finishes when all of them are done.

				return allItemPromises(workspaceList, function(workspace) {
					return service._getProjectList(workspace.projectsRef)
						.then(function(projectList) {
							workspace.projects = _.reduce(projectList, function(memo, p) { memo[p._ref] = p; return memo; }, {});

		// For each project, drill into the iterations in the same way.

							return allItemPromises(projectList, function(project){
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
			service._getAllSubscriptionData().then(function(subscriptionData){
				$window.localStorage[storageKey] = JSON.stringify({
					version: currentVersion,
					data: subscriptionData
				});
				deferred.resolve(subscriptionData)
			});

		}

		return deferred.promise;
	};

	// Test Sets Per Iteration is not navigated to from another request, but queried manually.
	// https://rally1.rallydev.com/slm/webservice/v3.0/testset
	//		?workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab
	//		&query=%28Iteration%20=%20%22https://rally1.rallydev.com/slm/webservice/v3.0/iteration/a2f5bfa9-23b3-4dd3-be80-a999e5e54041%22%29
	service.getTestSetList = function(workspaceRef, iterationRef) {
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

	// localStorage is up to 5MB (which runs out fast). We will minify of the JSON (including discarding properties we don't need) is required.

	var tcMinificationKeys = {
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

	// Example URLs
	// https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a
	// https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/4072261e-d0d2-4119-9288-c94ba6b5686a/TestCases
	service._getTestSetDetails = function(testSetRef) {

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
			$log.info('testSetResponse', testSetResponse);

			assert(testSetResponse.data.TestSet.Name, "Test Set name is expected to be set.");
			testSetDetails.name = testSetResponse.data.TestSet.Name;

			// make an array containing the first index on each page
			var pageStarts = [];
			for (var pageStart = 1; pageStart < testSetResponse.data.TestSet.TestCases.Count; pageStart = pageStart + rallyMaxPageSize) {
				pageStarts.push(pageStart);
			}

			// separate request for each page of test cases; complete promise when all are done.
			return allItemPromises(pageStarts, function(pageStart) {
				return getRallyJson(testSetResponse.data.TestSet.TestCases._ref, {pagesize: rallyMaxPageSize, start: pageStart})
					.then(function(testCaseListResponse){
						$log.info('testCaseListResponse', testCaseListResponse);

						_.each(testCaseListResponse.data.QueryResult.Results, function(tc) {

							assert(typeof tc._ref === 'string' && !testSetDetails.testCases[tc._ref], 'TC must have a _ref and it must be unique.');
							assert(typeof tc.Name === 'string', 'Name is required.');
							assert(typeof tc.Description === 'string', 'Description is required.');
							assert(/^TC[0-9]+$/.test(tc.FormattedID), 'FormattedID must match the TC### pattern.');

							testSetDetails.testCases.push(minifyTestCase(tc));

							if (tc.TestFolder) {
								assert(typeof tc.TestFolder._ref === 'string', 'TestFolder should contain a _ref');
								assert(typeof tc.TestFolder._refObjectName === 'string', 'TestFolder should contain a _refObjectName');

								if (!testSetDetails.testFolders[tc.TestFolder._ref]) {
									testSetDetails.testFolders[tc.TestFolder._ref] = tc.TestFolder._refObjectName;
								}
								else {
									assert(testSetDetails.testFolders[tc.TestFolder._ref] === tc.TestFolder._refObjectName, "Each TC that references a TF with the _ref should have the same TF name.");
								}
							}

							if (tc.WorkProduct) {
								assert(typeof tc.WorkProduct._ref === 'string', 'WorkProduct should contain a _ref');
								assert(typeof tc.WorkProduct._refObjectName === 'string', 'WorkProduct should contain a _refObjectName');

								if (!testSetDetails.workProducts[tc.WorkProduct._ref]) {
									testSetDetails.workProducts[tc.WorkProduct._ref] = tc.WorkProduct._refObjectName;
								}
								else {
									assert(testSetDetails.workProducts[tc.WorkProduct._ref] === tc.WorkProduct._refObjectName, "Each TC that references a WP with the _ref should have the same WP name.");
								}
							}
						})
					});
			});
		}).then(function(){

			// TODO for each work product and test folder, we need to make an additional query to learn it's FormattedID (US123, DE456, etc). Maybe some other info while we're there, if it's handy.
			return $q.when(undefined);

		}).then(function() {
			$log.debug('getTestSetDetails', testSetDetails);

			testSetDetails.testCases = _.sortBy(testSetDetails.testCases, function(tc) {
				assert(tc[tcMinificationKeys.FormattedID].length > 2 && tc[tcMinificationKeys.FormattedID].substr(0,2) === "TC", "FormattedID expected in the TC123 format.");
				return parseInt(tc[tcMinificationKeys.FormattedID].substr(2));
			});

			$log.debug('getTestSetDetails', testSetDetails);
			return testSetDetails;
		});
	}

	// Wrap getTestSetDetails in a caching layer
	service.initTestSetDetails = function(testSetRef, ignoreCache) {

		// Here are some stats about the number of test cases per test set for our data:
		//		  6 test sets have > 1000        TC's (1482 max)
		//		 14 test sets have >  500 < 1000 TC's
		//		254 test sets have >  100 <  500 TC's (most closer to 100)
		//		434 test sets have >   10 <  100 TC's (most closer to 100)
		//		160 test sets have        <   10 TC's  <-- many are probably experiments or for dummy projects. I would discount these.

		var storageVersion = 1;
		var storageKey = 'tsd_' + testSetRef;
		var lastAccessedKey = 'tsd_lastAccessed';

		// Transform the minified storage format to the working format
		function deminifyTestCase(testCase) {

			var tc = _.reduce(tcMinificationKeys, function(tc, minifiedKey, unminifiedKey){
				tc[unminifiedKey] = testCase[minifiedKey]; return tc;
			}, {})

			// TODO layer in additional runtime information, such as helpers/hints for searching, filtering, etc.
			// TODO layer in information about test results (stored elsewhere)

			return tc;
		}

		// Deminify the stored format into the working format
		function deminifyTestSetDetails(storedTestSetDetails) {

			var workingTestSetDetails = {
				testCases: [],
				testFolders: {},
				workProducts: {}
			}

			_.each(storedTestSetDetails.testFolders, function(name, _ref) {
				workingTestSetDetails.testFolders[_ref] = {
					_ref: _ref,
					Name: name,
					FormattedID: 'US123' // TODO
				};
			});

			_.each(storedTestSetDetails.workProducts, function(name, _ref) {
				workingTestSetDetails.workProducts[_ref] = {
					_ref: _ref,
					Name: name,
					FormattedID: 'TF789' // TODO
				};
			});

			_.each(storedTestSetDetails.testCases, function(tc) {
				workingTestSetDetails.testCases.push(deminifyTestCase(tc))
			});

			return workingTestSetDetails;
		}

		// Remove oldest test sets (by last accessed date) until there is at least enough storage for the new one.
		// IMPORTANT: we are not comparing with the amount of space within localStorage. Only by an amount allowed for Test Sets to that used by Test Sets.
		// It is legitimate to get an out-of-space error if other components store too much stuff there.
		function ensureFreeStorageToSize(size) {

			var maxSizeForAllTestSetDetails = 1024 * 1024 * 4;

			assert(typeof size === 'number' && size != NaN && size > 0 && size <= maxSizeForAllTestSetDetails, "ensureFreeStorageToSize: size is invalid");

			// The storage used by existing test sets must be reduced until there is room for the new one.

			var targetSize = maxSizeForAllTestSetDetails - size;

			assert(targetSize > 0, 'it should not be possible for targetSize to be <= 0 as this could result in an infinite loop.')

			// Review the existing test sets

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
							lastAccessed: lastAccessed[key]
						};
					}
				}
			}

			// Eliminate test sets until there is room for the new one.

			var sanity = 1000;

			while (targetSize < _.reduce(existingTestSets, function(memo, ts) { return memo + ts.size }, 0)) { // sum of sizes for existing ones
				
				assert(sanity-- > 0, 'ensureFreeStorageToSize: invinite loop guard.');

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
				}, null);

				$log.info('test set data de-cached to make room: ' + victimKey, existingTestSets[victimKey].size, $window.localStorage[victimKey]);
				delete $window.localStorage[victimKey];
				delete existingTestSets[victimKey];
			}
		}

		function cacheIt(storedTestSetDetails) {
			var outerDataJson = JSON.stringify({
				version: storageVersion,
				data: storedTestSetDetails
			})
			ensureFreeStorageToSize(outerDataJson.length + storageKey.length + 2);
			$window.localStorage[storageKey] = outerDataJson;
		}

		var deferred = $q.defer();
		
		if (!testSetRef) {
			deferred.resolve(undefined);
		}
		else {

			var testSetDetails;
			if (!ignoreCache) {
				var outerDataJson = $window.localStorage[storageKey];
				if (outerDataJson) {
					var outerData = JSON.parse(outerDataJson);
					// no upgrade path for purely cached data. Refetch on stale.
					if (outerData.version === storageVersion) {
						var storedTestSetDetails = outerData.data;
						var testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
					}
				}
			}

			if (testSetDetails){

				// TODO update last accessed date
				
				deferred.resolve(testSetDetails);
			}
			else {
				service._getTestSetDetails(testSetRef).then(function(storedTestSetDetails) {
					cacheIt(storedTestSetDetails);

					// TODO update last accessed date

					var testSetDetails = deminifyTestSetDetails(storedTestSetDetails);
					deferred.resolve(testSetDetails);
				})
			}
		}

		return deferred.promise;
	}

	return service;
}]);

