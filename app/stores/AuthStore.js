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
var merge = require('react/lib/merge');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    user: null
  };
};

var AuthStore = merge(EventEmitter.prototype, {

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
  }

});

AuthStore.dispatchToken = AppDispatcher.register(function(payload) {
  switch(payload.type) {

    case AppConstants.api.STARTED_LOAD_SESSION:
      AuthStore._state.requests.loadingSession = true;
      AuthStore.emitChange();
      break;

    case AppConstants.api.FAILED_LOAD_SESSION:
      AuthStore._state.requests.loadingSession = false;
      AuthStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOAD_SESSION:
      AuthStore._state.requests.loadingSession = false;
      AuthStore._state.user = _.cloneDeep(payload.user);
      AuthStore.emitChange();
      break;

    case AppConstants.api.STARTED_LOGIN:
      AuthStore._state.requests.loggingIn = true;
      AuthStore._state.requests.loginError = null;
      AuthStore.emitChange();
      break;

    case AppConstants.api.FAILED_LOGIN:
      AuthStore._state.requests.loggingIn = false;
      AuthStore._state.requests.loginError = _.cloneDeep(payload.error);
      AuthStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGIN:
      AuthStore._state.requests.loggingIn = false;
      AuthStore._state.requests.loginError = null;
      AuthStore._state.user = _.cloneDeep(payload.user);
      AuthStore.emitChange();
      break;

    case AppConstants.api.STARTED_SIGNUP:
      AuthStore._state.requests.signingUp = true;
      AuthStore._state.requests.signupError = null;
      AuthStore.emitChange();
      break;

    case AppConstants.api.FAILED_SIGNUP:
      AuthStore._state.requests.signingUp = false;
      AuthStore._state.requests.signupError = _.cloneDeep(payload.error);
      AuthStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_SIGNUP:
      AuthStore._state.requests.signingUp = false;
      AuthStore._state.requests.signupError = null;
      AuthStore._state.user = _.cloneDeep(payload.user);
      AuthStore.emitChange();
      break;

    case AppConstants.api.STARTED_LOGOUT:
      AuthStore._state.requests.loggingOut = true;
      AuthStore.emitChange();
      break;

    case AppConstants.api.FAILED_LOGOUT:
      AuthStore._state.requests.loggingOut = false;
      AuthStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      AuthStore.reset();
      AuthStore.emitChange();
      break;

    default:
      // Do nothing
  }

});

module.exports = AuthStore;
