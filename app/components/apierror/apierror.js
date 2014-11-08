/** @jsx React.DOM */
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
var React = require('react');
var Navigation = require('react-router').Navigation;

var utils = require('../../core/utils');
var Notification = require('../notification');
var userMessages = require('../../userMessages');

var AuthActions = require('../../actions/AuthActions');
var RequestActions = require('../../actions/RequestActions');
var RequestStore = require('../../stores/RequestStore');
var LogActions = require('../../actions/LogActions');
var deferAction = require('../../actions/deferAction');

var api = require('../../core/api');

var ApiError = React.createClass({
  mixins: [Navigation],

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return {
      error: RequestStore.getError()
    };
  },

  componentDidMount: function() {
    RequestStore.addChangeListener(this.handleStoreChange);
    this.logErrorIfAny();
    this.logoutIfNeeded();
  },

  componentDidUpdate: function() {
    this.logErrorIfAny();
    this.logoutIfNeeded();
  },

  componentWillUnmount: function() {
    RequestStore.removeChangeListener(this.handleStoreChange);
  },

  logErrorIfAny: function() {
    var error = this.state.error;

    if (!error) {
      return;
    }

    var properties = {
      details: this.stringifyErrorData(utils.buildExceptionDetails())
    };
    // Send error to backend tracking
    // NOTE: can't use an "action" for this, or else we'll get a
    // "can't dispatch in the middle of a dispatch" error
    api.errors.log(
      this.stringifyErrorData(error.original),
      error.message,
      properties
    );
  },

  logoutIfNeeded: function() {
    var error = this.state.error;

    if (!error) {
      return;
    }

    var originalError = error.original || {};
    if (originalError.status === 401) {
      var self = this;
      // NOTE: We are reacting to a store change and are going to call actions
      // Make sure to let current Flux cycle finish before
      deferAction(function() {
        RequestActions.dismissError();
        self.transitionTo('/logout');
        // Maybe we should allow logout even if there is no or an expired token
        // so we don't have to "manually" destroy the session like this
        AuthActions.destroySession();
      });
    }
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var notification = this.notificationFromError();
    var handleClose;

    if (notification) {
      if (notification.isDismissable) {
        handleClose = this.closeNotification;
      }

      return (
        <Notification
          type={notification.type}
          onClose={handleClose}>
          {notification.body}
        </Notification>
      );
    }

    return null;
  },

  notificationFromError: function() {
    var error = this.state.error;

    if (!error) {
      return null;
    }

    var originalError = error.original;
    var status = originalError.status;
    var message = error.message;
    var properties = {
      details: this.stringifyErrorData(utils.buildExceptionDetails())
    };

    if (status === 401) {
      return;
    }

    var body;
    if (status === 500) {
      // Something is down, ask to try again
      body = <p>{userMessages.ERR_SERVICE_DOWN}</p>;
    }
    else if (status === 503) {
      // Offline, nothing is going to work
      body = <p>{userMessages.ERR_OFFLINE}</p>;
    }
    else {
      var originalErrorMessage = [
        message, this.stringifyErrorData(originalError)
      ].join(' ');

      body = (
        <div>
          <p>
            {userMessages.ERR_GENERIC}
            <a href="/">refresh your browser</a>
            {'.'}
          </p>
          <p className="notification-body-small">
            <code>{'Original error message: ' + originalErrorMessage}</code>
          </p>
        </div>
      );
    }

    return {
      type: 'error',
      body: body,
      isDismissable: true
    };
  },

  stringifyErrorData: function(data) {
    if(_.isEmpty(data)){
      return '';
    }
    if (_.isPlainObject(data)) {
      return JSON.stringify(data);
    }
    else {
      return data.toString();
    }
  },

  closeNotification: function() {
    RequestActions.dismissError();
  }
});

module.exports = ApiError;
