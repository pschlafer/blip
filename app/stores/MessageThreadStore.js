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
var utils = require('../core/utils');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    threadsById: {}
  };
};

var MessageThreadStore = merge(EventEmitter.prototype, {

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

  get: function(threadId) {
    return this._state.threadsById[threadId];
  },

  isFetching: function(threadId) {
    return Boolean(utils.getIn(this._state.requests, [threadId, 'fetching']));
  }

});

MessageThreadStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = MessageThreadStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = false;
      self._state.threadsById[payload.threadId] =
        _.cloneDeep(payload.messages);
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

module.exports = MessageThreadStore;
