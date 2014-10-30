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

var React = require('react');
var _ = require('lodash');
var Navigation = require('react-router').Navigation;

var LogoutOverlay = require('../../components/logoutoverlay');

var AuthActions = require('../../actions/AuthActions');
var AuthStore = require('../../stores/AuthStore');
var LogActions = require('../../actions/LogActions');

var Logout = React.createClass({
  mixins: [Navigation],

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);

    if (AuthStore.isAuthenticated()) {
      AuthActions.logout();
    }
    else {
      this.handleLogoutSuccess();
    }
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    if (!AuthStore.isAuthenticated()) {
      return this.handleLogoutSuccess();
    }
  },

  handleLogoutSuccess: function() {
    this.transitionTo('/login');
    LogActions.trackMetric('Logged Out');
  },

  render: function() {
    return <LogoutOverlay />;
  }
});

module.exports = Logout;
