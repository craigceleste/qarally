'use strict';

describe('The Rally service', function(){

	var rallySvc; // unit under test

	// DI's
	var mockWindow, $rootScope, $httpBackend;

	beforeEach(function() {

		module('qa-rally');

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
		})
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
 		$httpBackend.verifyNoOutstandingRequest();
 	});

 	it('is wired for construction.', function() {
 		expect(rallySvc).toBeDefined();
 	});

	it('getSubscriptionData prepares request correctly and extracts data correctly from the response.', function() {

		var subscriptionData;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getSubscriptionData()
			.then(function(data) { subscriptionData = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(subscriptionData._ref).toEqual(fakeBackend.subscription.data.Subscription._ref);
		expect(subscriptionData.workspacesRef).toEqual(fakeBackend.subscription.data.Subscription.Workspaces._ref);
	});

	it('getWorkspaceList prepares request correctly and extracts data correctly from the response.', function() {

		var workspaceList;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getWorkspaceList(fakeBackend.workspaceList.inputs.workspacesRef)
			.then(function(data) { workspaceList = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(workspaceList.length).toEqual(fakeBackend.workspaceList.data.QueryResult.Results.length)
		expect(workspaceList[0]._ref).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0]._ref);
		expect(workspaceList[0].name).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Name);
		expect(workspaceList[0].projectsRef).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Projects._ref);
	});

	it('getProjectList prepares request correctly and extracts data correctly from the response.', function() {

		var projectList;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getProjectList(fakeBackend.projectList.inputs.projectsRef)
			.then(function(data) { projectList = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(projectList.length).toEqual(fakeBackend.projectList.data.QueryResult.Results.length);
		expect(projectList[0]._ref).toEqual(fakeBackend.projectList.data.QueryResult.Results[0]._ref);
		expect(projectList[0].name).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Name);
		expect(projectList[0].iterationsRef).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Iterations._ref);
	});

	it('getIterationList prepares request correctly and extracts data correctly from the response.', function() {

		var iterationList;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getIterationList(fakeBackend.iterationList.inputs.iterationsRef)
			.then(function(data) { iterationList = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(iterationList.length).toEqual(fakeBackend.iterationList.data.QueryResult.Results.length);
		expect(iterationList[0]._ref).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0]._ref);
		expect(iterationList[0].name).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].Name);
		expect(iterationList[0].startDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].StartDate);
		expect(iterationList[0].endDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].EndDate);
	});

	it('getAllSubscriptionData traverses the promises correctly and aggregates data correctly', function() {

		var subscriptionData;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getAllSubscriptionData()
			.then(function(data) { subscriptionData = data; });

		$httpBackend.flush(); // simulate async http completing

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

	it('initSubscriptionData will return cached data.', function(){

 		mockWindow.localStorage['subscriptionData'] = JSON.stringify({
 			version: 3,
 			data: 'from cache'
 		});

 		var subscriptionData;
 		rallySvc.initSubscriptionData().then(function(data) {
 			subscriptionData = data;
 		});

 		$rootScope.$apply(); // cause $q promises to fulfill

 		expect(subscriptionData).toEqual('from cache');
 	})

	it('initSubscriptionData will fetch from service.', function() {

 		delete mockWindow.localStorage['subscriptionData']; // redundant, but... it's not cached.

		spyOn(rallySvc, '_getAllSubscriptionData').andReturn({
			then: function(thenCallback) {
				thenCallback('from service');
			}
		});

		var subscriptionData;
		rallySvc.initSubscriptionData().then(function(data){
			subscriptionData = data;
		})

		$rootScope.$apply(); // cause $q promises to fulfill

		expect(subscriptionData).toEqual('from service');
	});

	it('initSubscriptionData can be foreced to ignoreCache.', function() {

		mockWindow.localStorage['subscriptionData'] = JSON.stringify({
			version: 3,
			data: 'from cache'
		});

		spyOn(rallySvc, '_getAllSubscriptionData').andReturn({
			then: function(thenCallback) {
				thenCallback('from service');
			}
		});

		var subscriptionData;
		var ignoreCache = true;
		rallySvc.initSubscriptionData(ignoreCache).then(function(data){
			subscriptionData = data;
		})

		$rootScope.$apply(); // cause $q promises to fulfill

		expect(subscriptionData).toEqual('from service');
	});

	it('getTestSetList makes the request and handles the response correctly.', function() {

		var resultData;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc.getTestSetList(fakeBackend.testSetsList.inputs.workspaceRef, fakeBackend.testSetsList.inputs.iterationRef)
			.then(function(data) { resultData = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(resultData.iterationRef).toEqual(fakeBackend.testSetsList.inputs.iterationRef);
		expect(resultData.testSets[fakeBackend.testSetsList.data.QueryResult.Results[0]._ref]._ref).toEqual(fakeBackend.testSetsList.data.QueryResult.Results[0]._ref);
		expect(resultData.testSets[fakeBackend.testSetsList.data.QueryResult.Results[0]._ref].name).toEqual(fakeBackend.testSetsList.data.QueryResult.Results[0]._refObjectName);

	});

	it('getTestSetDetails makes the request and handles the response correctly', function() {

		var testSetDetails;
		var fakeBackend = window.fakeBackendFactory.create();
		fakeBackend.setup($httpBackend);

		rallySvc._getTestSetDetails(fakeBackend.testSetDetails.inputs.testSetRef)
			.then(function(data) { testSetDetails = data; });

		$httpBackend.flush(); // simulate async http completing

		expect(testSetDetails._ref).toEqual(fakeBackend.testSetDetails.data.TestSet._ref);
		expect(testSetDetails.name).toEqual(fakeBackend.testSetDetails.data.TestSet.Name);

		// The test cases will be minified
		expect(testSetDetails.testCases[0]._).toEqual(fakeBackend.testCaseList.data.QueryResult.Results[0]._ref);
		// TODO finish it
	});

});
