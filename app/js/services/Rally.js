
// Rally service
// ...mostly data access via webservices

app.factory('Rally', ['$log', '$q', '$http', 'Store', function($log, $q, $http, Store) {
	"use strict";

	var service = {};

	// URL's are read from responses to earlier requests. These are some URL's for convenience

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

	var rallyMaxPageSize = 200;
	var workspacesStoreVersion = 1; // increment when the schema of stored workspaces changes, in order to ignore-and-refresh store.

	// JSONP overview (since it's new to me)
	//	- you can't make XMLHttpRequest's cross-site (i.e. to Rally)
	//  - you CAN download and execute a JavaScript file: <script src="//cross-site/file.js">
	//  - JSONP is a technique of downloading JSON that involves wrapping the JSON in a [P]rocedure call: some_function({json:'data here'})
	//  - Rally supports JSONP. adding &json=function_to_call to the query string, Rally will wrap the JSON in the [P]rocedure you declare
	// AngularJS $http
	//	- We need to use AngularJS's $http service for HTTP, in order to hook up two-way binding; otherwise we need to mess with $scope.$apply. I'm a few aha-bubbles away from understanding it
	//	- $http.jsonp(url) will a) create a temporary global function, b) replace the constant JSON_CALLBACK in the URL with its name, c) make the JSONP request d) the JSONP response will execute, calling the method e) that method will come back to us with the data.
	//  - So here, we are appending the JSONP callback into the URL to Rally.

	function getRallyJson(url, data) {
		var querystring = $.param(_.extend({jsonp:'JSON_CALLBACK'}, data));
		url = url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
		return $http.jsonp(url);
	};

	// Helper
	function allItemPromises(listOfItems, getPromiseForItem) {
		var promises = [];
		_.each(listOfItems, function(item) {
			promises.push(getPromiseForItem(item));
		});
		return $q.all(promises);
	}

	// GET subscription.
	// Extract relevant data.
	// Return promise.
	service.$getSubscriptionData = function() {
		return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/subscription').then(function(subscriptionResponse){
			$log.info('subscriptionResponse', subscriptionResponse);

			var subscriptionData = {
				_ref: subscriptionResponse.data.Subscription._ref,
				workspacesRef: subscriptionResponse.data.Subscription.Workspaces._ref
			};

			if (typeof subscriptionData._ref !== 'string') throw new Error('Expected to get subscription _ref');
			if (typeof subscriptionData.workspacesRef !== 'string') throw new Error('Expected to get workspacesRef from subscription.');

			return subscriptionData;
		})
	};

	// GET workspace list for subscription.
	// Extract relevant data.
	// Return promise.
	// workspacesRef: comes from getSubscriptionData
	service.$getWorkspaceList = function (workspacesRef) {
		return getRallyJson(workspacesRef, {pagesize: rallyMaxPageSize}).then(function(workspacesResponse){
			$log.info('workspacesResponse', workspacesResponse);

			if (workspacesResponse.data.QueryResult.TotalResultCount > workspacesResponse.data.QueryResult.PageSize) throw new Error('This app expects few workspaces (2 or 3 max) workspaces, but exceeded the page size.');

			var workspaceList = _.map(workspacesResponse.data.QueryResult.Results, function(workspace) {

				var workspaceData = {
					_ref: workspace._ref,
					name: workspace.Name,
					projectsRef: workspace.Projects._ref
				};

				if (typeof workspaceData._ref !== 'string') throw new Error('Expected to find workspace _ref for ' + workspacesRef);
				if (typeof workspaceData.name !== 'string') throw new Error('Expected to find workspace name for ' + workspacesRef);
				if (typeof workspaceData.projectsRef !== 'string') throw new Error('Expected to find projectsRef for ' + workspacesRef);

				return workspaceData;
			});

			return workspaceList;
		});
	};

	// GET project list for workspace.
	// Extract relevant data.
	// Return promise.
	// projectsRef: comes from getWorkspaceList
	service.$getProjectList = function(projectsRef) {
		return getRallyJson(projectsRef, {pagesize: rallyMaxPageSize}).then(function(projectsResponse){
			$log.info('projectsResponse', projectsResponse);

			if (projectsResponse.data.QueryResult.TotalResultCount > projectsResponse.data.QueryResult.PageSize) throw new Error('Expect few projects (20 or so).');

			var projectList = _.map(projectsResponse.data.QueryResult.Results, function(project) {

				var projectData = {
					_ref: project._ref,
					name: project.Name,
					iterationsRef: project.Iterations._ref
				};

				if (typeof projectData._ref !== 'string') throw new Error('Expect to find project _ref for ' + projectsRef);
				if (typeof projectData.name !== 'string') throw new Error( 'Expect to find project name for ' + projectsRef);
				if (typeof projectData.iterationsRef !== 'string') throw new Error('Expect to find iterationsRef for ' + projectsRef);

				return projectData;
			});

			return projectList;
		});
	};

	// GET iteration list for project.
	// Extract relevant data.
	// Return promise.
	// iterationsRef: comes from getProjectList
	service.$getIterationList = function(iterationsRef) {
		return getRallyJson(iterationsRef, {pagesize: rallyMaxPageSize}).then(function(iterationsResponse){
			$log.info('iterationsResponse', iterationsResponse);

			// This assertion is the closest one to failure. Rather than paging, consider adjusting the query to be the most recent 200.
			// This tool is about active testing, not reporting on older iterations.
			if (iterationsResponse.data.QueryResult.TotalResultCount > iterationsResponse.data.QueryResult.PageSize) throw new Error('Expect few iterations (100 or so).');

			var iterationList = _.map(iterationsResponse.data.QueryResult.Results, function(iteration) {

				var iterationData = {
					_ref: iteration._ref,
					name: iteration.Name,
					startDate: iteration.StartDate,
					endDate: iteration.EndDate
				};

				if (typeof iterationData._ref !== 'string') throw new Error( 'Expect to find iteration _ref for ' + iterationsRef);
				if (typeof iterationData.name !== 'string') throw new Error( 'Expect to find iteration name for ' + iterationsRef);
				if (typeof iterationData.startDate !== 'string') throw new Error( 'Expect to find iteration startDate for ' + iterationsRef);
				if (typeof iterationData.endDate !== 'string') throw new Error( 'Expect to find iteration endDate for ' + iterationsRef);

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

	// Traverse Subscription -> Workspace -> Project -> Iteration
	// Aggregate result of multiple queries.
	// Return promise.
	service.$getAllSubscriptionData = function() {

		// TODO review. Single or multiple subscriptions.
		// 		When I started this app it was intended to be used by our QA people against our Rally subscription.
		//		It seems that our QA people work on contract for more than one client, some of whom also have Rally subscriptions.
		//		Consider (but I'm not decided yet) to support N subscriptions. Concern: I wouldn't want to accidentally write data to the wrong subscription by accident.

		var subscriptionData;

		// Gets the entry point subscription data. Begin to accumulate the response here.

		return service.$getSubscriptionData()
			.then(function(_subscriptionData){
				subscriptionData = _subscriptionData;

		// That leads into the list of workspaces. Aggregate that into the response.

				return service.$getWorkspaceList(subscriptionData.workspacesRef);
			}).then(function(workspaceList){
				subscriptionData.workspaces = _.reduce(workspaceList, function(memo, ws) { memo[ws._ref] = ws; return memo; }, {});

		// It becomes harder to chain promises linearly.
		// The query for each workspaces project list may run concurrently.
		// This promise finishes when all of them are done (including drilling into child objects)

				return allItemPromises(workspaceList, function(workspace) {
					return service.$getProjectList(workspace.projectsRef)
						.then(function(projectList) {
							workspace.projects = _.reduce(projectList, function(memo, p) { memo[p._ref] = p; return memo; }, {});

		// For each project, drill into the iterations in the same way.

							return allItemPromises(projectList, function(project){
								return service.$getIterationList(project.iterationsRef)
									.then(function(iterationList){
										project.iterations = _.reduce(iterationList, function(memo, it) { memo[it._ref] = it; return memo; }, {});
									});
							});

						});
				});
			})

		// When all the recursion has completed, return the aggregated subscriptionData at the end of the promise chain.

			.then(function() {
				$log.info('getAllSubscriptionData', subscriptionData);

				return subscriptionData
			});
	};

	// Wrap getAllSubscriptionData in a caching/versioning layer
	service.initSubscriptionData = function(ignoreStore) {

		var currentVersion = 3;

		return Store.get({

			// Simple get

			ignoreStore: ignoreStore,
			key: 'subscriptionData',
			usePromise: true,
			fetch: service.$getAllSubscriptionData,

			// Upgrade strategy

			expectedVersion: currentVersion,
			upgrade: function(dataVersion, data) {
				switch(dataVersion) {
					// from from one upgrade into the next
					case 1:
					{
						data.test1 = '1 to 2';
					}
					case 2:
					{
						data.test2 = '2 to 3';
					}
					break; // break after last upgrade case
					default:

						// If you get this:
						// cause: you incremented the version without adding an upgrade path.
						// solution 1: add an upgrade path and redeploy. the users data will still be there.
						// solution 2: have users clear localStorage. They will lose all there LOCAL data (no Rally data is lost).

						throw new Error('initSubscriptionData: no upgrade path for version ' + dataVersion + '. stored version will be persisted (THIS IS A BUG).');
				}
				return data;
			}
		});
	};

	// TODO review. incomplete

	service.$getTestCasesForIteration = function(workspaceRef, iterationRef) {

		// Expect a few hundred TC's. 2-3000 max. If it's more, the concept of loading all TC's into localStorage and working from there won't work.

		var testCases = {};

		// Query for test sets in iteration

		return getRallyJson('https://rally1.rallydev.com/slm/webservice/v3.0/testset', {
				  workspace: workspaceRef
				, query: '(Iteration = "' + iterationRef + '")' // space to left+right of = is important (30 minutes of my life...)
				, pagesize: rallyMaxPageSize
			}).then(function(testSetsResponse){

			$log.info('testSetsResponse', testSetsResponse);

			// For each test set _ref, load the full test set

			var tsRefs = _.map(testSetsResponse.data.QueryResult.Results, function(tsResult) { return tsResult._ref });
			return allItemPromises(tsRefs, function(tsRef) {
				return getRallyJson(tsRef).then(function(testSetResponse) {
					$log.info('testSetsResponse', testSetResponse);

			// Load the list of test cases for the test set.
			// Separate request for each page.

					var promises = [];
					var pages = Math.floor( (testSetResponse.data.TestSet.TestCases.Count -1) / rallyMaxPageSize) + 1;
					for(var page = 1; page <= pages; page++) {
						
						promises.push(getRallyJson(testSetResponse.data.TestSet.TestCases._ref, {
							  page: page
							, pagesize: rallyMaxPageSize
						}).then(function(testCaseListResponse){
							$log.info('testCaseListResponse', testCaseListResponse);
							_.each(testCaseListResponse.data.QueryResult.Results, function(testCase) {
								testCases[testCase._ref] = testCase;
							})
						}));
					}
					return $q.all(promises);
				});
			});
		}).then(function() {
			$log.debug('getTestCasesForIteration is done');
			return testCases;
		});
	}

	return service;
}]);

