qarally
=======

My first AngularJS app.

This is an internal tool for QA staff to perform test cases using Rally (rallydev.com). Rally is very good for product owners and developers. The UX for QA Testers to perform tests is burdensome. A test that takes 30 seconds to perform often takes 90 seconds to negotiate Rally's UX. This "quick and dirty" internal tool is meant to make their efforts faster. For me, a quick and dirty internal tool is an ideal place to give a new technology a shot.

** It is probably over engineered! I don't spend a lot of time on heavy client-side apps and I'm kind of stepping past the boundaries of too much to figure out where the line is.

Dev Setup
---------
This app is likely to be maintained by devs familiar with light-client ASP.NET MVC, who may not have the tooling to work on it out of the box.

TODO: add concise instructions for setting up an environment.

    1 Mac OS - but theoretically should run on windows
    1 Sublime - http://www.sublimetext.com (or text editor of choice)
    1 Git
    1 Pow - http://pow.cx (may or may not have a Windows equivalent)
    1 Node.js - http://nodejs.org
    1 Karma - http://karma-runner.github.io/0.12/index.html
    1 Jasmine - https://github.com/karma-runner/karma-jasmine

LocalStorage
------------
window.localStorage will be used to cache rally data (and some easily recoverable user data) for faster day-to-day work.

**Subscription Data**: recurse through all Workspaces, Projects and Iterations and cache them.

They change seldomly on the scale of a tester griding through a bunch of tests. They can hit Refresh when a new iteration starts.

This is purely a cache. It can be recovered from Rally at any time.

    ['SubscriptionData'] = {

      // Versioning scheme since localStorage will persist across software updates
      "v":3,
      "d":{

        // Subscription info: not much
        "_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/subscription/365548e8-ec1c-4d82-9954-38a0e1fcd05a",

        // List of workspaces. Expect 1 or 2.
        "workspaces":{

          // Keyed on _ref and _ref is duplicated in the object. If storage becomes seriously limited, this could be simplified

          "https://rally1.rallydev.com/slm/webservice/v3.0/workspace/A155e1f8-3e96-471f-ac5a-a72a7825bb9d":{
            "_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/workspace/A155e1f8-3e96-471f-ac5a-a72a7825bb9d",
            "name":"Sandbox",

            // List of projects per workspace
            "projects":{
              "https://rally1.rallydev.com/slm/webservice/v3.0/project/06c8e783-aa04-4168-a206-f3f842a1a163":{
                "_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/project/06c8e783-aa04-4168-a206-f3f842a1a163",
                "name":"My Web App",

                // List of iterations per project
                "iterations":{
                  "https://rally1.rallydev.com/slm/webservice/v3.0/iteration/15a0b8cb-2f31-4b39-882f-961f223b5029":{
                    "_ref":"https://rally1.rallydev.com/slm/webservice/v3.0/iteration/15a0b8cb-2f31-4b39-882f-961f223b5029",
                    "name":"Sprint 1",
                    "startDate":"2011-01-01T05:00:00.000Z",
                    "endDate":"2011-02-01T04:59:59.000Z"
                  }
                }
              }
            }
          }
        }
      }
    };

**WPI List**: A "WPI" is a named combination of Workspace + Project + Iteration. Many QA Testers switch between a very small list of projects (2 or 3) and this navigation may be a pain (maybe it's not) but here we allow the testers to define a WPI that is stored to window.localStorage. If it's deleted, it's not a big deal. It's just their iteration choice.

    ["wpiList"] = {

      // Versioning scheme since localStorage will persist across software updates
      "v":2,
      "d":{

        // A list of WPI's and the currently focused one.
        current: "0.045425733318552375",
        list: {
          // An arbitrary unique ID for each one. It's just a Math.random() number :/ I don't want to pretend to be clever with the creation of unique id's
          "0.045425733318552375":{
            "id":"0.045425733318552375",

            // A label entered by the user
            "label":"Web Sprint 1",

            // Their choice of Workspace + Project + Iteration is selected from the Subscription Data when they create the WPI.
            "workspaceRef":"https://rally1.rallydev.com/slm/webservice/v3.0/workspace/A155e1f8-3e96-471f-ac5a-a72a7825bb9d",
            "projectRef":"https://rally1.rallydev.com/slm/webservice/v3.0/project/06c8e783-aa04-4168-a206-f3f842a1a163",
            "iterationRef":"https://rally1.rallydev.com/slm/webservice/v3.0/iteration/15a0b8cb-2f31-4b39-882f-961f223b5029",

            // Build Number is entered through the UI. This probably changes fairly often (few times a day, maybe?) Whenever they choose to deploy a build, I guess.
            "buildNumber": "MainLine.123",

            // The list of Test Sets for an Iteration is loaded and cached separately from Subscription Data.
            // They choose this after creating the WPI
            "testSetRef":"https://rally1.rallydev.com/...some.id...",

            // The list of test sets should logically be part of cached SubscriptionData under each iteration
            // but that causes SubscriptionData to grow too much (localStorage is 5MB and with test sets subscription data comes to about 1MB.)
            // Instead only store the testSets per WPI (per iteration in the wpiList)
            "testSets": {
              "https://rally1.rallydev.com/...some.id...": {
                "_ref":"https://rally1.rallydev.com/...some.id...",
                "name":"New Functional Tests",

                // Each test case reference 0..1 work product (user story or defect) and 1 test folder (and are M:N'd into test sets)
                // The list of test cases therefore produces a list of stories and folders that the user can use for filtering.
                // Persist the filtered items per test set in the wpiList.
                workProductFilters: [
                  "...some id...",
                  "...some id..."
                ],
                testFolderFilters: [
                  "...some id...",
                  "...some id..."
                ]
              },
            },

            // Shouldn't be here: It got serialized by mistake since I $watch it. Fix that.
            "$$hashKey":"007"
          }
        }
      }
    }

**Test Set**: We will store several test sets in localStorage. It consumes too much of localStorage (which has a 5MB limit) to cache all test sets for all iterations (as we do with subscription data)

Load test sets for the iterations selected in the WPI and store the most recently used few, limited by size (4MB or so).

   ['TestSet_' + testSetRef] = {

      // Versioning scheme since localStorage will persist across software updates
      "v":3,
      "d":{

        // Some superficial info
        "_ref":"https://rally1.rallydev.com/...some.id...",
        "name":"New Functional Tests",

        // List of all test cases: this is expected to be the meat of local storage.
        // The whole app revolves around a) a promise and b) historical data that indicates that test sets contain between 100 and 500 tests with the max ever having about 1050.
        // Serialized into localStorage, the test set needs to be ideally 0.5 to 1 MB and at max about 4 MB.
        // If a team has 3000 or more tests, or huge amounts of text in all test cases, this is not the tool for them.
        testCases:[
          {...},
          {...},
          {...}
        ]
      }
    }



