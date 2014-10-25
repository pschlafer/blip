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

var Notification = require('../notification');

var AuthActions = require('../../actions/AuthActions');
var RequestActions = require('../../actions/RequestActions');
var RequestStore = require('../../stores/RequestStore');
var LogActions = require('../../actions/LogActions');

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
  },

  componentWillUnmount: function() {
    RequestStore.removeChangeListener(this.handleStoreChange);
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
    var message;

    if (!error) {
      return null;
    }

    message = error.message;
    error = error.original;

    var self = this;
    var status = error.status;
    var originalErrorMessage = [
      message, this.stringifyApiError(error)
    ].join(' ');

    var type = 'error';
    var body = (
      <p>
        {'Sorry! Something went wrong. '}
        {'It\'s our fault, not yours. We\'re going to go investigate. '}
        {'For the time being, go ahead and '}
        <a href="/">refresh your browser</a>
        {'.'}
      </p>
    );
    var isDismissable = true;

    if (status === 401) {
      var handleLogBackIn = function(e) {
        e.preventDefault();
        self.closeNotification();
        // We don't actually go through logout process,
        // so safer to manually destroy local session
        AuthActions.destroySession();
        self.transitionTo('/login');
      };

      type = 'alert';
      originalErrorMessage = null;
      body = (
        <p>
          {'To keep your data safe we logged you out. '}
          <a
            href=""
            onClick={handleLogBackIn}>Click here to log back in</a>
          {'.'}
        </p>
      );
      isDismissable = false;
    }
    else if (!_.isEmpty(originalErrorMessage) && status !== 401) {
      body = (
        <div>
          {body}
          <p className="notification-body-small">
            <code>{'Original error message: ' + originalErrorMessage}</code>
          </p>
        </div>
      );
    }

    // Send error to backend tracking
    LogActions.logError(this.stringifyApiError(error), message);

    return {
      type: type,
      body: body,
      isDismissable: isDismissable
    };
  },

  stringifyApiError: function(error) {
    if (_.isPlainObject(error)) {
      return JSON.stringify(error);
    }
    else {
      return error.toString();
    }
  },

  closeNotification: function() {
    RequestActions.dismissError();
  }
});

module.exports = ApiError;
