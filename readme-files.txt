
Coming to this project after some months, I forget what everything is for. :)

README.md

  .md is a Markdown file. README.md is shown on the github page for the project.

package.json

  Lists the versions of Node packages that are used.
  Running 'npm install' in the folder installs all this stuff.
  These packages may be thought of as dev time modules.

karma.conf.js
karma-e2c.conf.js

  Configuration files for karma, the unit test runner.

Gruntfile.js

  Configuration file for grunt, the task runner.

bower.json
.bowerrc

  The configuration file for Bower, the package manager for the web stuff.
  This may be thought of as the runtime assets.

.travis.yml

  Instructions for the continuous integration service Travis.
  Whenever we commit to github, github is configured to tell Travis.
  Travis will get the code, do a build and publish it to Innosphere.

  Incidentally, (being a Windows guy who's trying to get into Linus) I think there's significance to files that start with dot. TODO look that up...

.jshintrc

  Configuration for jshint, a JavaScript style validator that is run as a grunt task.
  It looks for and reports on common JavaScript mistakes.

.gitignore

  Files/paths listed here are ignored by git.
  Such files may exist in our local file system, but it is not added to git.
  This is mainly temporary build related files or third party stuff.

.gitattributes

  No clue. git added it

.editorconfig

  Configuration hints for text editors. Sublime looks at it, I think. Not sure about other editors.

test/

  this folder contains unit tests

test/mocks

  this folder contains mocks or fake data used for tests

test/specs

  this folder contains specifications, aka actual tests, for how the other code works

app/

  this is the actual application in its 'raw' form.
  I'm pretty sure you could point a web server to this folder and it'd work out of the gate

--------------------
The following stuff is not in git.
It's created as temporary or transitory stuff at runtime.
--------------------

node_modules/

  this folder contains node modules (third party stuff), used during development.
  Run 'npm install' in the qarally folder to install this stuf, which uses packages.json as instruction.
  essentially ignore it (it is ignored by .gitignore)

app/bower_components

  this folder contains bower modules (third party stuff), used at runtime
  Run 'bower install' to install the stuff. It uses bower.json to know what to install
  the difference between node_modules and bower_components is that the bower_components are in the app/ folder; visible to the client through the website

.tmp/

  this folder contains temporary files produced during the build process, when you run 'grunt'
  best to ignore it. the .gitignore file will ignore it, and it won't get checked into git.

dist/

  this folder contains the distribution version of the app
  grunt tasks transform the app/ folder into the dist/ folder, optimizing and validating a bunch of stuff.

coverage/

  this folder contains a code coverage report from running the unit tests.
  it is configured in karma.conf.js to run coverage, and the report comes here.





