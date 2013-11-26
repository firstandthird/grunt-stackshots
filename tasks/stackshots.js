/*
 * grunt-browser-screenshot
 * https://github.com/antonio.matias/grunt-browser-screenshot
 *
 * Copyright (c) 2013 Antonio Laguna
 * Licensed under the MIT license.
 */
"use strict";

module.exports = function(grunt) {
  var authFile = '.bspass';

  var fs = require('fs')
    , url = require('url')
    , BrowserScreenshot = require('stackshots')
    , file = grunt.file;

  var async = require('async');

  function getAuthData(authKey) {
    var temp, authData = null;

    if (authKey && fs.existsSync(authFile)) {
      temp = file.readJSON(authFile);
      if (typeof temp[authKey] !== "undefined"){
        authData = temp[authKey];
      }
    }
    return authData;
  }

  function arrayToLower(array) {
    var result = null;

    if (array instanceof Array){
      result = array.join(',').toLowerCase().split(',');
    }

    return result
  }

  grunt.registerMultiTask('stackshots', 'Get screenshots from BrowserStack', function() {
    var authData = getAuthData(this.data.authKey)
      , browserStackClient
      , self = this
      , done = this.async()
      , candidateBrowsers = arrayToLower(this.data.browsers)
      , os = arrayToLower(this.data.os)
      , devices = arrayToLower(this.data.devices)
      , orientation = this.data.orientation || 'portrait'
      , browsers;

    browserStackClient = new BrowserScreenshot({
      'email' : authData.email,
      'password' : authData.password,
      'folder' : this.data.dest
    }, function(){
      var preparedOS = browserStackClient.prepareOS(os);
      browsers = browserStackClient.guessBrowsers(candidateBrowsers, preparedOS.os, preparedOS.osVersions, devices);

      if (self.data.url.paths && self.data.url.paths.length){
        if (browsers.length){
          var functions = [];

          self.data.url.paths.forEach(function(path){
            var fullUrl = url.resolve(self.data.url.base, path);
            functions.push(function(cb){
              var request = {
                url : fullUrl,
                orientation : orientation,
                browsers : browsers
              };
              grunt.log.subhead('Getting screenshot(s) for %s', fullUrl);
              browserStackClient.getImages(request,cb);
            });
          });

          async.series(functions,function(){
            grunt.log.ok('All urls have been downloaded!');
            done();
          });
        }
        else {
          grunt.log.error('Your settings aren\'t able to get any browser match')
        }
      }
      else {
        grunt.log.error('You haven\' specified any URLs to get screenshots from.')
      }
    });

    if (grunt.errors) {
      return false;
    }
  });
};
