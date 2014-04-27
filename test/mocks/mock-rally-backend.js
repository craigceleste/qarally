'use strict';

window.fakeBackendFactory = {
  create: function() {
    return {

      // How to maintain this test data.
      //    1. Become comfortable walking the Rally data using Chrome.
      //      a. Start with this entry point URL: https://rally1.rallydev.com/slm/webservice/v3.0/subscription
      //      b. Copy the returned JSON to an editor. I use this Sublime plugin to format it: http://www.yellowduck.be/geek-stuff/2013/3/9/formatting-json-and-xml-with-sublime-text)
      //      c. Pull out the URL's to child elements from each package, to traverse downwards through the hierarchy.
      //    2. For each web service we use:
      //      a. capture the JSON as described above.
      //      b. paste it here.
      //      c. sanitize it: blank out any sensitive business data. GUID's are fine, I guess.
      //      d. reduce collections to one element; preferrably one that has a full hierarchy under it.
      //    3. Create a block in the form:
      //      serviceName: {
      //        inputs: { ...input values to the JS service function... },
      //        data: { ...the sanitized JSON returned from the server... }
      //      }
      //    4. Wire $httpBackend (Angular's mock $http)
      //      follow the pattern for the other ones.

      // How to use it.
      //    1. Each unit test can use this factory to create a new instance of the fake data.
      //        They can then modify their copy of the data as needed: expand collection counts, introduce corruptions, etc.
      //    2. Use the .data before requests to set up conditions
      //    3. Use the .data after requests to make assertions about how the data was parsed.

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
                  "Count": 1, 
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
                  "Count": 1, 
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
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Children", 
                  "_type": "Project"
                }, 
                "CreationDate": "2010-04-26T19:17:32.100Z", 
                "Description": "", 
                "Editors": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Editors", 
                  "_type": "User"
                }, 
                "Iterations": {
                  "Count": 1, 
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
                  "Count": 1, 
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
                  "Count": 1, 
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
                "Name": "My Iteration", 
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
                  "Count": 1, 
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

      testSetsList: {
        inputs: {
          "workspaceRef": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab",
          "iterationRef": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5"
        },
        data: {
          "QueryResult": {
            "Errors": [], 
            "PageSize": 200, 
            "Results": [
              {
                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
                "_refObjectName": "My Test Set", 
                "_refObjectUUID": "af931b07-a8d0-4157-87a3-9772e435a8da", 
                "_type": "TestSet"
              }
            ], 
            "StartIndex": 1, 
            "TotalResultCount": 1, 
            "Warnings": []
          }
        }        

      },
      
      testSetDetails: {
        inputs: {
          "testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da"
        },
        data: {
          "TestSet": {
            "Blocked": false, 
            "BlockedReason": null, 
            "Changesets": {
              "Count": 1, 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/Changesets", 
              "_type": "Changeset"
            }, 
            "CreationDate": "2014-01-07T17:01:14.021Z", 
            "Description": "", 
            "Discussion": {
              "Count": 1, 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/Discussion", 
              "_type": "ConversationPost"
            }, 
            "DisplayColor": null, 
            "DragAndDropRank": ",~|{\\!+I!+!5{5q]!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 
            "Errors": [], 
            "FormattedID": "TS965", 
            "Iteration": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
              "_refObjectName": "My Iteration", 
              "_refObjectUUID": "1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
              "_type": "Iteration"
            }, 
            "LastUpdateDate": "2014-01-21T14:34:20.477Z", 
            "LatestDiscussionAgeInMinutes": null, 
            "Name": "My Test Set", 
            "Notes": "", 
            "ObjectID": "af931b07-a8d0-4157-87a3-9772e435a8da", 
            "Owner": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/beb21e1f-8ee9-42c2-a977-87a6a7f4dfbe", 
              "_refObjectName": "Sanitized", 
              "_refObjectUUID": "beb21e1f-8ee9-42c2-a977-87a6a7f4dfbe", 
              "_type": "User"
            }, 
            "PlanEstimate": null, 
            "Project": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
              "_refObjectName": "My Project", 
              "_refObjectUUID": "d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
              "_type": "Project"
            }, 
            "Ready": false, 
            "Release": null, 
            "RevisionHistory": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/a0d4dc2d-d099-4749-b958-db460e040097", 
              "_refObjectUUID": "a0d4dc2d-d099-4749-b958-db460e040097", 
              "_type": "RevisionHistory"
            }, 
            "ScheduleState": "Accepted", 
            "Subscription": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
              "_refObjectName": "My Subscription", 
              "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
              "_type": "Subscription"
            }, 
            "Tags": {
              "Count": 1, 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/Tags", 
              "_tagsNameArray": [], 
              "_type": "Tag"
            }, 
            "TaskStatus": "NONE", 
            "Tasks": {
              "Count": 1, 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/Tasks", 
              "_type": "Task"
            }, 
            "TestCaseStatus": "ALL_RUN_ALL_PASSING", 
            "TestCases": {
              "Count": 1, 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/TestCases", 
              "_type": "TestCase"
            }, 
            "Warnings": [], 
            "Workspace": {
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
              "_refObjectName": "My Workspace", 
              "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
              "_type": "Workspace"
            }, 
            "_CreatedAt": "Jan 7", 
            "_objectVersion": "464", 
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
            "_refObjectName": "My Test Set", 
            "_refObjectUUID": "af931b07-a8d0-4157-87a3-9772e435a8da"
          }
        }
      },

      testCaseList: {
        inputs: {
          "testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da"
        },
        data: {
          "QueryResult": {
            "Errors": [], 
            "PageSize": 200, 
            "Results": [
              {
                "Attachments": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Attachments", 
                  "_type": "Attachment"
                }, 
                "Changesets": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Changesets", 
                  "_type": "Changeset"
                }, 
                "CreationDate": "2014-01-08T15:18:40.018Z", 
                "DefectStatus": "NONE", 
                "Description": "My Test Case Description", 
                "Discussion": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Discussion", 
                  "_type": "ConversationPost"
                }, 
                "DisplayColor": null, 
                "DragAndDropRank": ",~|v=!+I!+!5{5q]!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", 
                "FormattedID": "TC33319", 
                "LastBuild": "123.456.789.012", 
                "LastRun": "2014-01-08T20:11:38.439Z", 
                "LastUpdateDate": "2014-01-08T20:10:31.393Z", 
                "LastVerdict": "Pass", 
                "LatestDiscussionAgeInMinutes": null, 
                "Method": "Manual", 
                "Name": "My Test Case", 
                "Notes": "My Notes", 
                "ObjectID": "b92bef0f-3158-4148-bb09-94940d1dc2e9", 
                "Objective": "My Objective", 
                "Owner": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/ba5ee3cd-8160-44d1-b709-f4a05d25bda0", 
                  "_refObjectName": "Sanitized", 
                  "_refObjectUUID": "ba5ee3cd-8160-44d1-b709-f4a05d25bda0", 
                  "_type": "User"
                }, 
                "Package": null, 
                "PostConditions": "My PostConditions", 
                "PreConditions": "My PostConditions", 
                "Priority": "Critical", 
                "Project": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
                  "_refObjectName": "My Project", 
                  "_refObjectUUID": "d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
                  "_type": "Project"
                }, 
                "Ready": false, 
                "Recycled": false, 
                "Results": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Results", 
                  "_type": "TestCaseResult"
                }, 
                "RevisionHistory": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/revisionhistory/24f20cb7-9c31-456c-b139-428f456cae12", 
                  "_refObjectUUID": "24f20cb7-9c31-456c-b139-428f456cae12", 
                  "_type": "RevisionHistory"
                }, 
                "Risk": "Medium", 
                "Steps": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Steps", 
                  "_type": "TestCaseStep"
                }, 
                "Subscription": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
                  "_refObjectName": "My Subscription", 
                  "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
                  "_type": "Subscription"
                }, 
                "Tags": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCase/b92bef0f-3158-4148-bb09-94940d1dc2e9/Tags", 
                  "_tagsNameArray": [], 
                  "_type": "Tag"
                }, 
                "TestFolder": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04", 
                  "_refObjectName": "My Folder", 
                  "_refObjectUUID": "50ab57a5-905c-4b47-964f-6e2cafa4ff04", 
                  "_type": "TestFolder"
                }, 
                "Type": "Sanitized", 
                "ValidationExpectedResult": "My Expected Result", 
                "ValidationInput": "My Input", 
                "WorkProduct": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9", 
                  "_refObjectName": "My User Story", 
                  "_refObjectUUID": "3055bcc4-391c-4dea-a886-63a2b850bcd9", 
                  "_type": "HierarchicalRequirement"
                }, 
                "Workspace": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
                  "_refObjectName": "My Workspace", 
                  "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
                  "_type": "Workspace"
                }, 
                "_CreatedAt": "Jan 8", 
                "_objectVersion": "4", 
                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9", 
                "_refObjectName": "My Test Case", 
                "_refObjectUUID": "b92bef0f-3158-4148-bb09-94940d1dc2e9", 
                "_type": "TestCase", 
                "c_Category": null, 
                "c_Inputs": "", 
                "c_ItestcaseTemplateId": "", 
                "c_NewDesign": null, 
                "c_ProgramArea": null, 
                "c_Section": "Sanitized", 
                "c_SubProgramArea": null, 
                "c_TimeToConduct": null, 
                "c_Weight": null, 
                "c_obsoleteCategory": "", 
                "c_obsoleteCategory2": null, 
                "c_obsoleteProgramArea": "", 
                "c_oldProgramArea": null
              }
            ], 
            "StartIndex": 1, 
            "TotalResultCount": 1,
            "Warnings": []
          }
        }
      },

      testCasesByTestSet: {
        inputs: {
          "testSetRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da"
        },
        data: {
          "QueryResult": {
            "Errors": [], 
            "PageSize": 200, 
            "Results": [
              {
                "Attachments": {
                  "Count": 1, 
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult/47a0eb6c-ed71-4224-8c52-1638cf5d1b57/Attachments", 
                  "_type": "Attachment"
                }, 
                "Build": "0.1.0.1", 
                "CreationDate": "2014-01-08T20:10:31.089Z", 
                "Date": "2014-01-08T20:11:38.439Z", 
                "Duration": null, 
                "Notes": "", 
                "ObjectID": "47a0eb6c-ed71-4224-8c52-1638cf5d1b57", 
                "Subscription": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
                  "_refObjectName": "My Subscription", 
                  "_refObjectUUID": "595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
                  "_type": "Subscription"
                }, 
                "TestCase": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9", 
                  "_refObjectName": "My Test Case", 
                  "_refObjectUUID": "b92bef0f-3158-4148-bb09-94940d1dc2e9", 
                  "_type": "TestCase"
                }, 
                "TestSet": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
                  "_refObjectName": "My Test Set", 
                  "_refObjectUUID": "af931b07-a8d0-4157-87a3-9772e435a8da", 
                  "_type": "TestSet"
                }, 
                "Tester": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/user/82718140-782c-4d22-8fa8-3540f2161e9a", 
                  "_refObjectName": "User1", 
                  "_refObjectUUID": "82718140-782c-4d22-8fa8-3540f2161e9a", 
                  "_type": "User"
                }, 
                "Verdict": "Pass", 
                "Workspace": {
                  "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
                  "_refObjectName": "My Workspace", 
                  "_refObjectUUID": "286f4675-fc38-4a87-89b9-eec25d199cab", 
                  "_type": "Workspace"
                }, 
                "_CreatedAt": "Jan 8", 
                "_objectVersion": "1", 
                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcaseresult/47a0eb6c-ed71-4224-8c52-1638cf5d1b57", 
                "_refObjectUUID": "47a0eb6c-ed71-4224-8c52-1638cf5d1b57", 
                "_type": "TestCaseResult"
              }, 
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
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/subscription?jsonp=JSON_CALLBACK')
          .respond(this.subscription.data);

        // workspaceList
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces?jsonp=JSON_CALLBACK&pagesize=200')
          .respond(this.workspaceList.data);

        // projectList
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects?jsonp=JSON_CALLBACK&pagesize=200')
          .respond(this.projectList.data);

        // iterationList
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations?jsonp=JSON_CALLBACK&pagesize=200')
          .respond(this.iterationList.data);

        // testSetsList
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/testset?jsonp=JSON_CALLBACK&workspace=https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fworkspace%2F286f4675-fc38-4a87-89b9-eec25d199cab&query=(Iteration%20%3D%20%22https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Fiteration%2F1becc454-eca1-4b00-ae02-fcdf8cade4d5%22)&pagesize=200')
          .respond(this.testSetsList.data)

        // testSetDetails
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da?jsonp=JSON_CALLBACK')
          .respond(this.testSetDetails.data)

        // testCaseList
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/TestSet/af931b07-a8d0-4157-87a3-9772e435a8da/TestCases?jsonp=JSON_CALLBACK&pagesize=200&start=1')
          .respond(this.testCaseList.data)

        // testCasesByTestSet
        $httpBackend
          .whenJSONP('https://rally1.rallydev.com/slm/webservice/v3.0/TestCaseResult?jsonp=JSON_CALLBACK&query=(TestSet%20%3D%20https%3A%2F%2Frally1.rallydev.com%2Fslm%2Fwebservice%2Fv3.0%2Ftestset%2Faf931b07-a8d0-4157-87a3-9772e435a8da)&pagesize=200&start=1&fetch=true')
          .respond(this.testCasesByTestSet.data)

      }
    };
  }
};
