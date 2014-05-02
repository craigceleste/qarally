'use strict';

// Fake Responses from Rally Service.

// Used as expected results for testing Rally Service.

// Used as inputs for testing consumers of Rally Service (Rally Service consumes some of it's own methods, so it is used there too.)

// The data lines up with window.rallyHttpMocks

// Goals of using fakes for both inputs and outputs:
//    1. If Rally service changes, the new output will not match these expected results, forcing you to update them.
//    2. Fixing these to cause Rally Service tests to pass will cause consumer tests to break, forcing you to fix the consumer code and tests.
// I want to avoid the case where you change code and no tests fail because old code is using old mocks and nobody knows until runtime.

// How to maintain it easily:
//    1. Write a happy-path test
//      a. create fake input for the method (probably in rally-http-fakes.js), captured from Rally's web service.
//      b. write a unit test that calls your method with that fake input (no expectations or fleshed out testing yet)
//      c. capture the output of your method and paste it into a fake here.
//      d. add to your test: expect(actualResult).toEqual(thisFake);
//    2. Write exceptional cases
//      a. modify the fake inputs to your method (from rally-http-fakes.js)
//      b. modify the fake output from here to be the new expected result.
//      c. expect(actualResult).toEqual(thisFake)
//    3. Use the fake as input into a consumer of your method.

window.rallyServiceFakes = {
  create: function() {
    return {

      getSubscriptionData: {
        "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a",
        "workspacesRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces"
      },

      getWorkspaceList: [
        {
          "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab",
          "name": "My Workspace",
          "projectsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects"
        }
      ],

      getProjectList: [
        {
          "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c",
          "name": "My Project",
          "iterationsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations"
        }
      ],

      getIterationList: [
        {
          "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5",
          "name": "My Iteration",
          "startDate": "2014-01-06T05:00:00.000Z",
          "endDate": "2014-02-01T04:59:59.000Z"
        }
      ],

      getAllSubscriptionData: {
        "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a", 
        "workspaces": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab": {
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/286f4675-fc38-4a87-89b9-eec25d199cab", 
            "name": "My Workspace", 
            "projects": {
              "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c": {
                "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/project/d0e34bc7-55c0-4757-857d-6be2604a6c6c", 
                "iterations": {
                  "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5": {
                    "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
                    "endDate": "2014-02-01T04:59:59.000Z", 
                    "name": "My Iteration", 
                    "startDate": "2014-01-06T05:00:00.000Z"
                  }
                }, 
                "iterationsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Project/d0e34bc7-55c0-4757-857d-6be2604a6c6c/Iterations", 
                "name": "My Project"
              }
            }, 
            "projectsRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Workspace/286f4675-fc38-4a87-89b9-eec25d199cab/Projects"
          }
        }, 
        "workspacesRef": "https://rally1.rallydev.com/slm/webservice/v3.0/Subscription/595548e8-ec1c-4d82-9954-38a0e1fcd05a/Workspaces"
      },

      getTestSetList: {
        "iterationRef": "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/1becc454-eca1-4b00-ae02-fcdf8cade4d5", 
        "testSets": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da": {
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testset/af931b07-a8d0-4157-87a3-9772e435a8da", 
            "name": "My Test Set"
          }
        }
      },

      initTestSetDetails: {
        "testCases": [
          {
            "Description": "My Test Case Description", 
            "FormattedID": "TC33319", 
            "Name": "My Test Case", 
            "Notes": "My Notes", 
            "Objective": "My Objective", 
            "PostConditions": "My PostConditions", 
            "PreConditions": "My PostConditions", 
            "TestFolderRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04", 
            "Type": "Sanitized", 
            "ValidationExpectedResult": "My Expected Result", 
            "ValidationInput": "My Input", 
            "WorkProductRef": "https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9", 
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9"
          }
        ], 
        "testFolders": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04": {
            "FormattedID": "TF1234", 
            "Name": "My Folder", 
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testfolder/50ab57a5-905c-4b47-964f-6e2cafa4ff04"
          }
        }, 
        "workProducts": {
          "https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9": {
            "FormattedID": "US1234", 
            "Name": "My User Story", 
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/hierarchicalrequirement/3055bcc4-391c-4dea-a886-63a2b850bcd9"
          }
        }
      },

      getTestCaseResultsForTestSet: {
        "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9": {
          "all": [
            {
              "Build": "0.1.0.1", 
              "CreationDate": new Date("2014-01-08T20:10:31.089Z"),
              "Notes": "", 
              "TestCaseRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9", 
              "TesterName": "User1", 
              "Verdict": "Pass", 
              "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcaseresult/47a0eb6c-ed71-4224-8c52-1638cf5d1b57"
            }
          ], 
          "mostRecent": {
            "Build": "0.1.0.1", 
            "CreationDate": new Date("2014-01-08T20:10:31.089Z"), 
            "Notes": "", 
            "TestCaseRef": "https://rally1.rallydev.com/slm/webservice/v3.0/testcase/b92bef0f-3158-4148-bb09-94940d1dc2e9", 
            "TesterName": "User1", 
            "Verdict": "Pass", 
            "_ref": "https://rally1.rallydev.com/slm/webservice/v3.0/testcaseresult/47a0eb6c-ed71-4224-8c52-1638cf5d1b57"
          }
        }
      },


    };
  }
};
