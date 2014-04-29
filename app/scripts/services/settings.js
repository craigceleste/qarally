'use strict';

// WPI = named combination of {Workspace + Project + Iteration} for easier access to commonly used iterations.

angular.module('qa-rally')
  .factory('Settings', ['$log', '$window', function($log, $window) {

    var service = {};
    var preferencesKey = 'preferences';

    service.set = function(preferences){
      $log.info('preferences', 'set', preferences);
      if (typeof preferences === 'undefined') {
        delete $window.localStorage[preferencesKey];
      }
      else {
        $window.localStorage[preferencesKey] = JSON.stringify(preferences);
      }
    };

    service.get = function(){
      var preferences = {};
      var preferencesJson = $window.localStorage[preferencesKey];
      if (preferencesJson) {
        try {
          preferences = JSON.parse(preferencesJson);
        }
        catch(e)
        {
        }
      }
      $log.info('preferences', 'get', preferences);
      return preferences;
    };

    return service;
  }]);
