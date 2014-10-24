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
var AuthStore = require('../stores/AuthStore');

var MemberActions = {

  remove: function(memberId) {
    // NOTE: Currently we only support managing members for logged-in user
    // will change when "child account" feature is implemented
    var groupId = AuthStore.getLoggedInUserId();

    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_REMOVE_MEMBER,
      groupId: groupId,
      memberId: memberId
    });

    api.access.removeMember(memberId, function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_REMOVE_MEMBER,
          groupId: groupId,
          memberId: memberId,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_REMOVE_MEMBER,
        groupId: groupId,
        memberId: memberId
      });
    });
  },

  setPermissions: function(memberId, permissions) {
    var groupId = AuthStore.getLoggedInUserId();

    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_SET_MEMBER_PERMISSIONS,
      groupId: groupId,
      memberId: memberId,
      permissions: permissions
    });

    api.access.setMemberPermissions(memberId, permissions, function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_SET_MEMBER_PERMISSIONS,
          groupId: groupId,
          memberId: memberId,
          permissions: permissions,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_SET_MEMBER_PERMISSIONS,
        groupId: groupId,
        memberId: memberId,
        permissions: permissions
      });
    });
  }

};

module.exports = MemberActions;
