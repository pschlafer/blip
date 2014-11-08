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
var utils = require('../core/utils');
var nurseShark = require('tideline/plugins/nurseshark');
var TidelineData = require('tideline/js/tidelinedata');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    tidelineDataByGroupId: {}
  };
};

var TidelineDataStore = _.assign({}, EventEmitter.prototype, {

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
    return this._state.tidelineDataByGroupId[groupId];
  },

  isFetchingForGroup: function(groupId) {
    return Boolean(utils.getIn(this._state.requests, [groupId, 'fetching']));
  },

  _preprocessHealthData: function(healthData) {
    if (!(healthData && healthData.length >= 0)) {
      return null;
    }

    var res = nurseShark.processData(healthData);
    var tidelineData = new TidelineData(res.processedData);

    window.tidelineData = tidelineData;
    window.downloadProcessedData = function() {
      console.save(res.processedData);
    };

    return tidelineData;
  }

});

TidelineDataStore.dispatchToken = AppDispatcher.register(function(payload) {
  var self = TidelineDataStore;
  switch(payload.type) {

    case AppConstants.api.STARTED_FETCH_HEALTH_DATA:
      self._state.requests[payload.groupId] = {fetching: true};
      self.emitChange();
      break;

    case AppConstants.api.FAILED_FETCH_HEALTH_DATA:
      self._state.requests[payload.groupId] = {fetching: false};
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_FETCH_HEALTH_DATA:
      self._state.requests[payload.groupId] = {fetching: false};
      self._state.tidelineDataByGroupId[payload.groupId] =
        self._preprocessHealthData(payload.healthData);
      self.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      self.reset();
      break;

    default:
      // Do nothing
  }

});

module.exports = TidelineDataStore;
