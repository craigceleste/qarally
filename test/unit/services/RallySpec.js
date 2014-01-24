'use strict';

describe('Rally', function() {

	var rally;
	var mockWindow, $rootScope, $httpBackend;
	var fakeBackend = window.fakeBackend; // TODO find a better way to inject it

	beforeEach(function(){

		module('qa-rally')

		mockWindow = {
			localStorage: {}
		};

		module(function($provide){
			$provide.value('$window', mockWindow);
		});

		inject(function(_$rootScope_, $injector){
			$rootScope = _$rootScope_;
			$httpBackend = $injector.get('$httpBackend');
			fakeBackend.setup($httpBackend);
		});

		inject(function(Rally){
			rally = Rally;
		});
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('getSubscriptionData prepares request correctly and extracts data correctly from the response.', function() {

		var thenCalled = false;
		
		rally
			.getSubscriptionData()
			.then(function(subscriptionData) {

				thenCalled = true;
				expect(subscriptionData._ref).toEqual(fakeBackend.subscription.data.Subscription._ref);
				expect(subscriptionData.workspacesRef).toEqual(fakeBackend.subscription.data.Subscription.Workspaces._ref);

			});

		$httpBackend.flush();
		expect(thenCalled).toBe(true);
	});

	it('getWorkspaceList prepares request correctly and extracts data correctly from the response.', function() {

		var thenCalled = false;

		rally
			.getWorkspaceList(fakeBackend.workspaceList.inputs.workspacesRef)
			.then(function(workspaceList) {

				thenCalled = true;
				expect(workspaceList.length).toEqual(fakeBackend.workspaceList.data.QueryResult.Results.length)
				expect(workspaceList[0]._ref).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0]._ref);
				expect(workspaceList[0].name).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Name);
				expect(workspaceList[0].projectsRef).toEqual(fakeBackend.workspaceList.data.QueryResult.Results[0].Projects._ref);
			});

		$httpBackend.flush();
		expect(thenCalled).toBe(true);
	});

	it('getProjectList prepares request correctly and extracts data correctly from the response.', function() {

		var thenCalled = false;
		rally
			.getProjectList(fakeBackend.projectList.inputs.projectsRef)
			.then(function(projectList) {

				thenCalled = true;
				expect(projectList.length).toEqual(fakeBackend.projectList.data.QueryResult.Results.length);
				expect(projectList[0]._ref).toEqual(fakeBackend.projectList.data.QueryResult.Results[0]._ref);
				expect(projectList[0].name).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Name);
				expect(projectList[0].iterationsRef).toEqual(fakeBackend.projectList.data.QueryResult.Results[0].Iterations._ref);
			});

		$httpBackend.flush();
		expect(thenCalled).toBe(true);
	});

	it('getIterationList prepares request correctly and extracts data correctly from the response.', function() {

		var thenCalled = false;
		rally
			.getIterationList(fakeBackend.iterationList.inputs.iterationsRef)
			.then(function(iterationList) {

				thenCalled = true;
				expect(iterationList.length).toEqual(fakeBackend.iterationList.data.QueryResult.Results.length);
				expect(iterationList[0]._ref).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0]._ref);
				expect(iterationList[0].name).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].Name);
				expect(iterationList[0].startDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].StartDate);
				expect(iterationList[0].endDate).toEqual(fakeBackend.iterationList.data.QueryResult.Results[0].EndDate);
			});

		$httpBackend.flush();
		expect(thenCalled).toBe(true);
	});

	it('getAllSubscriptionData traverses the promises correctly and aggregates data correctly', function() {

		var thenCalled = false;
		rally
			.getAllSubscriptionData()
			.then(function(subscriptionData) {

				thenCalled = true;
				expect(subscriptionData._ref).toEqual(fakeBackend.subscription.data.Subscription._ref);
				expect(subscriptionData.workspacesRef).toEqual(fakeBackend.subscription.data.Subscription.Workspaces._ref);
				var workspaceRef = 'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518';
				expect(subscriptionData.workspaces[workspaceRef]._ref).toEqual(workspaceRef);
				expect(subscriptionData.workspaces[workspaceRef].name).toEqual('Workspace 1');
				expect(subscriptionData.workspaces[workspaceRef].projectsRef).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects');

				var projectRef = 'https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608';
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef]._ref).toEqual(projectRef);
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].name).toEqual('Sample Project');
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterationsRef).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations');

				var iterationRef = 'https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070';
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef]._ref).toEqual(iterationRef);
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].name).toEqual('Sprint 1');
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].startDate).toEqual('2013-12-16T07:00:00.000Z');
				expect(subscriptionData.workspaces[workspaceRef].projects[projectRef].iterations[iterationRef].endDate).toEqual('2013-12-23T06:59:59.000Z');
			});

		$httpBackend.flush();
		expect(thenCalled).toBe(true);
	});

	it('initSubscriptionData will return a cached version.', function() {

		mockWindow.localStorage['subscriptionData'] = JSON.stringify({
			version: 3,
			data: 'from cache'
		});

		var subscriptionData;
		rally.initSubscriptionData().then(function(data){
			subscriptionData = data;
		})

		$rootScope.$apply();
		expect(subscriptionData).toEqual('from cache');
	});

	it('initSubscriptionData will get from service and cache it.', function() {

		spyOn(rally, 'getAllSubscriptionData').andReturn({
			then: function(thenCallback) {
				thenCallback('from service');
			}
		});

		var subscriptionData;
		rally.initSubscriptionData().then(function(data){
			subscriptionData = data;
		})

		$rootScope.$apply();
		expect(subscriptionData).toEqual('from service');
	});

	it('initSubscriptionData will get from service if ignoreCache is set.', function() {

		mockWindow.localStorage['subscriptionData'] = JSON.stringify({
			version: 3,
			data: 'from cache'
		});

		spyOn(rally, 'getAllSubscriptionData').andReturn({
			then: function(thenCallback) {
				thenCallback('from service');
			}
		});

		var subscriptionData;
		rally.initSubscriptionData(true).then(function(data){ // <-- true == ignoreCache
			subscriptionData = data;
		})

		$rootScope.$apply();
		expect(subscriptionData).toEqual('from service');
	});

});
