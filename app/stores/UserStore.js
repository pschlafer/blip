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
var AuthStore = require('./AuthStore');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    usersById: {}
  };
};

var UserStore = merge(EventEmitter.prototype, {

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

  get: function(userId) {
    return this._state.usersById[userId];
  },

  _updateWithUser: function(user) {
    this._state.usersById[user.userid] = {
      userid: user.userid,
      profile: _.cloneDeep(user.profile)
    };
  },

  _updateWithGroup: function(group) {
    this._updateWithUser(group);
    if (group.team) {
      var self = this;
      _.forEach(group.team, function(member) {
        self._updateWithUser(member);
      });
    }
  }

});

UserStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = UserStore;
  switch(payload.type) {

    case AppConstants.api.COMPLETED_GET_GROUPS:
      _.forEach(payload.groups, function(group) {
        self._updateWithGroup(group);
      });
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_GROUP:
      self._updateWithGroup(payload.group);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_CREATE_GROUP:
      self._updateWithGroup(payload.group);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_UPDATE_GROUP:
      // Optimistic update
      self._updateWithGroup(payload.group);
      self.emitChange();
      break;

    case AppConstants.api.STARTED_UPDATE_USER:
      // Optimistic update
      AppDispatcher.waitFor([AuthStore.dispatchToken]);
      self._updateWithUser(AuthStore.getLoggedInUser());
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

module.exports = UserStore;
