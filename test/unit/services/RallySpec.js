'use strict';

describe('Rally', function() {

	var rally;
	var mockWindow, $rootScope, $httpBackend;

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
			setupRallyBackend($httpBackend);
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

		rally.getSubscriptionData().then(function(subscriptionData) {

			expect(subscriptionData._ref).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362');
			expect(subscriptionData.workspacesRef).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces');

		});

		$httpBackend.flush();
	});

	it('getWorkspaceList prepares request correctly and extracts data correctly from the response.', function() {

		rally.getWorkspaceList('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces').then(function(workspaceList) {

			expect(workspaceList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518',
				name: 'Workspace 1',
				projectsRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects'
			}]);

		});

		$httpBackend.flush();
	});

	it('getProjectList prepares request correctly and extracts data correctly from the response.', function() {

		rally.getProjectList('https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects').then(function(projectList) {

			expect(projectList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608',
				name: 'Sample Project',
				iterationsRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations'
				}]);

		});

		$httpBackend.flush();
	});

	it('getIterationList prepares request correctly and extracts data correctly from the response.', function() {

		rally.getIterationList('https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations').then(function(iterationList) {

			expect(iterationList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070',
				name: 'Sprint 1',
				startDate: '2013-12-16T07:00:00.000Z',
				endDate: '2013-12-23T06:59:59.000Z'
				}]);

		});

		$httpBackend.flush();
	});

	it('getAllSubscriptionData traverses the promises correctly and aggregates data correctly', function() {

		rally.getAllSubscriptionData().then(function(subscriptionData) {

			expect(subscriptionData._ref).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362');
			expect(subscriptionData.workspacesRef).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces');

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
