qaRally
=======
My first AngularJS app. Mainly as a learning exercise.

Dev environment
---------------
This app is an internal tool for our company. It will likely be maintained by ASP.NET developers, backend developers, or in general people who are not familiar with this stack of technologies. These instructions are for you.

1. Install the following software.

    1. [Google Chrome] - required for running unit tests.
    1. [FireFox] - required for running unit tests.
    1. [Sublime] (not free but worth it) or [Notepad++] or a text editor of choice.
    1. [Node.js] is the engine for running build scripts, unit tests, and all the dev-time stuff.
    1. [Git] or another git client you like.

1. Install the following node modules by running this from PowerShell.

        npm install bower -g
        npm install karma-cli -g
        npm install grunt-cli -g

1. Decide where to download the source code.
   * I recommend NOT `C:\Users\Yourname\Documents\Projects` or similar. The path of the files you'll download will become too long for many Windows programs like Visual Studio. Consider `C:\Dev` or something like that.

1. Download the source code:

        # from C:\Dev
        git clone https://github.com/craigceleste/qarally.git

   * It will create a directory called `qarally` with the project in it.
1. Install the node modules required for development.

        # from C:\Dev\qarally
        npm install

   * Node will look at the `package.json` file and download any modules it needs into the `node_modules` directory. These modules are run on your dev computer to do dev related tasks like unit tests, code validation, build tasks like minification, and so forth. (Node is much more general purpose, but that's what we use it for in this project).
1. Install the bower modules required for client side development.

        # from C:\Dev\qarally
        bower install

   * Bower will look at the `bower.json` file and download any modules it needs into the `app/bower_modules` folder. These modules are client-side assets like Bootstrap, jQuery, AngularJS, Underscore and so forth.
1. Run unit tests

        # from C:\Dev\qarally
        karma start

    * This will open instances of Chrome and Firefox to run the JavaScript and unit tests in their honest natural habitat (the browser). It may look ugly but it's quite zen once you get used to it. Note that you can actually debug the tests in the browsers developer tools.
1. Begin a server to view the site. Leave the unit tests running. In another terminal, run:

        # from C:\Dev\qarally
        grunt serve

   * Grunt should start a simple web server and open a browser to use the site. This is analogous to Visual Studio's built-in development server for testing. You can easily configure any web server such as IIS (I use pow on the mac) to point to the `/app` folder.
1. Edit the source code in `/app`

   * Note that the unit tests will run when you save your changes. And the browser may also refresh when you save changes (although the life reload is a bit flakey for me).
1. Do a build

        # from C:\Dev\qarally
        grunt

   * If you're lucky and there are no errors you need to fix, the site will be minified, bundled, unit tested, and put in the `/dist` folder. You can copy it out from ther and deploy it. Working out a continuous integration server is on the to-do list, but I'm not that far yet.






[Google Chrome]:https://www.google.com/intl/en_uk/chrome/browser/
[FireFox]:http://www.mozilla.org/en-US/firefox/new/
[Sublime]:http://www.sublimetext.com/
[Notepad++]:http://notepad-plus-plus.org/
[Node.js]:http://nodejs.org/
[Git]:http://git-scm.com/downloads
