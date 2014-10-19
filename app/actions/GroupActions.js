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
var api = require('../core/api');

var GroupActions = {

  fetchAll: function() {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_GET_GROUPS});
    api.patient.getAll(function(err, groups) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_GET_GROUPS,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_GET_GROUPS,
        groups: groups
      });
    });
  },

  fetch: function(groupId) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_GET_GROUP,
      groupId: groupId
    });
    api.patient.get(groupId, function(err, group) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_GET_GROUP,
          groupId: groupId,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_GET_GROUP,
        group: group
      });
    });
  }

};

module.exports = GroupActions;
