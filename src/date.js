/*global angular */
/*
 jQuery UI Datepicker plugin wrapper

 @note If ≤ IE8 make sure you have a polyfill for Date.toISOString()
 @param [ui-date] {object} Options to pass to $.fn.datepicker() merged onto uiDateConfig
 */

angular.module('ui.date', [])

.constant('uiDateConfig', {})

.directive('uiDate', ['uiDateConfig', function (uiDateConfig) {
  'use strict';
  return {
    require:'?ngModel',
    link:function (scope, element, attrs, controller) {

      // This is the options structure
      var getOptions = function () {
        return angular.extend({}, uiDateConfig, scope.$eval(attrs.uiDate));
      };

      // This function assumes that the most up-to-date version of the
      // date is always in the input.  To make it into a date we have to parse it.
      var getDate = function () {
        try {
          return jQuery.datepicker.parseDate(element.datepicker('option', 'dateFormat'), element.val());
        }
        catch (e) {
          return null;
        }
      }

      // This initialises or updates the widget
      var updateDateWidget = function () {
        var showing = false;
        var opts = getOptions();

        // If this is the first time, attach the event handlers
        if (!element.hasClass("hasDatepicker")) {
          if (controller) {

            // Set the view value in a $apply block when users selects
            // (calling directive user's function too if provided).
            opts.onSelect = function (value, picker) {
              scope.$apply(function() {

                // The widget is always visible at this stage.
                showing = true;

                // Update the view
                controller.$setViewValue(getDate());

                // Check to see if there is an original 'onSelect'
                // option (i.e. set by the user), and call if there is.
                var options = getOptions();
                if ('onSelect' in options) {
                  options['onSelect'](value, picker);
                }
              });
            };

            // Track showing
            opts.beforeShow = function() {
              showing = true;
            };
            opts.onClose = function(value, picker) {
              showing = false;
            };

            // Update the date picker when the model changes
            controller.$render = function () {
              var date = controller.$viewValue;
              if ( angular.isDefined(date) && date !== null && !angular.isDate(date) ) {
                throw new Error('ng-Model value must be a Date object - currently it is a ' + typeof date + ' - use ui-date-format to convert it from a string');
              }
              element.datepicker("setDate", date);
            };

            element.on('blur keyup input', function() {
              if (!showing) {
                scope.$apply(function() {
                  element.datepicker("setDate", getDate());
                  controller.$setViewValue(getDate());
                });
              }
              else {
                scope.$apply(function() {
                  controller.$setViewValue(getDate());
                });
              }
            });
          }

          // Create the new datepicker widget
          element.datepicker(opts);
        }
        else {
          var oldOpts = element.datepicker('option'),
              key = null;

          // Insert nulls into the options structure for any options
          // that were previously set but aren't anymore.
          for (key in oldOpts) {
            if (!(key in opts)) {
              opts[key] = null;
            }
          }

          // Update options
          element.datepicker('option', opts);
        }

        if ( controller ) {
          // Force a render to override whatever is in the input text box
          controller.$render();
        }
      };

      // Watch for changes to the directives options
      scope.$watch(getOptions, updateDateWidget, true);
    }
  };
}
])

.constant('uiDateFormatConfig', '')

.directive('uiDateFormat', ['uiDateFormatConfig', function(uiDateFormatConfig) {
  var directive = {
    require:'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      var dateFormat = attrs.uiDateFormat || uiDateFormatConfig;
      if ( dateFormat ) {
        // Use the datepicker with the attribute value as the dateFormat string to convert to and from a string
        modelCtrl.$formatters.push(function(value) {
          if (angular.isString(value) ) {
            return jQuery.datepicker.parseDate(dateFormat, value);
          }
          return null;
        });
        modelCtrl.$parsers.push(function(value){
          if (value) {
            try {
              return jQuery.datepicker.formatDate(dateFormat, value);
            }
            catch (e) {
              return null;
            }
          }
          return null;
        });
      } else {
        // Default to ISO formatting
        modelCtrl.$formatters.push(function(value) {
          if (angular.isString(value) ) {
            return new Date(value);
          }
          return null;
        });
        modelCtrl.$parsers.push(function(value){
          if (value) {
            return value.toISOString();
          }
          return null;
        });
      }
    }
  };
  return directive;
}]);
