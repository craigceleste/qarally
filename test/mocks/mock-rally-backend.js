'use strict';

window.fakeBackendFactory = {
	create: function() {
		return {

			// How to maintain this test data.
			//		1. Walk the Rally tree in Chrome.
			//		2. Capture JSON from Chrome and paste it here. I use this Sublime plugin to format it: http://www.yellowduck.be/geek-stuff/2013/3/9/formatting-json-and-xml-with-sublime-text)
			//		3. Reduce collections to 1 sample object that has a full child hierarchy under it.
			//		4. Sanitize user data manually.

			// How to use it.
			//		1. Each unit test can use this factory to create a new instance of the fake data.
			//		2. Each test can then modify the data of their copy as needed: add extra elements to collections, change values to illegal ones, etc.
			//		3. Each test can modify the $httpBackend with additional .whenJSONP calls. Or use the default ones.
			//		4. Each test then compares the transformed results from code under test, with the values in the .data properties.

			subscription: {
				inputs: {
				    "subscriptionRef": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription"
				},
				data:{
				    "Subscription": {
				        "CreationDate": "2008-09-08T19:29:26.000Z", 
				        "Errors": [], 
				        "ExpirationDate": null, 
				        "MaximumCustomUserFields": -1, 
				        "MaximumProjects": -1, 
				        "Modules": "Sanitized", 
				        "Name": "My Subscription", 
				        "ObjectID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				        "PasswordExpirationDays": 90, 
				        "PreviousPasswordCount": 20, 
				        "ProjectHierarchyEnabled": true, 
				        "RevisionHistory": {
				            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/af6a8498-761e-4633-93be-f58b3aaa99a2", 
				            "_refObjectUUID": "af6a8498-761e-4633-93be-f58b3aaa99a2", 
				            "_type": "RevisionHistory"
				        }, 
				        "SessionTimeoutSeconds": null, 
				        "StoryHierarchyEnabled": true, 
				        "StoryHierarchyType": "Unlimited", 
				        "SubscriptionID": 123456, 
				        "SubscriptionType": "Unlimited", 
				        "Warnings": [], 
				        "Workspaces": {
				            "Count": 1, 
				            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces", 
				            "_type": "Workspace"
				        }, 
				        "_CreatedAt": "Sep 8, 2008", 
				        "_objectVersion": "30", 
				        "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				        "_refObjectName": "Sanitized", 
				        "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a"
				    }
				}
			},

			workspaceList: {
				inputs: {
				    "workspacesRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces"
				},
				data:{
				    "QueryResult": {
				        "Errors": [], 
				        "PageSize": 20, 
				        "Results": [
				            {
				                "CreationDate": "2010-04-26T18:48:55.028Z", 
				                "Description": "Sanitized", 
				                "Name": "My Workspace",
				                "Notes": "", 
				                "ObjectID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
				                "Owner": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/dc13cd21-159e-4ae2-a1c1-e9f6f0ae7f71", 
				                    "_refObjectName": "Sanitized", 
				                    "_refObjectUUID": "dc13cd21-159e-4ae2-a1c1-e9f6f0ae7f71", 
				                    "_type": "User"
				                }, 
				                "Projects": {
				                    "Count": 25, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects", 
				                    "_type": "Project"
				                }, 
				                "RevisionHistory": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/2f46e82f-068d-436e-84ef-157c66f92277", 
				                    "_refObjectUUID": "2f46e82f-068d-436e-84ef-157c66f92277", 
				                    "_type": "RevisionHistory"
				                }, 
				                "SchemaVersion": "bbdf771e37a872d819cf80aad37bf655", 
				                "State": "Open", 
				                "Style": "UserStory", 
				                "Subscription": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_refObjectName": "My Subscription", 
				                    "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_type": "Subscription"
				                }, 
				                "TypeDefinitions": {
				                    "Count": 66, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/TypeDefinitions", 
				                    "_type": "TypeDefinition"
				                }, 
				                "WorkspaceConfiguration": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspaceconfiguration/f7768dd4-f85a-468b-91bc-b1bc5f9db8fb", 
				                    "_refObjectUUID": "f7768dd4-f85a-468b-91bc-b1bc5f9db8fb", 
				                    "_type": "WorkspaceConfiguration"
				                }, 
				                "_CreatedAt": "Apr 26, 2010", 
				                "_objectVersion": "13", 
				                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
				                "_refObjectName": "My Workspace", 
				                "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
				                "_type": "Workspace"
				            }
				        ], 
				        "StartIndex": 1, 
				        "TotalResultCount": 1, 
				        "Warnings": []
				    }
				}
			},
            projectList: {
                inputs: {
				    "projectsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects"
				},
                data:{
				    "QueryResult": {
				        "Errors": [], 
				        "PageSize": 200, 
				        "Results": [
				            {
				                "BuildDefinitions": {
				                    "Count": 1, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/BuildDefinitions", 
				                    "_type": "BuildDefinition"
				                }, 
				                "Children": {
				                    "Count": 0, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Children", 
				                    "_type": "Project"
				                }, 
				                "CreationDate": "2010-04-26T19:17:32.100Z", 
				                "Description": "", 
				                "Editors": {
				                    "Count": 45, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Editors", 
				                    "_type": "User"
				                }, 
				                "Iterations": {
				                    "Count": 41, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations", 
				                    "_type": "Iteration"
				                }, 
				                "Name": "My Project", 
				                "Notes": "", 
				                "ObjectID": "d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
				                "Owner": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/dc13cd21-159e-4ae2-a1c1-e9f6f0ae7f71", 
				                    "_refObjectName": "MB", 
				                    "_refObjectUUID": "dc13cd21-159e-4ae2-a1c1-e9f6f0ae7f71", 
				                    "_type": "User"
				                }, 
				                "Parent": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/ef6de973-db78-49fe-a673-8db8bf9a5d73", 
				                    "_refObjectName": "Sanitized", 
				                    "_refObjectUUID": "ef6de973-db78-49fe-a673-8db8bf9a5d73", 
				                    "_type": "Project"
				                }, 
				                "Releases": {
				                    "Count": 18, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Releases", 
				                    "_type": "Release"
				                }, 
				                "SchemaVersion": "bbdf771e37a872d819cf80aad37bf655", 
				                "State": "Open", 
				                "Subscription": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_refObjectName": "My Subscription", 
				                    "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_type": "Subscription"
				                }, 
				                "TeamMembers": {
				                    "Count": 23, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/TeamMembers", 
				                    "_type": "User"
				                }, 
				                "Workspace": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
				                    "_refObjectName": "My Workspace", 
				                    "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
				                    "_type": "Workspace"
				                }, 
				                "_CreatedAt": "Apr 26, 2010", 
				                "_objectVersion": "16", 
				                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
				                "_refObjectName": "My Project", 
				                "_refObjectUUID": "d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
				                "_type": "Project"
				            }
				        ], 
				        "StartIndex": 1, 
				        "TotalResultCount": 1, 
				        "Warnings": []
				    }
				}               
            },
			iterationList: {
				inputs: {
			    	"iterationsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations"
				},
				data: {
				    "QueryResult": {
				        "Errors": [], 
				        "PageSize": 200, 
				        "Results": [
				            {
				                "CreationDate": "2013-12-06T17:30:15.082Z", 
				                "EndDate": "2014-02-01T04:59:59.000Z", 
				                "Name": "Sprint 84", 
				                "Notes": "", 
				                "ObjectID": "1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
				                "PlannedVelocity": 22.0, 
				                "Project": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
				                    "_refObjectName": "My Project", 
				                    "_refObjectUUID": "d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
				                    "_type": "Project"
				                }, 
				                "RevisionHistory": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/9221ea5c-5b51-4cc6-bb51-221d29b9d1ca", 
				                    "_refObjectUUID": "9221ea5c-5b51-4cc6-bb51-221d29b9d1ca", 
				                    "_type": "RevisionHistory"
				                }, 
				                "StartDate": "2014-01-06T05:00:00.000Z", 
				                "State": "Accepted", 
				                "Subscription": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_refObjectName": "My Subscription", 
				                    "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
				                    "_type": "Subscription"
				                }, 
				                "Theme": "Sanitized", 
				                "UserIterationCapacities": {
				                    "Count": 7, 
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5/UserIterationCapacities", 
				                    "_type": "UserIterationCapacity"
				                }, 
				                "Workspace": {
				                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
				                    "_refObjectName": "My Workspace", 
				                    "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
				                    "_type": "Workspace"
				                }, 
				                "_CreatedAt": "Dec 6, 2013", 
				                "_objectVersion": "15", 
				                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
				                "_refObjectName": "Sprint 84", 
				                "_refObjectUUID": "1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
				                "_type": "Iteration"
				            }
				        ], 
				        "StartIndex": 1, 
				        "TotalResultCount": 1, 
				        "Warnings": []
				    }
				}
			},

			setup: function($httpBackend) {

				// subscription
				$httpBackend
					.whenJSONP("https://rally1.rallydev.com/slm/webservice/v3.0/subscription?jsonp=JSON_CALLBACK")
					.respond(this.subscription.data);

				// workspaceList
				$httpBackend
					.whenJSONP("https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces?jsonp=JSON_CALLBACK&pagesize=200")
					.respond(this.workspaceList.data);

                // projectList
                $httpBackend
                    .whenJSONP("https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?jsonp=JSON_CALLBACK&pagesize=200")
                    .respond(this.projectList.data);

				// iterationList
				$httpBackend
					.whenJSONP("https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?jsonp=JSON_CALLBACK&pagesize=200")
					.respond(this.iterationList.data);

			}
		};
	}
};
