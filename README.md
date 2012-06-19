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

`node jsp.js`


Structure
===========

jsp.js is the expressjs app.

routes:
  - api.js = sets the 2 main api calls up

lib:
  - phantom-jspfetch.js = fetch script for [phantomjs](http://phantomjs.org/)
  - jspfetch.js = node wrapper for the phantom script
  - db.js = in-memory db storing fetch results

public:
  - css/main.css = style settings
  - themes = jquery-mobile theme
  - index.html = all pages html is found here.
  - js/main.js = all client-side code is stored here.
          

Notes
===========

The site administrators at jsp.com.mk have this nasty horrible little habit,
they tend to use different names for the same bus starting places in different
parts of the site or even on different calendar days for that matter. Some
gnarly code to deal with this can be found in main.js - mostly based on
levenshtein distance calculations.


Test
===========

To run the test, execute 

`nodeunit test`

Currently it runs the phantomjs script and fetches the current and next day bus schedule 
for 5 urban, 5 suburban and all nightshuft busses. That should be okay to verify
if the fetcher script is fully working
