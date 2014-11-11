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

var PasswordResetActions = {

  request: function(email) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_REQUEST_PASSWORD_RESET,
      email: email
    });
    api.user.requestPasswordReset(email, function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_REQUEST_PASSWORD_RESET,
          error: err,
          email: email
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_REQUEST_PASSWORD_RESET,
        email: email
      });
    });
  },

  confirm: function(payload) {
    var actionPayload = _.omit(payload, 'password');
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_CONFIRM_PASSWORD_RESET,
      payload: actionPayload
    });
    api.user.confirmPasswordReset(payload, function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_CONFIRM_PASSWORD_RESET,
          error: err,
          payload: actionPayload
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_CONFIRM_PASSWORD_RESET,
        payload: actionPayload
      });
    });
  }

};

module.exports = PasswordResetActions;
