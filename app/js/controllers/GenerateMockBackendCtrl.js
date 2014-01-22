
app.controller('GenerateMockBackendCtrl', ['$log', '$scope', '$q', '$http',  function($log, $scope, $q, $http) {
	"use strict";
	$log.debug('Creating GenerateMockBackendCtrl')

	$scope.code = "Generating... Watch the console if you're bored..."

	function assert(condition, message) {
		if (!condition) throw new Error(message);
	}

	function getUrl(url, data) {
		var querystring = $.param(_.extend({jsonp:'JSON_CALLBACK'}, data));
		return url + (url.indexOf('?') >= 0 ? '&' : '?') + querystring;
	}

	function sanitize(data) {
		// TODO
		return data;
	}

	// Collect some data here that will be built into the generated code at the end

	var requests = [];
	var subscriptionRef = 'https://rally1.rallydev.com/slm/webservice/v3.0/subscription';
	var workspacesRef;
	var workspacesUrl;
	var projectRef;
	var projectUrl;

	// Subscription

	$log.info('Querying subscriptionData');
	var subscriptionUrl = getUrl(subscriptionRef)
	$http.jsonp(subscriptionUrl)
	.then(function(subscriptionData) {
		$log.info('subscriptionData', subscriptionData)

		requests.push({
			url: subscriptionUrl,
			data: sanitize(subscriptionData)
		})

	// Workspaces

		workspacesRef = subscriptionData.data.Subscription.Workspaces._ref;
		assert(workspacesRef, 'workspacesRef expected');

		$log.info('Querying workspaces list');
		workspacesUrl = getUrl(workspacesRef, {pagesize:200});
		return $http.jsonp(workspacesUrl);
	}).then(function(workspacesData){
		$log.info('workspacesData', workspacesData)

		requests.push({
			url: workspacesUrl,
			data: workspacesData 
		})

	// Projects

		// TODO figure out a way to direct the generation down a particular path, without adding details about our data to github.

	// Iterations
	// Test Sets
	// Test Cases
	// ...




// end of the line
		return $q.when();
	}).then(function() {
		function getRefProperties() {
			return ""
				+ "        subscriptionRef: '" + subscriptionRef + "',\n"
				+ "        workspacesRef: '" + workspacesRef + "',\n"
		}
		function getBackendCalls() {
			var code = "";
			for(var i = 0; i < requests.length; i++) {
				code += "            $httpBackend\n"
				code += "                .whenJSONP('" + requests[i].url + "')\n"
				code += "                .respond(" + JSON.stringify(requests[i].data) + ");\n"
			}
			return code;
		}
		$scope.code = "window.fakeBackend = (function(){\n"
			+ "    return {\n"
			+ getRefProperties()
			+ "        setup: function() {\n"
			+ getBackendCalls()
			+ "        }\n"
			+ "    };\n"
			+ "}());"
	})

}]);

