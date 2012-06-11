Welcome
===========

jsp-api aims to provide a better interface to http://jsp.com.mk/VozenRed.aspx - mostly via an API and a 
mobile-friendly web app which allows you to check your busses.


Requirements
===========

jsp-api requires nodejs and phantomjs to run. To install other (node-modules) dependencies simply run

`npm install`


Test
===========

To run the test, execute 

`nodeunit test`

Currently it runs the phantomjs script and fetches the current and next day bus schedule for 35 main busses.