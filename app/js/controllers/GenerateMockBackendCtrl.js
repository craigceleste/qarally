
// When the responses from web requests are several KB of JSON, it's impractical to create them for each test.
// I am trying to kill several birds with one stone here.

// 		1. writing code that traverses the web services to make sure they meet my expectations.
//			This code is adapted into the real request code later.

//		2. capturing the output of the web service into a form that I can adapt for mock data shared by unit tests.
//			I'll need to do some (hopefully superficial) sanitization of the data so that I don't check in real data to github

//		3. Over the last 3 or 4 years of using Rally, they periodically change their web services in an unexpected (to us) way.
//			This allows us to a) regenerate the mock data from their new service and do a diff to the old one to very quickly identify the changes.
//			b) debug through this generation traversal in order to update the code to their new format
//			c) our testing staff can use this through the website to help debug (they are software testers so are good at it). Understanding the problem may let them to change their data to avoid the bug to continue working

// It's also a bit of a JavaScript exercise for fun.

app.controller('GenerateMockBackendCtrl', ['$log', '$scope', '$q', '$http',  function($log, $scope, $q, $http) {
	"use strict";
	$log.debug('Creating GenerateMockBackendCtrl')

	// We'll write the generated code to the scope, which appears in the page, which may be saved.
	// This temperary message is there until we're done

	$scope.code = "Generating... Watch the console if you're bored..."

	// Collect some data here that will be built into the generated code at the end

	var guids = {};
	var nextGuidNum = 1;
	var requestsToScript = [];
	var didDrillDownHitBottom = false;

	// Helper functions

	function assert(condition, message) {
		if (!condition) {
			throw new Error(message);
		}
	}

	function getUrl(url, data) {
		var querystring = $.param(_.extend({jsonp:'JSON_CALLBACK'}, data));
		return url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
	}

	function pad(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

	function sanitize(data) {

		if (data === undefined) return data;
		var result = JSON.parse(JSON.stringify(data)); // poor mans deep copy. I realize there are better ways.
		if (!result) return result;

		function cleanGuidsFromString(value) {
			_.each(value.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/g), function(originalGuid) {
				var keyGuid = originalGuid.replace('-', '');
				var replacementGuid = guids[keyGuid];
				if (!replacementGuid) {
					replacementGuid = guids[keyGuid] = '00000000-0000-0000-0000-' + pad(nextGuidNum++, 12, '0');
				}
				value = value.replace(originalGuid, originalGuid.length == 36 ? replacementGuid : replacementGuid.replace('-', ''))
			})
			return value;
		}

		function process(value, key) {
			if (typeof value === 'boolean') {
				return value;
			}

			if (typeof value === 'number') {
				return value;
			}

			if (typeof value !== 'string') {
				$log.warn('sanitize: unrecognized type/value:', typeof value, value);
				return value;
			}

			// for sanitizing primitive objects, just clean guids and call it a day
			if (key === undefined) {
				value = cleanGuidsFromString(value);
			}
			else {

				// For cleaning Rally JSON objects, there is a short list of properties they have and the rules are different for each
				switch(key) {
					
					// TODO review. Ones I'm not 100% sure about.
					case 'State':
					case 'Theme':
						break;

					// contain info about our subscription. Our app doesn't care so just do this.
					case 'Modules':
					case 'StoryHierarchyType':
					case 'SubscriptionType':
					case 'Style':
						value = 'sanitized';
						break;

					// I don't think we need to clean these
					case '_objectVersion':
					case 'CreationDate':
					case '_CreatedAt':
					case '_type':
					case 'EndDate':
					case 'StartDate':
						break;

					// ID's and such
					case '_ref':
					case 'subscriptionRef':
					case 'workspaceRef':
					case 'workspacesRef':
					case 'projectRef':
					case 'projectsRef':
					case 'iterationRef':
					case 'iterationsRef':
					case '_refObjectUUID':
					case 'ObjectID':
					case 'SchemaVersion': // maybe don't need to clean this one. I don't care atm
						value = cleanGuidsFromString(value);
						break;

					// Special case
					case '_refObjectName':
					case 'Name':
						value = "TODO name";
						// TODO we need to be careful about replacing with a dummy value but ensuring the Name value also has the same value
						// consider passing in a scope object, or like guids have a lookup dictionary, but keyed on some kind of scope like the object that the property is on
						// Also find out whether _refObjectName always corresponds to Name (and not some other property for certain kinds of objects)
						break;

					// Descriptive strings with no side effects
					case 'Description':
					case 'Notes':
						// TODO give each instance a unique value of (key + number) like "Description 1"
						value = 'TODO ' + key;
						break;

					default:
					{
						throw new Error('Fail to sanitize [' + key + ']: ' + value)
					}
				}
			}

			// TODO identify any "user text" fields (fields that have user entered text values like Name and Description)
			//		Dates, Ref's, UUID's, should be fine
			// 
			// rename them to Name="Name1", etc
			// Be smart about keeping some things matched up like _refObjectName and Name
			// Maybe have a switch by property name (now many can their be?) and a default branch identifies properties I didn't review (and probably nulls them out)

			return value;
		}

		function traverse(obj) {
			if (obj) {
				for (var key in obj) {

					// objects will traverse
					if (typeof obj[key] === 'object') {
						if (obj) { // null is an object; don't traverse
							traverse(obj[key]);
						}
					}
					else {
						var newKey = process(key);
						var newValue = process(obj[key], key);
						delete obj[key];
						obj[newKey] = newValue;
					}

				}
			}
		}

		if (typeof result === 'object' && result){
			traverse(result)
		}
		else {
			result = process(result);
		}

		return result;
	}

	// TODO pass the data through the promises instead of aggregating in module variables.
	// AND prune unused objects from response data.
	//		for example, once we know which workspace we'll use, remove all other ones.
	function getSubscriotion() {
		$log.info('Querying Subscription');
		var subscriptionRef = 'https://rally1.rallydev.com/slm/webservice/v3.0/subscription';
		var subscriptionUrl = getUrl(subscriptionRef)
		return $http.jsonp(subscriptionUrl).then(function(subscriptionResponse){
			$log.info('subscriptionResponse', subscriptionResponse)

			assert(typeof subscriptionResponse.data.Subscription.Workspaces._ref === 'string', 'Expect subscriptionResponse to contain a _ref to get the list of workspaces.');

			requestsToScript.push({
				variable: 'subscription',
				inputs: { subscriptionRef: subscriptionRef },
				url: subscriptionUrl,
				data: subscriptionResponse.data
			})

			return getWorkspaceList(subscriptionResponse.data.Subscription.Workspaces._ref)
		});
	}

	function getWorkspaceList(workspacesRef) {
		$log.info('Querying Workspace list');
		var workspacesUrl = getUrl(workspacesRef, {pagesize:200});
		return $http.jsonp(workspacesUrl).then(function(workspacesResponse){
			$log.info('workspacesResponse', workspacesResponse)

			assert(Object.prototype.toString.call( workspacesResponse.data.QueryResult.Results ) === '[object Array]', 'Expect QueryResults.Results to be an array.');
			assert(workspacesResponse.data.QueryResult.Results.length, 'Expect at least one workspace.');

			requestsToScript.push({
				variable: 'workspaceList',
				inputs: { workspacesRef: workspacesRef },
				url: workspacesUrl,
				data: workspacesResponse.data
			})

			var stackOfProjectListRefs = _.reduce(workspacesResponse.data.QueryResult.Results, function(memo, workspace) {
				memo.push(workspace.Projects._ref);
				return memo;
			}, []);
			return getBestProjectList(stackOfProjectListRefs);
		});
	}

	function getBestProjectList(stackOfProjectListRefs) {
		
		// Use a recursive promise technique to attempt one request after the other until one succeeds
		//		(as opposed to making many concurrent requests and $q.all(...) them together)

		var deferred = $q.defer();

		function getNextProjectList() {
			// pop a project off of the stack and drill into it...
			var nextProjectsRef = stackOfProjectListRefs.pop();
			$log.info('Querying Project list');
			var projectsUrl = getUrl(nextProjectsRef, {pagesize:200});
			$http.jsonp(projectsUrl).then(function(projectsResponse){
				$log.info('projectsResponse', projectsResponse)

				getBestIterationList(_.reduce(projectsResponse.data.QueryResult.Results, function(memo, project) {
					memo.push(project.Iterations._ref);
					return memo;
				}, [])).then(function(){

					// ...if the drill-down process mades it through Project -> Iteration -> Test Set -> Test Cases -> Test Results
					// then resolve. Otherwise recurse to try the next project.
					if (didDrillDownHitBottom) {
						requestsToScript.push({
							variable: 'projectList',
							inputs: { projectsRef: nextProjectsRef },
							url: projectsUrl,
							data: projectsResponse.data
						});
						deferred.resolve();
					}
					else if (stackOfProjectListRefs.length > 0 ) {
						getNextProjectList(); // recurse
					}
					else {
						$log.error('No projects hit bottom.')
						deferred.resolve(); // fail to hit bottom. no more to try
					}
				});

			});
		}
		getNextProjectList();

		return deferred.promise;
	}

	function getBestIterationList(stackOfIterationRefs) {
		
		var deferred = $q.defer();

		function getNextIterationList() {

			var nextIterationRef = stackOfIterationRefs.pop();
			$log.info('Querying Iteration list');
			var iterationsUrl = getUrl(nextIterationRef, {pagesize:200});
			$http.jsonp(iterationsUrl).then(function(iterationsResponse){
				$log.info('iterationsResponse', iterationsResponse)

				getBestTestSetList(_.reduce(iterationsResponse.data.QueryResult.Results, function(memo, iteration) {
					memo.push({
						workspaceRef: iteration.Workspace._ref,
						iterationRef: iteration._ref
					});
					return memo;
				}, [])).then(function(){

					if (didDrillDownHitBottom) {
						requestsToScript.push({
							variable: 'iterationList',
							inputs: { iterationsRef: nextIterationRef },
							url: iterationsUrl,
							data: iterationsResponse.data
						});
						deferred.resolve();
					}
					else if (stackOfIterationRefs.length > 0 ) {
						getNextIterationList(); // recurse
					}
					else {
						deferred.resolve(); // fail to hit bottom. no more to try
					}
				});

			});
		}
		getNextIterationList();

		return deferred.promise;
	}

	function getBestTestSetList(stackOfWorkspacePlusIterationRefs) {

		var deferred = $q.defer();

		function getNextTestSetList() {

			var nextWorkspacePlusIterationRef = stackOfWorkspacePlusIterationRefs.pop();
			$log.info('Querying Test Set list');
			var testSetsUrl = getUrl('https://rally1.rallydev.com/slm/webservice/v3.0/testset', {
				  workspace: nextWorkspacePlusIterationRef.workspaceRef
				, query: '(Iteration = "' + nextWorkspacePlusIterationRef.iterationRef + '")' // space to left+right of = is important (30 minutes of my life...)
				, pagesize: 200
			});
			$http.jsonp(testSetsUrl).then(function(testSetsResponse){
				$log.info('testSetsResponse', testSetsResponse)

				getBestTestSetDetail(_.reduce(testSetsResponse.data.QueryResult.Results, function(memo, testSet) {
					memo.push(testSet._ref);
					return memo;
				}, [])).then(function(){

					if (didDrillDownHitBottom) {
						requestsToScript.push({
							variable: 'testSetList',
							inputs: nextWorkspacePlusIterationRef,
							url: testSetsUrl,
							data: testSetsResponse.data
						});
						deferred.resolve();
					}
					else if (stackOfWorkspacePlusIterationRefs.length > 0 ) {
						getNextTestSetList(); // recurse
					}
					else {
						deferred.resolve(); // fail to hit bottom. no more to try
					}
				});

			});
		}
		getNextTestSetList();

		return deferred.promise;
	}

	function getBestTestSetDetail() {
		didDrillDownHitBottom = true;
		return $q.when('foo')
	}

	// Do the stuff

	getSubscriotion().then(function() {

		if (!didDrillDownHitBottom) {
			$scope.code = 'Unable to recurse through Rally data. See console.';
			return;
		}

		$scope.code = "// This code is generated by GenerateMockBackendCtrl.js\n"
			+ "window.fakeBackend = (function(){\n"
			+ "    return {\n"
			+ "        // Use these inputs in tests to solicit particular responses.\n"
			+ "        // Modify these outputs to control what the service will respond with.\n"
			+ _.reduce(requestsToScript, function(memo, request){ return memo
			+ "        " + request.variable + ": {\n"
			+ "            inputs: " + JSON.stringify(sanitize(request.inputs)) + ",\n"
			+ "            data:" + JSON.stringify(sanitize(request.data)) + ",\n"
			+ "        },\n"
			}, "")
			+ "        setup: function($httpBackend) {\n"
			+ _.reduce(requestsToScript, function(memo, request){ return memo
			+ "\n            // " + request.variable + "\n"
			+ "            $httpBackend\n"
			+ "                .whenJSONP(" + JSON.stringify(sanitize(request.url)) + ")\n"
			+ "                .respond(this." + request.variable + ".data);\n"
			}, "")
			+ "        }\n"
			+ "    };\n"
			+ "}());"
	})

}]);

