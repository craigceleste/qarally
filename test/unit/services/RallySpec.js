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

	it('transformTestCaseFromRallyToStorage', function() {

		// Test Set as it's returned from Rally
		var rallyTestSetJson = '{"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_objectVersion": "256", "_refObjectName": "Duplicate Filter from Filter List Menu", "CreationDate": "2011-03-04T19:30:45.855Z", "_CreatedAt": "Mar 4, 2011", "ObjectID": "11112222-3333-4444-5555-666677778888", "Subscription": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "MyCo", "_type": "Subscription"}, "Workspace": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "MyCo Software", "_type": "Workspace"}, "Changesets": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Changesets", "_type": "Changeset", "Count": 0}, "Description": "To duplicate a random filter from the filter list menu", "Discussion": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Discussion", "_type": "ConversationPost", "Count": 0}, "DisplayColor": null, "FormattedID": "TC2046", "LastUpdateDate": "2014-01-20T15:07:14.159Z", "LatestDiscussionAgeInMinutes": null, "Name": "Duplicate Filter from Filter List Menu", "Notes": "", "Owner": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "John Q", "_type": "User"}, "Project": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "MyWeb", "_type": "Project"}, "Ready": false, "RevisionHistory": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_type": "RevisionHistory"}, "Tags": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Tags", "_type": "Tag", "_tagsNameArray": [], "Count": 0}, "Attachments": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Attachments", "_type": "Attachment", "Count": 0}, "DefectStatus": "NONE", "DragAndDropRank": "-!!!!!5{q5qq!]I]!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", "LastBuild": "MainLine.2342", "LastRun": "2014-01-13T16:39:00.176Z", "LastVerdict": "Pass", "Method": "Manual", "Objective": "", "Package": null, "PostConditions": "", "PreConditions": "1) Random company created and opened<BR>2) Random queries created", "Priority": "Important", "Recycled": false, "Results": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Results", "_type": "TestCaseResult", "Count": 95}, "Risk": "Low", "Steps": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/11112222-3333-4444-5555-666677778888/Steps", "_type": "TestCaseStep", "Count": 0}, "TestFolder": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "Filters", "_type": "TestFolder"}, "Type": "Smoke", "ValidationExpectedResult": "Filter is duplicated and appears in the Filter List", "ValidationInput": "1) Open the Filters List by clicking the \'Setup\' Link on the company toolbar, then the Filters Submenu<BR>2) Highlight a random filter<BR>3) Click \'Duplicate\' link on the Filter list menu", "WorkProduct": {"_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/11112222-3333-4444-5555-666677778888", "_refObjectUUID": "11112222-3333-4444-5555-666677778888", "_refObjectName": "WP1", "_type": "WorkProduct"}, "c_Category": null, "c_Inputs": "", "c_ItestcaseTemplateId": "552", "c_NewDesign": false, "c_obsoleteCategory": "", "c_obsoleteCategory2": null, "c_obsoleteProgramArea": "", "c_oldProgramArea": null, "c_ProgramArea": null, "c_Section": null, "c_SubProgramArea": "Duplicate  Filter", "c_TimeToConduct": 1, "c_Weight": 60, "_type": "TestCase"}';
		var rallyTestSet = JSON.parse(rallyTestSetJson);

		var toStorage = rally.transformTestCaseFromRallyToStorage(rallyTestSet);
		var toStorageJson = JSON.stringify(toStorage);

		expect(toStorageJson.length).toBeGreaterThan(0);
		expect(toStorageJson.length).toBeLessThan(rallyTestSetJson.length);

		var toWorking = rally.transformTestCaseFromStorageToWorking(toStorage);

		expect(toWorking._ref).toEqual(toStorage._ref)

		expect(toWorking.Description).toEqual(rallyTestSet.Description)
		expect(toWorking.Name).toEqual(rallyTestSet.Name)
		expect(toWorking.Notes).toEqual(rallyTestSet.Notes)
		expect(toWorking.ObjectId).toEqual(rallyTestSet.ObjectId)
		expect(toWorking.Objective).toEqual(rallyTestSet.Objective)
		expect(toWorking.PostConditions).toEqual(rallyTestSet.PostConditions)
		expect(toWorking.PreConditions).toEqual(rallyTestSet.PreConditions)
		expect(toWorking.Type).toEqual(rallyTestSet.Type)
		expect(toWorking.ValidationExpectedResult).toEqual(rallyTestSet.ValidationExpectedResult)
		expect(toWorking.ValidationInput).toEqual(rallyTestSet.ValidationInput)

		expect(toWorking.TestFolderRef).toEqual(rallyTestSet.TestFolder._ref)
		expect(toWorking.WorkProductRef).toEqual(rallyTestSet.WorkProduct._ref)

	});
});
