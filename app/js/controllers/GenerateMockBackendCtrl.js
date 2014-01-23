
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
	var requests = [];
	var subscriptionRef = 'https://rally1.rallydev.com/slm/webservice/v3.0/subscription';
	var subscriptionUrl;
	var workspacesRef;
	var workspacesUrl;
	var projectsRefs = {}; // keyed on workspaceRef

	// Helper functions

	function assert(condition, message) {
		if (!condition) throw new Error(message);
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

		var result = JSON.parse(JSON.stringify(data)); // poor mans deep copy. I realize there are better ways.
		if (!result) return result;

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

			// replace any guids in the string; keep a dictionary so guids in all future strings get the same new value
			_.each(value.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/g), function(originalGuid) {
				var keyGuid = originalGuid.replace('-', '');
				var replacementGuid = guids[keyGuid];
				if (!replacementGuid) {
					replacementGuid = guids[keyGuid] = '00000000-0000-0000-0000-' + pad(nextGuidNum++, 12, '0');
				}
				value = value.replace(originalGuid, originalGuid.length == 36 ? replacementGuid : replacementGuid.replace('-', ''))
			})

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

	// Subscription

	$log.info('Querying Subscription');
	subscriptionUrl = getUrl(subscriptionRef)
	$http.jsonp(subscriptionUrl)
	.then(function(subscriptionReponse) {
		$log.info('subscriptionReponse', subscriptionReponse)

		requests.push({
			url: subscriptionUrl,
			data: subscriptionReponse.data
		})

	// Workspaces

		workspacesRef = subscriptionReponse.data.Subscription.Workspaces._ref;
		assert(workspacesRef, 'workspacesRef expected');

		$log.info('Querying workspaces list');
		workspacesUrl = getUrl(workspacesRef, {pagesize:200});
		return $http.jsonp(workspacesUrl);
	}).then(function(workspacesResponse){
		$log.info('workspacesResponse', workspacesResponse)

		requests.push({
			url: workspacesUrl,
			data: workspacesResponse.data
		})



// TODO recursion idea
// track 1 workspaceRef, 1 projectRef, 1 iterationRef, etc
// begin drilling in
// if it doesn't reach the bottom, fall out of those promises and begin again
// only end when we have reached the bottom and have 1 of each request type to be scripted.
// use the recursive function technique used below (queryNextProjectList)
// nest the recursive functions inside each other.

	function drillIntoWorkspace() {
		function drillIntoProject() {
			function drillIntoIteration() {
				function drillIntoTestSets() {
					function drillIntoTestSetDetails() {
					}
				}
			}
		}
	}







	// Projects - this is a recursive promise; it will load one project and then the next when that is done, and then the next, until done.
	// 		note that it will drill all the way into Project->Iteration->TestSet, etc before going to the second Project
	//		I could do them concurrently but I kind of want to stop once I have accumulated enough data and I don't know which projects go deep enough until I check.

		var queuedProjectRequests = _.reduce(workspacesResponse.data.QueryResult.Results, function(memo, workspace) {
			memo.push({
				workspaceRef: workspace._ref,
				projectsRef: workspace.Projects._ref
			});
			return memo;
		}, []);

		var workspaceDeferred = $q.defer();

		function queryNextProjectList() {
			var projectRequest = queuedProjectRequests.shift();
			projectsRefs[projectRequest.workspaceRef] = projectRequest.projectsRef

			$log.info('Querying projects for workspace ' + projectRequest.workspaceRef);
			var projectsUrl = getUrl(projectRequest.projectsRef, {pagesize:200});
			$http.jsonp(projectsUrl).then(function(projectsResponse){
				$log.info('projectsResponse', projectsResponse)

				requests.push({
					url: projectsUrl,
					data: projectsResponse.data
				});

	// TODO 
	// Iterations
	// Test Sets
	// Test Cases
	// ...


	// Project promise recursion:
	//		don't drill into another Project until we are done with this one.
	//		end the outer deferred until we're done iterating.

				if (queuedProjectRequests.length > 0) { // TODO ... and previous iterations have not drilled all the way down to represent all data
					queryNextProjectList(); // recurse
				}
				else {
					workspaceDeferred.resolve();
				}
			});
		}

		assert(queuedProjectRequests.length > 0, 'we should have some projects or this will never resolve.')
		queryNextProjectList();

		return workspaceDeferred.promise;

// ... I just want to push the final processing into a next promise, even if could happen here...
	}).then(function() {
		function getRefProperties() {
			return ""
				+ "        subscriptionRef: '" + sanitize(subscriptionRef) + "',\n"
				+ "        workspacesRef: '" + sanitize(workspacesRef) + "',\n"
				+ "        projectsRefs: " + JSON.stringify(sanitize(projectsRefs)).replace('{','{\n            ').replace(',',',\n            ').replace('}', '\n        }') + ",\n"
		}
		function getBackendCalls() {
			var code = "";
			for(var i = 0; i < requests.length; i++) {
				code += "            $httpBackend\n"
				code += "                .whenJSONP('" + sanitize(requests[i].url) + "')\n"
				code += "                .respond(" + JSON.stringify(sanitize(requests[i].data)) + ");\n"
			}
			return code;
		}
		$scope.code = "// This code is generated by GenerateMockBackendCtrl.js\n"
			+ "window.fakeBackend = (function(){\n"
			+ "    return {\n"
			+ getRefProperties()
			+ "        setup: function() {\n"
			+ getBackendCalls()
			+ "        }\n"
			+ "    };\n"
			+ "}());"
	})

}]);

