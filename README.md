qaRally
=======
My first AngularJS app. Mainly as a learning exercise.

Dev environment / process
-------------------------
This app is an internal tool for our company. It will likely be maintained by ASP.NET developers, backend developers, or in general people who are not familiar with this stack of technologies. These instructions are for you (and future me).

1. Install the following software.

    1. [Node.js] is the engine for most dev-time tasks (testing, building, scaffolding, etc.)
    1. [Git] console app or [GitHub] windows client, or another git client you like.
    1. [Sublime] or [Notepad++] or your text editor of choice.

1. Install the following node modules by running this from PowerShell.

        npm install -g bower karma-cli grunt-cli
   * TODO: it would be nice if I could tell people to `npm install` and Node would install everything it needs, but for bower, grunt and karma to run from the terminal, they seem to need to be installed globally.
   
1. Decide where to download the source code.
   * Example: C:\Dev
   * I recommend NOT `C:\Users\Yourname\Documents\GitHub` (the default). The path of the files will become too long for many Windows programs like Visual Studio.

1. Download the source code:

        # from C:\Dev
        git clone https://github.com/craigceleste/qarally.git
   * It will create a directory called `qarally` with the project in it.

1. Install the node modules required for development.

        # from C:\Dev\qarally   <=== changed
        npm install
   * Node will look at the `package.json` file and download any modules it needs into the `node_modules` directory. These modules are run on your dev computer to do dev related tasks like unit tests, code validation, build tasks like minification, and so forth. (Node is much more general purpose, but that's what we use it for in this project).

1. Install the bower modules required for client side development.

        # from C:\Dev\qarally
        bower install
   * Bower will look at the `bower.json` file and download any modules it needs into the `app/bower_modules` folder. These modules are client-side assets like Bootstrap, jQuery, AngularJS, Underscore and so forth. Bower differs from Node in that node supports 2 places to put modules (globally or locally) and these modules are conceptually outside of your project and do actions on your project. Bower modules are client-side components installed inside of the website (`/app`). It is aware that this is a website (unlike node) and that the assets belong in a particular place within it. Bower is a ligher-weight package manager specifically for dealing with client side components _inside_ a sub-part of your project.

1. Do a build to make sure it works

        # from C:\Dev\qarally
        grunt
   * This will ultimately run a bunch of small tasks (grunt is a task runner) that produces the `/dist` folder. Don't worry about the `/dist` folder. We just want to make sure things build properly.
   * For ASP.NET developers, there is a headspace thing to realize here. The `/app` folder is 100% runable from your browser if you point a web server there, anallogous to `debug=true` in web.config. The `/dist` folder is analogous to `debug=false` in web.config. The build process is a transform that is run during build time. This differs from ASP.NET where a debug and release build run from the same folder, and transformation stuff happens at runtime. That may not be 100% accurate, but the concept that there are two folders you can run in a browser and that a first class part of your development is dealing with that transform.

1. Start the unit tests running

        # from C:\Dev\qarally
        karma start
    * This will run the unit tests, monitor for file changes and re-run the tests every time you save a file. Move this PowerShell window to a side monitor and keep an eye out for red/green while you work.

1. Begin a web server to run site. Leave the unit tests running. In another terminal, run:

        # from C:\Dev\qarally
        grunt serve
   * Grunt should start a simple web server and open a browser to use the site. This is analogous to Visual Studio's built-in development server for testing. Alternately, configure different web server to point to the `/app` folder. I use `pow` for Mac at home, and IIS for Windows at work.
   * SIDE NOTE: this stack of technologies leverages scripts run from the console more than ASP.NET. Most of the heavy lifting that Visual Studio normally does, is done instead by smaller, focused scripts. Consider becoming comfortable with PowerShell (on windows) or bash (on mac). On windows, consider downloading [Console2], which allows for tabbed console windows, among other things.

1. Edit the source code in the `/app` directory
   * Consider using a "simple" text editor like [Sublime]. Visual Studio has a couple of problems for this project. First: it has a tendency to format code in a way that jshint will reject, and I kind of like jshint. It takes an amount of effort to configure Visual Studio to play nice. Second: Visual Studio has a tendency to leave extra files in the project, but I think you can configure it not to. If you do use Visual Studio, figure out what those files are and add them to `.gitignore`, and don't check-in using Visual Studio unless you know what it is going to manipulate in the project.

1. Push to git when you're ready
   * Please run `grunt` to verify that everything passes before pushing your changes up to github.
   * When you do push changes to github, [travis-ci.org] will be notified of the change, and it will do a build. This is a continuous integration service. Travis will look at the .travis.yml file in the root of the site for configuration. If the build is successful, it will publish the `/dist` folder to [TODO not done].


[Console2]:http://sourceforge.net/projects/console/
[FireFox]:http://www.mozilla.org/en-US/firefox/new/
[Git]:http://git-scm.com/downloads
[GitHub]:https://help.github.com/articles/set-up-git
[Google Chrome]:https://www.google.com/intl/en_uk/chrome/browser/
[Node.js]:http://nodejs.org/
[Notepad++]:http://notepad-plus-plus.org/
[Sublime]:http://www.sublimetext.com/
[travis-ci.org]:http://travis-ci.org
