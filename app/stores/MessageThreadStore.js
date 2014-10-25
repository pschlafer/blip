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
var AuthStore = require('./AuthStore');

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
  },

  isCreating: function() {
    return Boolean(this._state.requests.creating);
  },

  isUpdating: function(threadId) {
    return Boolean(utils.getIn(this._state.requests, [threadId, 'updating']));
  },

  _addUserToMessage: function(message) {
    return _.assign({}, message, {user: AuthStore.getLoggedInUser().profile});
  },

  // To be deprecated
  // (probably moved to a dedicated store for the "new thread" form)
  getNewThread: function() {
    return _.cloneDeep(this._state.newThread);
  }

});

MessageThreadStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = MessageThreadStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = {fetching: true};
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = {fetching: false};
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_MESSAGE_THREAD:
      self._state.requests[payload.threadId] = {fetching: false};
      self._state.threadsById[payload.threadId] =
        _.cloneDeep(payload.messages);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_CREATE_MESSAGE_THREAD:
      self._state.requests.creating = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CREATE_MESSAGE_THREAD:
      self._state.requests.creating = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_CREATE_MESSAGE_THREAD:
      self._state.requests.creating = false;
      var thread = [self._addUserToMessage(payload.message)];
      self._state.threadsById[payload.message.id] = thread;
      self._state.newThread = thread;
      self.emitChange();
      break;

    case AppConstants.api.STARTED_ADD_COMMENT:
      self._state.requests[payload.threadId] = {updating: true};
      self.emitChange();
      break;

    case AppConstants.api.FAILED_ADD_COMMENT:
      self._state.requests[payload.threadId] = {updating: false};
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_ADD_COMMENT:
      self._state.requests[payload.threadId] = {updating: false};
      self._state.threadsById[payload.threadId] =
        self._state.threadsById[payload.threadId].concat(
          self._addUserToMessage(payload.message)
        );
      self.emitChange();
      break;

    case AppConstants.api.STARTED_EDIT_MESSAGE:
      // Optimistic update
      var updatedMessage = payload.message;
      var threadId = updatedMessage.parentmessage || updatedMessage.id;
      self._state.requests[threadId] = _.map(self._state.requests[threadId],
      function(message) {
        if (message.id === updatedMessage.id) {
          return updatedMessage;
        }
        return message;
      });
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      self.reset();
      break;

    default:
      // Do nothing
  }

});

module.exports = MessageThreadStore;
