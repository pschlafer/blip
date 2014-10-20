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
var nurseShark = require('tideline/plugins/nurseshark');
var TidelineData = require('tideline/js/tidelinedata');

var CHANGE_EVENT = 'change';

var getInitialState = function() {
  return {
    requests: {},
    tidelineDataByGroupId: {}
  };
};

var TidelineDataStore = merge(EventEmitter.prototype, {

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
  switch(payload.type) {

    case AppConstants.api.STARTED_GET_HEALTH_DATA:
      TidelineDataStore._state.requests[payload.groupId] = true;
      TidelineDataStore.emitChange();
      break;

    case AppConstants.api.FAILED_GET_HEALTH_DATA:
      TidelineDataStore._state.requests[payload.groupId] = false;
      TidelineDataStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_GET_HEALTH_DATA:
      TidelineDataStore._state.requests[payload.groupId] = false;
      TidelineDataStore._state.tidelineDataByGroupId[payload.groupId] =
        TidelineDataStore._preprocessHealthData(payload.healthData);
      TidelineDataStore.emitChange();
      break;

    case AppConstants.api.COMPLETED_LOGOUT:
      TidelineDataStore.reset();
      TidelineDataStore.emitChange();
      break;

    default:
      // Do nothing
  }

});

module.exports = TidelineDataStore;
