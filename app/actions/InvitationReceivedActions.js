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

var InvitationReceivedActions = {

  fetchAll: function() {
    AppDispatcher.dispatch({type: AppConstants.api.STARTED_FETCH_INVITATIONS_RECEIVED});
    api.invitation.getReceived(function(err, invitations) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_FETCH_INVITATIONS_RECEIVED,
          error: err
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_FETCH_INVITATIONS_RECEIVED,
        invitations: invitations
      });
    });
  },

  accept: function(invitation) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_ACCEPT_INVITATION,
      invitation: invitation
    });

    api.invitation.accept(invitation.key, invitation.creator.userid,
    function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_ACCEPT_INVITATION,
          error: err,
          invitation: invitation
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_ACCEPT_INVITATION,
        invitation: invitation
      });
    });
  },

  dismiss: function(invitation) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_DISMISS_INVITATION,
      invitation: invitation
    });

    api.invitation.dismiss(invitation.key, invitation.creator.userid,
    function(err) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_DISMISS_INVITATION,
          error: err,
          invitation: invitation
        });
      }

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_DISMISS_INVITATION,
        invitation: invitation
      });
    });
  }

};

module.exports = InvitationReceivedActions;
