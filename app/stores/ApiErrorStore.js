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

var userMessages = require('../userMessages');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    error: null
  };
};

var ApiErrorStore = _.assign({}, EventEmitter.prototype, {

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

  getError: function() {
    return this._state.error;
  }

});

ApiErrorStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = ApiErrorStore;
  switch(payload.type) {

    case AppConstants.ui.DISMISSED_API_ERROR:
      self._state.error = null;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGIN:
      // Don't handle wrong credentials globally
      if (payload.error && payload.error.status !== 401) {
        self._state.error = {
          key: AppConstants.api.FAILED_LOGIN,
          message: userMessages.ERR_LOGIN,
          original: payload.error
        };
      }
      self.emitChange();
      break;

    case AppConstants.api.FAILED_SIGNUP:
      // Don't handle "username already taken" globally
      if (payload.error && payload.error.status !== 400) {
        self._state.error = {
          key: AppConstants.api.FAILED_SIGNUP,
          message: userMessages.ERR_SIGNUP,
          original: payload.error
        };
      }
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGOUT:
      self._state.error = {
        key: AppConstants.api.FAILED_LOGOUT,
        message: userMessages.ERR_LOGOUT,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_UPDATE_USER:
      self._state.error = {
        key: AppConstants.api.FAILED_UPDATE_USER,
        message: userMessages.ERR_UPDATE_USER,
        original: payload.error,
        user: payload.user
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_GROUPS:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_GROUPS,
        message: userMessages.ERR_GET_GROUPS,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_GROUP,
        groupId: payload.groupId,
        message: userMessages.ERR_GET_GROUP(payload.groupId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CREATE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_CREATE_GROUP,
        message: userMessages.ERR_CREATE_GROUP,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_UPDATE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_UPDATE_GROUP,
        groupId: payload.group.userid,
        message: userMessages.ERR_UPDATE_GROUP(payload.group.userid),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LEAVE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_LEAVE_GROUP,
        groupId: payload.groupId,
        message: userMessages.ERR_LEAVE_GROUP(payload.groupId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_INVITATIONS_RECEIVED:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_INVITATIONS_RECEIVED,
        message: userMessages.ERR_GET_INVITATIONS_RECEIVED,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_INVITATIONS_SENT:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_INVITATIONS_SENT,
        groupId: payload.groupId,
        message: userMessages.ERR_GET_INVITATIONS_SENT(payload.groupId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_HEALTH_DATA:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_HEALTH_DATA,
        groupId: payload.groupId,
        message: userMessages.ERR_GET_HEALTH_DATA(payload.groupId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_MESSAGE_THREAD:
      self._state.error = {
        key: AppConstants.api.FAILED_FETCH_MESSAGE_THREAD,
        threadId: payload.threadId,
        message: userMessages.ERR_GET_MESSAGE_THREAD(payload.threadId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CREATE_MESSAGE_THREAD:
      self._state.error = {
        key: AppConstants.api.FAILED_CREATE_MESSAGE_THREAD,
        message: userMessages.ERR_CREATE_MESSAGE_THREAD,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_ADD_COMMENT:
      self._state.error = {
        key: AppConstants.api.FAILED_ADD_COMMENT,
        threadId: payload.threadId,
        message: userMessages.ERR_ADD_COMMENT(payload.threadId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_EDIT_MESSAGE:
      self._state.error = {
        key: AppConstants.api.FAILED_EDIT_MESSAGE,
        messageId: payload.message.id,
        message: userMessages.ERR_EDIT_MESSAGE(payload.message.id),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_ACCEPT_INVITATION:
      self._state.error = {
        key: AppConstants.api.FAILED_ACCEPT_INVITATION,
        invitation: payload.invitation,
        message: userMessages.ERR_ACCEPT_INVITATION(payload.invitation.creator.userid),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_DISMISS_INVITATION:
      self._state.error = {
        key: AppConstants.api.FAILED_DISMISS_INVITATION,
        invitation: payload.invitation,
        message: userMessages.ERR_DISMISS_INVITATION(payload.invitation.creator.userid),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_SEND_INVITATION:
      // Don't handle "already sent to email" or "already a member" errors
      if (payload.error && payload.error.status !== 409) {
        self._state.error = {
          key: AppConstants.api.FAILED_SEND_INVITATION,
          groupId: payload.groupId,
          email: payload.email,
          permissions: payload.permissions,
          message: userMessages.ERR_SEND_INVITATION(payload.email),
          original: payload.error
        };
      }
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CANCEL_INVITATION:
      self._state.error = {
        key: AppConstants.api.FAILED_CANCEL_INVITATION,
        groupId: payload.groupId,
        email: payload.email,
        message: userMessages.ERR_CANCEL_INVITATION(payload.email),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_REMOVE_MEMBER:
      self._state.error = {
        key: AppConstants.api.FAILED_REMOVE_MEMBER,
        groupId: payload.groupId,
        memberId: payload.memberId,
        message: userMessages.ERR_REMOVE_MEMBER(payload.memberId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_SET_MEMBER_PERMISSIONS:
      self._state.error = {
        key: AppConstants.api.FAILED_SET_MEMBER_PERMISSIONS,
        groupId: payload.groupId,
        memberId: payload.memberId,
        permissions: payload.permissions,
        message: userMessages.ERR_SET_MEMBER_PERMISSIONS(payload.memberId),
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_REQUEST_PASSWORD_RESET:
      self._state.error = {
        key: AppConstants.api.FAILED_REQUEST_PASSWORD_RESET,
        email: payload.email,
        message: userMessages.ERR_REQUEST_PASSWORD_RESET,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CONFIRM_PASSWORD_RESET:
      // Don't handle globally "bad token or email" errors
      if (payload.error && payload.error.status === 500) {
        self._state.error = {
          key: AppConstants.api.FAILED_CONFIRM_PASSWORD_RESET,
          payload: payload.payload,
          message: userMessages.ERR_CONFIRM_PASSWORD_RESET,
          original: payload.error
        };
      }
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      self.reset();
      break;

    default:
      // Do nothing
  }

});

module.exports = ApiErrorStore;
