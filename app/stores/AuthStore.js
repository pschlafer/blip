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
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    user: null
  };
};

var AuthStore = _.assign({}, EventEmitter.prototype, {

  _state: getInitialState(),

  reset: function() {
    this._state = getInitialState();
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  isAuthenticated: function() {
    return Boolean(this._state.user);
  },

  getLoggedInUser: function() {
    return _.cloneDeep(this._state.user);
  },

  getLoggedInUserId: function() {
    return this._state.user ? this._state.user.userid : null;
  },

  isLoadingSession: function() {
    return Boolean(this._state.requests.loadingSession);
  },

  isLoggingIn: function() {
    return Boolean(this._state.requests.loggingIn);
  },

  getLoginError: function() {
    return _.cloneDeep(this._state.requests.loginError);
  },

  isSigningUp: function() {
    return Boolean(this._state.requests.signingUp);
  },

  getSignupError: function() {
    return _.cloneDeep(this._state.requests.signupError);
  },

  isLoggingOut: function() {
    return Boolean(this._state.requests.loggingOut);
  },

  _updateWithGroup: function(group) {
    _.assign(this._state.user, {profile: group.profile});
  }

});

AuthStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = AuthStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_LOAD_SESSION:
      self._state.requests.loadingSession = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOAD_SESSION:
      self._state.requests.loadingSession = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOAD_SESSION:
      self._state.requests.loadingSession = false;
      self._state.user = _.cloneDeep(payload.user);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_LOGIN:
      self._state.requests.loggingIn = true;
      self._state.requests.loginError = null;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGIN:
      self._state.requests.loggingIn = false;
      self._state.requests.loginError = _.cloneDeep(payload.error);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGIN:
      self._state.requests.loggingIn = false;
      self._state.requests.loginError = null;
      self._state.user = _.cloneDeep(payload.user);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_SIGNUP:
      self._state.requests.signingUp = true;
      self._state.requests.signupError = null;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_SIGNUP:
      self._state.requests.signingUp = false;
      self._state.requests.signupError = _.cloneDeep(payload.error);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_SIGNUP:
      self._state.requests.signingUp = false;
      self._state.requests.signupError = null;
      self._state.user = _.cloneDeep(payload.user);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_LOGOUT:
      self._state.requests.loggingOut = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGOUT:
      self._state.requests.loggingOut = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_CREATE_GROUP:
      if (self.getLoggedInUserId() === payload.group.userid) {
        self._updateWithGroup(payload.group);
        self.emitChange();
      }
      // Else do nothing
      break;

    case AppConstants.api.STARTED_UPDATE_GROUP:
      // Optimistic update
      if (self.getLoggedInUserId() === payload.group.userid) {
        self._updateWithGroup(payload.group);
        self.emitChange();
      }
      // Else do nothing
      break;

    case AppConstants.api.STARTED_UPDATE_USER:
      // Optimistic update
      self._state.user = _.cloneDeep(payload.user);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      self.reset();
      self.emitChange();
      break;

    default:
      // Do nothing
  }

});

module.exports = AuthStore;
