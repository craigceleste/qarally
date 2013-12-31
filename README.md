qarally
=======

My first AngularJS app.

This is an internal tool for QA staff to perform test cases using Rally (rallydev.com). Rally is very good for product owners and developers. The UX for QA Testers to perform tests is burdensome. A test that takes 30 seconds to perform often takes 90 seconds to negotiate Rally's UX. This "quick and dirty" internal tool is meant to make their efforts faster. For me, a quick and dirty internal tool is an ideal place to give AngularJS a shot.

** It is probably over engineered! I don't spend a lot of time on heavy client-side apps and I'm kind of stepping past the boundaries of too much to figure out where the line is.

TODO list
---------

* review $watch currentWpi. this is getting called when the page loads and there is no change.
* Store.sectionList; inject it (even if its in the same file)
* move routes to its own file
* review the practice of $watch'ing non-trivial objects; what is the cutoff line for too much?
* Wpi service; generate a locally unique id
* Error handling in window.onerror in index.html
* review mocks in ManageWpiCtrlSpec.js


Research Topics
---------------

1. How to discover template errors?
  * such as misspelled directives or expressions
  * discover at dev/build time (node script?)
  * discover at runtime (catch errors and report to console even)

2. Service to mock fragility?
  * when unit testing C# code, a DI and a mock share an interface or base class. If you change the DI, it's often clear where it is mocked and what mocks you need to change.
  * as this is my first foray into JavaScript unit testing, I immediately notice that I can change a service and fery few tests fail: even though they should. Because the mocks are completely disconnected.
  * it becomes an honor system and exercise in offline dilligence to find all the mocks and update them.
  * Are there any techniques to help ensure that mocks are a realistic representation of the object they mock?
  	* Possible answer: do not create a mock object. Use the real object and override methods with spyOn. This guarantees that at least the method being mocked exists.

3. Build
  * Research grunt
  * Ideally I want to at least
  	* bundle and minify JavaScript files
  	* I don't have much css, but make a cursory less file, tranform it, minify it.
  	* Update [script] references to point to the bundle
  	* Optionally minify html files and templates
  * Use CDN sources for libs.
  	* I don't think that's build related.
  	* What is best practice for using CDN with regards to unit tests?
  * It would be nice to publish code coverage
  	* If unit tests could be run during build. build fails if any tests fail.
  	* Code coverage result html report for that run is included in published folder.
  	* Link to it from the site; some hard-coded (convention based) URL is probably fine.
  * Are there any CI solutions for this sort of thing? I'd hate to set  up my own server just for this.
  * What other stuff do people do during a build?

LocalStorage
------------
window.localStorage will be used to cache rally data (and some easily recoverable user data) for faster day-to-day work.

*Subscription Data*: recurse through all Workspaces, Projects and Iterations and cache them.

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

*WPI List*: A "WPI" is a named combination of Workspace + Project + Iteration. Many QA Testers switch between a very small list of projects (2 or 3) and this navigation may be a pain (maybe it's not) but here we allow the testers to define a WPI that is stored to window.localStorage. If it's deleted, it's not a big deal. It's just their iteration choice.

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
            buildNumber: "MainLine.123",

            // The list of Test Sets for an Iteration is loaded and cached separately from Subscription Data.
            // They choose this after creating the WPI
            testSetRef":"https://rally1.rallydev.com/...some.id...",

            // Shouldn't be here: It got serialized by mistake since I $watch it. Fix that.
            "$$hashKey":"007"
          }
        }
      }
    }

*Test Set*: We will store several test sets in localStorage. It consumes too much of localStorage (which has a 5MB limit) to cache all test sets for all iterations (as we do with subscription data)

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
        ],

        // Each test case reference 0..1 work product (user story or defect) and 1 test folder (and are M:N'd into test sets)
        // The list of test cases therefore produces a list of stories and folders that the user can use for filtering.
        // The filters are lost if switching to another Test Set causes this one to be pushed out of the cache.
        workProductFilters: [
          "...some id...",
          "...some id..."
        ],
        testFolderFilters: [
          "...some id...",
          "...some id..."
        ]
      }
    }



