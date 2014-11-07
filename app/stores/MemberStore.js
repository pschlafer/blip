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
var UserStore = require('./UserStore');
var utils = require('../core/utils');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    membersByGroupId: {}
  };
};

var MemberStore = _.assign({}, EventEmitter.prototype, {

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

  getForGroup: function(groupId) {
    return _.map(this._state.membersByGroupId[groupId],
    function(permissions, memberId) {
      var member = _.cloneDeep(UserStore.get(memberId)) || {};
      member.permissions = permissions;
      return member;
    });
  },

  isFetchingForGroup: function(groupId) {
    return Boolean(utils.getIn(this._state.requests, [groupId, 'fetching']));
  },

  isRemoving: function() {
    return Boolean(this._state.requests.removing);
  },

  isSettingPermissions: function() {
    return Boolean(this._state.requests.settingPermissions);
  }

});

MemberStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = MemberStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_GET_GROUP:
      self._state.requests[payload.groupId] = {fetching: true};
      self.emitChange();
      break;

    case AppConstants.api.FAILED_GET_GROUP:
      self._state.requests[payload.groupId] = {fetching: false};
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_GROUP:
      AppDispatcher.waitFor([UserStore.dispatchToken]);
      var group = payload.group;
      self._state.requests[group.userid] = {fetching: false};
      self._state.membersByGroupId[group.userid] =
        _.reduce(group.team, function(acc, member) {
          acc[member.userid] = _.cloneDeep(member.permissions);
          return acc;
        }, {});
      self.emitChange();
      break;

    case AppConstants.api.STARTED_REMOVE_MEMBER:
      self._state.requests.removing = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_REMOVE_MEMBER:
      self._state.requests.removing = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_REMOVE_MEMBER:
      self._state.requests.removing = false;
      self._state.membersByGroupId[payload.groupId] =
        _.omit(self._state.membersByGroupId[payload.groupId], payload.memberId);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_SET_MEMBER_PERMISSIONS:
      self._state.requests.settingPermissions = true;
      self.emitChange();
      break;

    case AppConstants.api.FAILED_SET_MEMBER_PERMISSIONS:
      self._state.requests.settingPermissions = false;
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_SET_MEMBER_PERMISSIONS:
      self._state.requests.settingPermissions = false;
      self._state.membersByGroupId[payload.groupId][payload.memberId] =
        _.cloneDeep(payload.permissions);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      self.reset();
      break;

    default:
      // Do nothing
  }

});

module.exports = MemberStore;
