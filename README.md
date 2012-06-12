Welcome
===========

jsp-api aims to provide a better interface to http://jsp.com.mk/VozenRed.aspx - mostly via an API and a 
mobile-friendly web app which allows you to check your busses.


Requirements
===========

jsp-api requires [nodejs](http://nodejs.org/) and [phantomjs](http://phantomjs.org/) to run. 
To install other (node-modules) dependencies simply run

`npm install`

from the project directory after installing node.

Now you can run the service

`node app.js`


Test
===========

To run the test, execute 

`nodeunit test`

Currently it runs the phantomjs script and fetches the current and next day bus schedule for 35 main busses.

Theme1
===========
Proposed jquery mobile theme: http://jquerymobile.com/themeroller/?ver=1.1.0&style_id=20120611-60