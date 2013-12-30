'use strict';

describe('Rally', function() {

	var rally;
	var mockStore, $httpBackend;

	// Prepare service under tests with appropriate mock inejections.

	beforeEach(function(){

		module('qa-rally')

		// Provide mocks that we create

		mockStore = { get: function() {} };

		module(function($provide){
			$provide.value('Store', mockStore);
		});

		// Get ahold of mocks that angular-mocks created

		inject(function($injector){
			$httpBackend = $injector.get('$httpBackend');
			setupRallyBackend($httpBackend);
		});

		// Get the object under test

		inject(function(Rally){
			rally = Rally;
		});
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('$getSubscriptionData prepares request correctly and extracts data correctly from the response.', function() {

		rally.$getSubscriptionData().then(function(subscriptionData) {

			expect(subscriptionData._ref).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362');
			expect(subscriptionData.workspacesRef).toEqual('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces');

		});

		$httpBackend.flush();
	});

	it('$getWorkspaceList prepares request correctly and extracts data correctly from the response.', function() {

		rally.$getWorkspaceList('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces').then(function(workspaceList) {

			expect(workspaceList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518',
				name: 'Workspace 1',
				projectsRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects'
			}]);

		});

		$httpBackend.flush();
	});

	it('$getProjectList prepares request correctly and extracts data correctly from the response.', function() {

		rally.$getProjectList('https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects').then(function(projectList) {

			expect(projectList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608',
				name: 'Sample Project',
				iterationsRef: 'https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations'
				}]);

		});

		$httpBackend.flush();
	});

	it('$getIterationList prepares request correctly and extracts data correctly from the response.', function() {

		rally.$getIterationList('https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations').then(function(iterationList) {

			expect(iterationList).toEqual([{
				_ref: 'https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070',
				name: 'Sprint 1',
				startDate: '2013-12-16T07:00:00.000Z',
				endDate: '2013-12-23T06:59:59.000Z'
				}]);

		});

		$httpBackend.flush();
	});

	it('$getAllSubscriptionData traverses the promises correctly and aggregates data correctly', function() {

		rally.$getAllSubscriptionData().then(function(subscriptionData) {

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

	it('initSubscriptionData(happy path) will get from store', function() {

		mockStore.get = function(options) {

			// initSubscriptionData should pass the right options to .get()
			expect(options.ignoreStore).toBeUndefined();
			expect(options.key).toEqual('subscriptionData');
			expect(options.fetch).toBeDefined();
			expect(options.upgrade).toBeDefined();

			return 'from store get';
		};

		var actual = rally.initSubscriptionData();

		expect(actual).toEqual('from store get');
	});

	// I am playing with upgrade strategy.
	it('initSubscriptionData will provide an upgrade path for a store containing version 1.', function() {

		mockStore.get = function(options) {

			// If store calls it's upgrade function it should work.
			return options.upgrade(
				1, 					// stored version
				{test:'version1'}	// stored data
			);
		};

		var actual = rally.initSubscriptionData();

		expect(actual).toEqual({
			test:'version1',
			test1:'1 to 2',
			test2:'2 to 3'
		});
	});

	// I am playing with upgrade strategy.
	it('initSubscriptionData will provide an upgrade path for a store containing version 2.', function() {

		mockStore.get = function(options) {

			// If store calls it's upgrade function it should work.
			return options.upgrade(
				2, 					// stored version
				{test:'version2'}	// stored data
			);
		};

		var actual = rally.initSubscriptionData();

		expect(actual).toEqual({
			test:'version2',
		//	test1:'1 to 2', <-- not here
			test2:'2 to 3'
		});
	});

	// I am playing with upgrade strategy.
	it('initSubscriptionData will throw if asked to upgrade an unrecognized version.', function() {

		mockStore.get = function(options) {

			expect(function() {

				// Their upgrade callback should throw if given an unrecognized version
				options.upgrade(
					-1, // bad version
					{}	// stored data
				);
			}).toThrow();
		};

		rally.initSubscriptionData();
	});

});
