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

var AppDispatcher = require('../AppDispatcher');
var AppConstants = require('../AppConstants');
var EventEmitter = require('events').EventEmitter;
var merge = require('react/lib/merge');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    error: null
  };
};

var RequestStore = merge(EventEmitter.prototype, {

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

RequestStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = RequestStore;
  switch(payload.type) {

    case AppConstants.request.DISMISSED_REQUEST_ERROR:
      self._state.error = null;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGIN:
      // Don't handle wrong credentials globally
      if (payload.error && payload.error.status !== 401) {
        self._state.error = {
          key: AppConstants.api.FAILED_LOGIN,
          message: 'Something went wrong while logging in',
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
          message: 'Something went wrong while signing up',
          original: payload.error
        };
      }
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LOGOUT:
      self._state.error = {
        key: AppConstants.api.FAILED_LOGOUT,
        message: 'Something went wrong while logging out',
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_UPDATE_USER:
      self._state.error = {
        key: AppConstants.api.FAILED_UPDATE_USER,
        message: 'Something went wrong while updating user',
        original: payload.error,
        user: payload.user
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_GROUPS:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_GROUPS,
        message: 'Something went wrong while trying to fetch groups user has access to',
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_GROUP,
        groupId: payload.groupId,
        message: 'Something went wrong while trying to fetch group ' + payload.groupId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CREATE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_CREATE_GROUP,
        message: 'Something went wrong while trying to create group',
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_UPDATE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_UPDATE_GROUP,
        groupId: payload.group.userid,
        message: 'Something went wrong while trying to update group ' + payload.groupId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_LEAVE_GROUP:
      self._state.error = {
        key: AppConstants.api.FAILED_LEAVE_GROUP,
        groupId: payload.groupId,
        message: 'Something went wrong while trying to leave group ' + payload.groupId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_INVITATIONS_RECEIVED:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_INVITATIONS_RECEIVED,
        message: 'Something went wrong while trying to fetch received invitations',
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_INVITATIONS_SENT:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_INVITATIONS_SENT,
        groupId: payload.groupId,
        message: 'Something went wrong while trying to fetch sent invitations for group ' + payload.groupId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_HEALTH_DATA:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_HEALTH_DATA,
        groupId: payload.groupId,
        message: 'Something went wrong while trying to fetch health data for group ' + payload.groupId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_MESSAGE_THREAD:
      self._state.error = {
        key: AppConstants.api.FAILED_GET_MESSAGE_THREAD,
        threadId: payload.threadId,
        message: 'Something went wrong while trying to fetch message thread ' + payload.threadId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_CREATE_MESSAGE_THREAD:
      self._state.error = {
        key: AppConstants.api.FAILED_CREATE_MESSAGE_THREAD,
        message: 'Something went wrong while trying to create message thread',
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_ADD_COMMENT:
      self._state.error = {
        key: AppConstants.api.FAILED_ADD_COMMENT,
        threadId: payload.threadId,
        message: 'Something went wrong while trying to comment on message thread ' + payload.threadId,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_EDIT_MESSAGE:
      self._state.error = {
        key: AppConstants.api.FAILED_EDIT_MESSAGE,
        messageId: payload.message.id,
        message: 'Something went wrong while trying to edit message ' + payload.message.id,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_ACCEPT_INVITATION:
      self._state.error = {
        key: AppConstants.api.FAILED_ACCEPT_INVITATION,
        invitation: payload.invitation,
        message: 'Something went wrong while trying to accept invitation from user ' + payload.invitation.creator.userid,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_DISMISS_INVITATION:
      self._state.error = {
        key: AppConstants.api.FAILED_DISMISS_INVITATION,
        invitation: payload.invitation,
        message: 'Something went wrong while trying to dismiss invitation from user ' + payload.invitation.creator.userid,
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
          message: 'Something went wrong while signing sending invitation to ' + payload.email,
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
        message: 'Something went wrong while trying to cancel invitation to ' + payload.email,
        original: payload.error
      };
      self.emitChange();
      break;

    case AppConstants.api.FAILED_REMOVE_MEMBER:
      self._state.error = {
        key: AppConstants.api.FAILED_REMOVE_MEMBER,
        groupId: payload.groupId,
        memberId: payload.memberId,
        message: 'Something went wrong while trying to remove member ' + payload.memberId,
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
        message: 'Something went wrong while trying to set permissions for member ' + payload.memberId,
        original: payload.error
      };
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

module.exports = RequestStore;
