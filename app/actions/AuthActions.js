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
var async = require('async');
var AppDispatcher = require('../AppDispatcher');
var AppConstants = require('../AppConstants');
var api = require('../core/api');
var AuthStore = require('../stores/AuthStore');

var AuthActions = {

  loadSession: function() {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_LOAD_SESSION});
    api.init(function() {
      if (!api.user.isAuthenticated()) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.COMPLETED_LOAD_SESSION,
          user: null
        });
      }

      api.user.get(function(err, user) {
        if (err) {
          return AppDispatcher.dispatch({
            type: AppConstants.api.FAILED_LOAD_SESSION,
            error: err
          });
        }

        AppDispatcher.dispatch({
          type: AppConstants.api.COMPLETED_LOAD_SESSION,
          user: user
        });
      });
    });
  },

  login: function(credentials, options) {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_LOGIN});

    async.series({
      login: api.user.login.bind(null, credentials, options),
      user: api.user.get
    },
    function(err, results) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_LOGIN,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_LOGIN,
        user: results.user
      });
    });
  },

  signup: function(user) {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_SIGNUP});
    api.user.signup(user, function(err, user) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_SIGNUP,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_SIGNUP,
        user: user
      });
    });
  },

  logout: function() {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_LOGOUT});
    api.user.logout(function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_LOGOUT,
          error: err
        });
      }

      AppDispatcher.dispatch({type: AppConstants.api.COMPLETED_LOGOUT});
    });
  },

  updateUser: function(userUpdates) {
    var previousUser = AuthStore.getLoggedInUser();
    userUpdates = _.assign(
      _.omit(previousUser, 'profile'),
      _.omit(userUpdates, 'profile'),
      {profile: _.assign({}, previousUser.profile, userUpdates.profile)}
    );
    var newUser = _.omit(_.cloneDeep(userUpdates), 'password');


    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_UPDATE_USER,
      user: newUser
    });

    // If username hasn't changed, don't try to update
    // or else backend will respond with "already taken" error
    if (userUpdates.username === previousUser.username) {
      userUpdates = _.omit(userUpdates, 'username', 'emails');
    }

    api.user.put(userUpdates, function(err, user) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_UPDATE_USER,
          error: err,
          user: newUser
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_UPDATE_USER,
        user: newUser
      });
    });
  }

};

module.exports = AuthActions;
