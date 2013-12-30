"use strict";

// A reusable $httpBackend to stand in for Rally.

// NOTE
//		This is an experiment!
//		I'm debating whether it's worth it to build a reusable backend for testing,
//		as compared to mocking each response one-off as needed.

// CONCERN
//		It concerns me that there are relationships:
//			service   ->  Rally
//			service  <->  Mock Rally
//			tests     ->  service
//			tests    <->  Mock Rally
//		But not
//			Mock Rally ?  Rally
//			tests      ?  Rally
//		If Rally changes their API (which they do from time to time),
//			a) the service->Rally relationship fails and the app fails in production
//			b) the service->MockRally relationship is fine and all unit tests continue to pass
//		I think I need something (e2e?) that
//			a) asserts my expectations about Rally (compares Mocks to Rally)
//			b) or generates/updates the mocks by making queries against Rally
//					if that was the case, I could also do a diff on the generated mock.

function setupRallyBackend($httpBackend) {

	// Technique for building this fake back end.
	//		- created a Community Edition Rally account.
	//		- set up some fake data in it.
	//		- navigate to GET request URLs in a browser
	//		- capture the JSON and paste put it here.
	// The community edition lacks features that our corporate subscription has.
	// Eventually I'm going to need to capture real corporate data and clean/sanitize it


	// The subscription request is the starting point.
	// In the real site you will be asked to authenticate and it returns info about your subscription.

	$httpBackend
		.whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/subscription?jsonp=JSON_CALLBACK')
		.respond({"Subscription": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362", "_objectVersion": "2", "_refObjectName": "Community (HS_1) Edition - Innosphere SDG - parchedsquid@gmail.com", "CreationDate": "2013-12-05T15:15:19.513Z", "_CreatedAt": "8 minutes ago", "ObjectID": 15647602362, "ExpirationDate": null, "MaximumCustomUserFields": 5, "MaximumProjects": 1, "Modules": "", "Name": "Community (HS_1) Edition - Innosphere SDG - parchedsquid@gmail.com", "PasswordExpirationDays": 0, "PreviousPasswordCount": 0, "ProjectHierarchyEnabled": false, "RevisionHistory": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/revisionhistory/15647602363", "_type": "RevisionHistory"}, "SessionTimeoutSeconds": null, "StoryHierarchyEnabled": true, "StoryHierarchyType": "Limited", "SubscriptionID": 49713, "SubscriptionType": "Community (HS_1)", "Workspaces": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces", "_type": "Workspace", "Count": 1}, "Errors": [], "Warnings": []}});

	// Workspaces list

	$httpBackend
		.whenJSONP('https://rally1.rallydev.com/slm/webservice/v2.0/Subscription/15647602362/Workspaces?jsonp=JSON_CALLBACK&pagesize=200')
		.respond({"QueryResult": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "Errors": [], "Warnings": [], "TotalResultCount": 1, "StartIndex": 1, "PageSize": 200, "Results": [{"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518", "_objectVersion": "1", "_refObjectName": "Workspace 1", "CreationDate": "2013-12-05T15:15:19.525Z", "_CreatedAt": "today at 8:15 am", "ObjectID": 15647602518, "Subscription": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362", "_refObjectName": "Community (HS_1) Edition - Innosphere SDG - parchedsquid@gmail.com", "_type": "Subscription"}, "Description": "", "Name": "Workspace 1", "Owner": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/user/15647602512", "_refObjectName": "parchedsquid", "_type": "User"}, "Projects": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0","_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects", "_type": "Project", "Count": 1},"RevisionHistory": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/revisionhistory/15647602519", "_type": "RevisionHistory"}, "SchemaVersion": "ca57f1d3a6e34fe5e581df2d5e397d57", "State": "Open", "Style": "UserStory", "TypeDefinitions": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/TypeDefinitions", "_type": "TypeDefinition", "Count": 50}, "WorkspaceConfiguration": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/workspaceconfiguration/15647602520", "_type": "WorkspaceConfiguration"}, "_type": "Workspace"}]}});

	// Projects for Workspace 1

	$httpBackend
		.whenJSONP('https://rally1.rallydev.com/slm/webservice/v2.0/Workspace/15647602518/Projects?jsonp=JSON_CALLBACK&pagesize=200')
		.respond({"QueryResult": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "Errors": [], "Warnings": [], "TotalResultCount": 1, "StartIndex": 1, "PageSize": 200, "Results": [{"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608", "_objectVersion": "1", "_refObjectName": "Sample Project", "CreationDate": "2013-12-05T15:15:19.528Z", "_CreatedAt": "today at 8:15 am", "ObjectID": 15647602608, "Subscription": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362", "_refObjectName": "Community (HS_1) Edition - Innosphere SDG - parchedsquid@gmail.com", "_type": "Subscription"}, "Workspace": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518", "_refObjectName": "Workspace 1", "_type": "Workspace"}, "BuildDefinitions": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/BuildDefinitions", "_type": "BuildDefinition", "Count": 1}, "Children": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Children", "_type": "Project", "Count": 0}, "Description": "", "Editors": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Editors", "_type": "User", "Count": 1}, "Iterations": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations", "_type": "Iteration", "Count": 1}, "Name": "Sample Project", "Owner": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/user/15647602512", "_refObjectName": "parchedsquid", "_type": "User"}, "Parent": null, "SchemaVersion": "ca57f1d3a6e34fe5e581df2d5e397d57", "State": "Open", "TeamMembers": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/TeamMembers", "_type": "User", "Count": 0}, "_type": "Project"}]}})

	$httpBackend
		.whenJSONP('https://rally1.rallydev.com/slm/webservice/v2.0/Project/15647602608/Iterations?jsonp=JSON_CALLBACK&pagesize=200')
		.respond({"QueryResult": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "Errors": [], "Warnings": [], "TotalResultCount": 1, "StartIndex": 1, "PageSize": 200, "Results": [{"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/iteration/15647935070", "_objectVersion": "4", "_refObjectName": "Sprint 1", "CreationDate": "2013-12-05T15:30:15.732Z", "_CreatedAt": "today at 8:30 am", "ObjectID": 15647935070, "Subscription": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/subscription/15647602362", "_refObjectName": "Community (HS_1) Edition - Innosphere SDG - parchedsquid@gmail.com", "_type": "Subscription"}, "Workspace": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/workspace/15647602518", "_refObjectName": "Workspace 1", "_type": "Workspace"}, "EndDate": "2013-12-23T06:59:59.000Z", "Name": "Sprint 1", "PlannedVelocity": null, "Project": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/project/15647602608", "_refObjectName": "Sample Project", "_type": "Project"}, "RevisionHistory": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/revisionhistory/15647935071", "_type": "RevisionHistory"}, "StartDate": "2013-12-16T07:00:00.000Z", "State": "Planning", "Theme": "", "UserIterationCapacities": {"_rallyAPIMajor": "2", "_rallyAPIMinor": "0", "_ref": "https://rally1.rallydev.com/slm/webservice/v2.0/Iteration/15647935070/UserIterationCapacities", "_type": "UserIterationCapacity", "Count": 0}, "_type": "Iteration"}]}});

}


