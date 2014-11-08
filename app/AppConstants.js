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

var keyMirror = require('keymirror');

var AppConstants = {

  ui: keyMirror({
    DISMISSED_BROWSER_WARNING: null,
    ACCEPTED_TERMS: null,
    HID_WELCOME_SETUP: null,
    DISMISSED_REQUEST_ERROR: null
  }),

  api: keyMirror({
    STARTED_LOAD_SESSION: null,
    COMPLETED_LOAD_SESSION: null,
    FAILED_LOAD_SESSION: null,

    STARTED_LOGIN: null,
    COMPLETED_LOGIN: null,
    FAILED_LOGIN: null,

    STARTED_SIGNUP: null,
    COMPLETED_SIGNUP: null,
    FAILED_SIGNUP: null,

    STARTED_LOGOUT: null,
    COMPLETED_LOGOUT: null,
    FAILED_LOGOUT: null,

    STARTED_UPDATE_USER: null,
    COMPLETED_UPDATE_USER: null,
    FAILED_UPDATE_USER: null,

    STARTED_GET_GROUPS: null,
    COMPLETED_GET_GROUPS: null,
    FAILED_GET_GROUPS: null,

    STARTED_GET_GROUP: null,
    COMPLETED_GET_GROUP: null,
    FAILED_GET_GROUP: null,

    STARTED_CREATE_GROUP: null,
    COMPLETED_CREATE_GROUP: null,
    FAILED_CREATE_GROUP: null,

    STARTED_UPDATE_GROUP: null,
    COMPLETED_UPDATE_GROUP: null,
    FAILED_UPDATE_GROUP: null,

    STARTED_LEAVE_GROUP: null,
    COMPLETED_LEAVE_GROUP: null,
    FAILED_LEAVE_GROUP: null,

    STARTED_GET_INVITATIONS_RECEIVED: null,
    COMPLETED_GET_INVITATIONS_RECEIVED: null,
    FAILED_GET_INVITATIONS_RECEIVED: null,

    STARTED_GET_INVITATIONS_SENT: null,
    COMPLETED_GET_INVITATIONS_SENT: null,
    FAILED_GET_INVITATIONS_SENT: null,

    STARTED_GET_HEALTH_DATA: null,
    COMPLETED_GET_HEALTH_DATA: null,
    FAILED_GET_HEALTH_DATA: null,

    STARTED_GET_MESSAGE_THREAD: null,
    COMPLETED_GET_MESSAGE_THREAD: null,
    FAILED_GET_MESSAGE_THREAD: null,

    STARTED_CREATE_MESSAGE_THREAD: null,
    COMPLETED_CREATE_MESSAGE_THREAD: null,
    FAILED_CREATE_MESSAGE_THREAD: null,

    STARTED_ADD_COMMENT: null,
    COMPLETED_ADD_COMMENT: null,
    FAILED_ADD_COMMENT: null,

    STARTED_EDIT_MESSAGE: null,
    COMPLETED_EDIT_MESSAGE: null,
    FAILED_EDIT_MESSAGE: null,

    STARTED_ACCEPT_INVITATION: null,
    COMPLETED_ACCEPT_INVITATION: null,
    FAILED_ACCEPT_INVITATION: null,

    STARTED_DISMISS_INVITATION: null,
    COMPLETED_DISMISS_INVITATION: null,
    FAILED_DISMISS_INVITATION: null,

    STARTED_SEND_INVITATION: null,
    COMPLETED_SEND_INVITATION: null,
    FAILED_SEND_INVITATION: null,

    STARTED_CANCEL_INVITATION: null,
    COMPLETED_CANCEL_INVITATION: null,
    FAILED_CANCEL_INVITATION: null,

    STARTED_REMOVE_MEMBER: null,
    COMPLETED_REMOVE_MEMBER: null,
    FAILED_REMOVE_MEMBER: null,

    STARTED_SET_MEMBER_PERMISSIONS: null,
    COMPLETED_SET_MEMBER_PERMISSIONS: null,
    FAILED_SET_MEMBER_PERMISSIONS: null
  })

};

module.exports = AppConstants;
