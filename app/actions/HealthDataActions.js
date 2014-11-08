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

var async = require('async');
var AppDispatcher = require('../AppDispatcher');
var AppConstants = require('../AppConstants');
var api = require('../core/api');

var log = require('bows')('HealthDataActions');

var HealthDataActions = {

  fetchForGroup: function(groupId) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_FETCH_HEALTH_DATA,
      groupId: groupId
    });

    async.parallel({
      deviceData: api.patientData.get.bind(null, groupId),
      notes: api.team.getNotes.bind(null, groupId)
    },
    function(err, results) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_FETCH_HEALTH_DATA,
          groupId: groupId,
          error: err
        });
      }

      var deviceData = results.deviceData || [];
      var notes = results.notes || [];

      log('Patient device data count', deviceData.length);
      log('Team notes count', notes.length);

      var healthData = deviceData.concat(notes);
      window.downloadInputData = function() {
        console.save(healthData, 'blip-input.json');
      };

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_FETCH_HEALTH_DATA,
        groupId: groupId,
        healthData: healthData
      });
    });
  }

};

module.exports = HealthDataActions;
