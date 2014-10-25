/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

var _ = require('lodash');
var AppDispatcher = require('../AppDispatcher');
var AppConstants = require('../AppConstants');
var api = require('../core/api');

var LogActions = {

  trackMetric: function(name, properties) {
    // Since we are tracking all over the place,
    // we get "can't dispatch in the middle of a dispatch" errors
    // Might go away when switching to react-router
    _.defer(function() {
      AppDispatcher.dispatch({
        type: AppConstants.api.TRACKED_METRIC,
        name: name,
        properties: properties
      });
    });

    api.metrics.track(name, properties);
  },

  logError: function(error, message, properties) {
    AppDispatcher.dispatch({
      type: AppConstants.api.LOGGED_ERROR,
      error: error,
      message: message,
      properties: properties
    });

    api.errors.log(error, message, properties);
  }

};

module.exports = LogActions;
