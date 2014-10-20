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

var log = require('bows')('MessageThreadActions');

var MessageThreadActions = {

  fetch: function(threadId) {
    AppDispatcher.dispatch({
      type: AppConstants.api.STARTED_GET_MESSAGE_THREAD,
      threadId: threadId
    });

    api.team.getMessageThread(threadId, function(err, messages) {
      if (err) {
        return AppDispatcher.dispatch({
          type: AppConstants.api.FAILED_GET_MESSAGE_THREAD,
          threadId: threadId,
          error: err
        });
      }

      log('Fetched message thread with ' + messages.length + ' messages');

      AppDispatcher.dispatch({
        type: AppConstants.api.COMPLETED_GET_MESSAGE_THREAD,
        threadId: threadId,
        messages: messages
      });
    });
  }

};

module.exports = MessageThreadActions;
