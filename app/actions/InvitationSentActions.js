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

var InvitationSentActions = {

  fetchForGroup: function() {
    // NOTE: Currently we only support fetching for logged-in user
    // will change when "child account" feature is implemented
    var groupId = AuthStore.getLoggedInUserId();

    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_FETCH_INVITATIONS_SENT,
      groupId: groupId
    });

    api.invitation.getSent(function(err, invitations) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_FETCH_INVITATIONS_SENT,
          groupId: groupId,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_FETCH_INVITATIONS_SENT,
        groupId: groupId,
        invitations: invitations
      });
    });
  },

  send: function(email, permissions) {
    var groupId = AuthStore.getLoggedInUserId();

    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_SEND_INVITATION,
      groupId: groupId,
      email: email,
      permissions: permissions
    });

    api.invitation.send(email, permissions, function(err, invitation) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_SEND_INVITATION,
          groupId: groupId,
          email: email,
          permissions: permissions,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_SEND_INVITATION,
        groupId: groupId,
        invitation: invitation
      });
    });
  },

  cancel: function(email) {
    var groupId = AuthStore.getLoggedInUserId();

    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_CANCEL_INVITATION,
      groupId: groupId,
      email: email
    });

    api.invitation.cancel(email, function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_CANCEL_INVITATION,
          groupId: groupId,
          email: email,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_CANCEL_INVITATION,
        groupId: groupId,
        email: email
      });
    });
  }

};

module.exports = InvitationSentActions;
