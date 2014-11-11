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
    request: {},
    confirm: {}
  };
};

var PasswordResetStore = _.assign({}, EventEmitter.prototype, {

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

  isRequesting: function() {
    return Boolean(this._state.request.pending);
  },

  getRequestError: function() {
    return _.cloneDeep(this._state.request.error);
  },

  isRequestSuccessful: function() {
    return Boolean(this._state.request.success);
  },

  isConfirming: function() {
    return Boolean(this._state.confirm.pending);
  },

  getConfirmError: function() {
    return _.cloneDeep(this._state.confirm.error);
  },

  isConfirmSuccessful: function() {
    return Boolean(this._state.confirm.success);
  }

});

PasswordResetStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = PasswordResetStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_REQUEST_PASSWORD_RESET:
      self._state.request.pending = true;
      self._state.request.error = null;
      self._state.request.success = false;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_REQUEST_PASSWORD_RESET:
      self._state.request.pending = false;
      self._state.request.error = _.cloneDeep(payload.error);
      self._state.request.success = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_REQUEST_PASSWORD_RESET:
      self._state.request.pending = false;
      self._state.request.error = null;
      self._state.request.success = true;
      self.emitChange();
      break;

    case AppConstants.api.STARTED_CONFIRM_PASSWORD_RESET:
      self._state.confirm.pending = true;
      self._state.confirm.error = null;
      self._state.confirm.success = false;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CONFIRM_PASSWORD_RESET:
      self._state.confirm.pending = false;
      self._state.confirm.error = _.cloneDeep(payload.error);
      self._state.confirm.success = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_CONFIRM_PASSWORD_RESET:
      self._state.confirm.pending = false;
      self._state.confirm.error = null;
      self._state.confirm.success = true;
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

module.exports = PasswordResetStore;
