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
var config = require('../config');
var AuthStore = require('./AuthStore');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    showingAcceptTerms: false,
    showingWelcomeTitle: false,
    showingWelcomeSetup: false,
    dismissedBrowserWarning: false
  };
};

var AppStore = _.assign({}, EventEmitter.prototype, {

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

  getState: function() {
    return _.cloneDeep(this._state);
  }

});

AppStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = AppStore;
  switch(payload.type) {

    case AppConstants.api.COMPLETED_SIGNUP:
      self._state = _.assign(self._state, {
        showingAcceptTerms: config.SHOW_ACCEPT_TERMS ? true : false,
        showingWelcomeTitle: true,
        showingWelcomeSetup: true
      });
      self.emitChange();
      break;

    case AppConstants.ui.DISMISSED_BROWSER_WARNING:
      self._state = _.assign(self._state, {
        dismissedBrowserWarning: true
      });
      self.emitChange();
      break;

    case AppConstants.ui.ACCEPTED_TERMS:
      self._state = _.assign(self._state, {
        showingAcceptTerms: false
      });
      self.emitChange();
      break;

    case AppConstants.ui.HID_WELCOME_SETUP:
      self._state = _.assign(self._state, {
        showingWelcomeSetup: false
      });
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      AppDispatcher.waitFor([AuthStore.dispatchToken]);
      self.reset();
      self.emitChange();
      break;

    default:
      // Do nothing
  }

});

module.exports = AppStore;
