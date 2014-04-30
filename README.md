qaRally
=======
My first AngularJS app. Mainly as a learning exercise.

Dev environment
---------------
This app is an internal tool for our company. It will likely be maintained by ASP.NET developers, backend developers, or in general people who are not familiar with this stack of technologies. These instructions are for you (and future me).

1. Install the following software.

    1. [Google Chrome] - required for running unit tests.
    1. [FireFox] - required for running unit tests.
    1. [Sublime] or [Notepad++] or your text editor of choice.
    1. [Node.js] is the engine for running build scripts, unit tests, and all the dev-time stuff.
    1. [Git] console app or [GitHub] windows client, or another git client you like.

1. Configure git
 
        git config --global user.email 'your@email.com'
        git config --global user.name 'Your Name'
        git config --global push.default simple
   * This just saves you some warnings. I'm not a git expert. There is lots of advice on using and configuring git elsewhere.

1. Install the following node modules by running this from PowerShell.

        npm install -g bower karma-cli grunt-cli
   * TODO: it would be nice if I could tell people to `npm install` and Node would install everything it needs, but for bower, grunt and karma to run from the terminal, they seem to need to be installed globally.
   
1. Decide where to download the source code.
   * Example: C:\Dev
   * I recommend NOT `C:\Users\Yourname\Documents\Projects` or similar. The path of the files you'll download will become too long for many Windows programs like Visual Studio. Consider `C:\Dev` or something like that.

1. Download the source code:

        # from C:\Dev
        git clone https://github.com/craigceleste/qarally.git
   * It will create a directory called `qarally` with the project in it.

1. Install the node modules required for development.

        # from C:\Dev\qarally   &gt;--- changed
        npm install
   * Node will look at the `package.json` file and download any modules it needs into the `node_modules` directory. These modules are run on your dev computer to do dev related tasks like unit tests, code validation, build tasks like minification, and so forth. (Node is much more general purpose, but that's what we use it for in this project).

1. Install the bower modules required for client side development.

        # from C:\Dev\qarally
        bower install
   * Bower will look at the `bower.json` file and download any modules it needs into the `app/bower_modules` folder. These modules are client-side assets like Bootstrap, jQuery, AngularJS, Underscore and so forth. Bower differs from Node in that node supports 2 places to put modules (globally or locally), where we need client-side components installed inside of the website (`/app`). Bower is a ligher-weight package manager specifically for dealing with client side components _inside_ a sub-part of your project.

1. Do a build to make sure it works

        # from C:\Dev\qarally
        grunt
   * This will ultimately run a bunch of small tasks (grunt is a task runner) that produces the `/dist` folder. But it also does code review (jshint), unit tests, bundling, minifying, file copying, etc.

1. Run unit tests

        # from C:\Dev\qarally
        karma start
    * This will run the JavaScript and unit tests. It will also monitor for file changes and re-run the tests every time you save. Put this terminal in a corner of a side monitor and keep an eye out for red/green while you work.

1. Begin a server to view the site. Leave the unit tests running. In another terminal, run:

        # from C:\Dev\qarally
        grunt serve
   * Grunt should start a simple web server and open a browser to use the site. This is analogous to Visual Studio's built-in development server for testing. Alternately, configure a different web server to point to the `/app` folder. (I use `pow` for Mac at home.)
   * This stack of technologies leverages the console more than ASP.NET. Most of the heavy lifting that Visual Studio normally does, is done instead by smaller, focused scripts. Consider becoming comfortable with PowerShell (on windows) or bash (on mac). On windows, consider downloading [Console2], which allows for tabbed console windows, among other things.

1. Edit the source code in the `/app` directory
   * Consider using a "simple" text editor like [Sublime]. Visual Studio has a tendency to leave extra files in the project. If you do use Visual Studio, figure out what those files are and add them to the `.gitignore` file in the root of the project.

1. Push to git when you're ready
   * Please run `grunt` and that all the jshint, unit tests, etc pass before checking in.
   * When you do push changes to github, [travis-ci.org] will be notified of the change, and it will do a build. This is a continuous integration server. Travis will look at the .travis.yml file in the root of the site for configuration.
   * TODO: distribution from travis is not configured yet. I am hoping to push the `/dist` to an FTP site for a staging area.


[Console2]:http://sourceforge.net/projects/console/
[FireFox]:http://www.mozilla.org/en-US/firefox/new/
[Git]:http://git-scm.com/downloads
[GitHub]:https://help.github.com/articles/set-up-git
[Google Chrome]:https://www.google.com/intl/en_uk/chrome/browser/
[Node.js]:http://nodejs.org/
[Notepad++]:http://notepad-plus-plus.org/
[Sublime]:http://www.sublimetext.com/
[travis-ci.org]:http://travis-ci.org
