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
var UserStore = require('./UserStore');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    permissionsByGroupId: {}
  };
};

var GroupStore = merge(EventEmitter.prototype, {

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

  getAll: function() {
    return _.map(this._state.permissionsByGroupId, function(perms, groupId) {
      var user = _.cloneDeep(UserStore.get(groupId));
      user.permissions = _.cloneDeep(perms);
      return user;
    });
  },

  isFetchingAll: function() {
    return Boolean(this._state.requests.fetchingAll);
  }

});

GroupStore.dispatchToken = AppDispatcher.register(function(payload) {
  switch(payload.type) {

    case AppConstants.api.STARTED_GET_GROUPS:
      GroupStore._state.requests.fetchingAll = true;
      GroupStore.emitChange();
      break;

    case AppConstants.api.FAILED_GET_GROUPS:
      GroupStore._state.requests.fetchingAll = false;
      GroupStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_GROUPS:
      AppDispatcher.waitFor([UserStore.dispatchToken]);
      GroupStore._state.requests.fetchingAll = false;
      GroupStore._state.permissionsByGroupId = _.reduce(payload.groups,
      function(acc, group) {
        acc[group.userid] = _.cloneDeep(group.permissions);
        return acc;
      }, {});
      GroupStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      GroupStore.reset();
      GroupStore.emitChange();
      break;

    default:
      // Do nothing
  }

});

module.exports = GroupStore;
