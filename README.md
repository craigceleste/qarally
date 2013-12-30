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
  	* Update <script> references to point to the bundle
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

Subscription Data

    ['SubscriptionData'] = {

    };

