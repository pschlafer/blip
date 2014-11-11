/*
== BSD2 LICENSE ==
Copyright (c) 2014, Tidepool Project

This program is free software; you can redistribute it and/or modify it under
the terms of the associated License, which is identical to the BSD 2-Clause
License as published by the Open Source Initiative at opensource.org.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the License for more details.

You should have received a copy of the License along with this program; if
not, you can obtain one from Tidepool Project at tidepool.org.
== BSD2 LICENSE ==
*/

'use strict';

module.exports = {

  ERR_LOGIN: 'Something went wrong while logging in',
  ERR_SIGNUP: 'Something went wrong while signing up',
  ERR_LOGOUT: 'Something went wrong while logging out',
  ERR_UPDATE_USER: 'Something went wrong while updating user',
  ERR_GET_GROUPS: 'Something went wrong while trying to fetch groups user has access to',
  ERR_GET_GROUP: function(groupId) { return 'Something went wrong while trying to fetch group ' + groupId; },
  ERR_CREATE_GROUP: 'Something went wrong while trying to create group',
  ERR_UPDATE_GROUP: function(groupId) { return 'Something went wrong while trying to update group ' + groupId; },
  ERR_LEAVE_GROUP: function(groupId) { return 'Something went wrong while trying to leave group ' + groupId; },
  ERR_GET_INVITATIONS_RECEIVED: 'Something went wrong while trying to fetch received invitations',
  ERR_GET_INVITATIONS_SENT: function(groupId) { return 'Something went wrong while trying to fetch sent invitations for group ' + groupId; },
  ERR_GET_HEALTH_DATA: function(groupId) { return 'Something went wrong while trying to fetch health data for group ' + groupId; },
  ERR_GET_MESSAGE_THREAD: function(threadId) { return 'Something went wrong while trying to fetch message thread ' + threadId; },
  ERR_CREATE_MESSAGE_THREAD: 'Something went wrong while trying to create message thread',
  ERR_ADD_COMMENT: function(threadId) { return 'Something went wrong while trying to comment on message thread ' + threadId; },
  ERR_EDIT_MESSAGE: function(messageId) { return 'Something went wrong while trying to edit message ' + messageId; },
  ERR_ACCEPT_INVITATION: function(creatorId) { return 'Something went wrong while trying to accept invitation from user ' + creatorId; },
  ERR_DISMISS_INVITATION: function(creatorId) { return 'Something went wrong while trying to dismiss invitation from user ' + creatorId; },
  ERR_SEND_INVITATION: function(email) { return 'Something went wrong while signing sending invitation to ' + email; },
  ERR_CANCEL_INVITATION: function(email) { return 'Something went wrong while trying to cancel invitation to ' + email; },
  ERR_REMOVE_MEMBER: function(memberId) { return 'Something went wrong while trying to remove member ' + memberId; },
  ERR_SET_MEMBER_PERMISSIONS: function(memberId) { return 'Something went wrong while trying to set permissions for member ' + memberId; },
  ERR_REQUEST_PASSWORD_RESET: 'Something went wrong while requesting password reset',
  ERR_CONFIRM_PASSWORD_RESET: 'Something went wrong while confirming password reset',

  ERR_GENERIC : 'Sorry! Something went wrong. It\'s our fault, not yours. We\'re going to go investigate. For the time being, go ahead and ',
  ERR_SERVICE_DOWN : 'Sorry! Something went wrong. It\'s our fault, not yours. We\'re going to go investigate. Please try again in a few moments.',
  ERR_OFFLINE : 'Sorry but it appears that you are offline.'

};
