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

var config = require('../../config');

var LoginNav = require('../../components/loginnav');
var LoginLogo = require('../../components/loginlogo');
var SimpleForm = require('../../components/simpleform');
var MailTo = require('../../components/mailto');

var AuthActions = require('../../actions/AuthActions');
var AuthStore = require('../../stores/AuthStore');

var Login = React.createClass({
  propTypes: {
    inviteEmail: React.PropTypes.string,
    onLoginSuccess: React.PropTypes.func.isRequired,
    trackMetric: React.PropTypes.func.isRequired
  },

  formInputs: function() {
    return [
      {name: 'username', label: 'Email', type: 'email', disabled: !!this.props.inviteEmail},
      {name: 'password', label: 'Password', type: 'password'},
      {name: 'remember', label: 'Remember me', type: 'checkbox'}
    ];
  },

  getInitialState: function() {
    var formValues = {};

    if (this.props.inviteEmail) {
      formValues.username = this.props.inviteEmail;
    }

    return _.assign({
      formValues: formValues,
      validationErrors: {},
      notification: null
    }, this.getInitialStateFromStores());
  },

  getInitialStateFromStores: function() {
    return {
      working: AuthStore.isLoggingIn(),
    };
  },

  getStateFromStores: function() {
    var state = this.getInitialStateFromStores();
    var loginError = AuthStore.getLoginError();
    if (loginError) {
      var message = 'An error occured while logging in.';
      if (loginError.status === 401) {
        message = 'Wrong username or password.';
      }

      state.notification = {
        type: 'error',
        message: message
      };
    }
    else {
      state.notification = null;
    }
    return state;
  },

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    if (AuthStore.isAuthenticated()) {
      return this.props.onLoginSuccess();
    }
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var form = this.renderForm();
    var forgotPassword = this.renderPasswordMailTo();
    var inviteIntro = this.renderInviteIntroduction();

    /* jshint ignore:start */
    return (
      <div className="login">
        <LoginNav
          page="login"
          inviteEmail={this.props.inviteEmail}
          trackMetric={this.props.trackMetric} />
        <LoginLogo />
        {inviteIntro}
        <div className="container-small-outer login-form">
          <div className="container-small-inner login-form-box">
            <div className="login-simpleform">{form}</div>
            <div className="login-mailto">{forgotPassword}</div>
          </div>
        </div>
      </div>
    );
    /* jshint ignore:end */
  },

  renderInviteIntroduction: function() {
    if (!this.props.inviteEmail) {
      return null;
    }

    return (
      <div className='login-inviteIntro'>
        <p>{'You\'ve been invited to Blip.'}</p><p>{'Log in to view the invitation.'}</p>
      </div>
    );
  },

  renderForm: function() {
    var submitButtonText = this.state.working ? 'Logging in...' : 'Log in';

    /* jshint ignore:start */
    return (
      <SimpleForm
        inputs={this.formInputs()}
        formValues={this.state.formValues}
        validationErrors={this.state.validationErrors}
        submitButtonText={submitButtonText}
        submitDisabled={this.state.working}
        onSubmit={this.handleSubmit}
        notification={this.state.notification}/>
    );
    /* jshint ignore:end */
  },

  logPasswordReset : function() {
    this.props.trackMetric('Clicked Forgot Password');
  },

  renderPasswordMailTo: function() {

    var title = 'I forgot my password';

    /* jshint ignore:start */
    return (
      <MailTo
        linkTitle={title}
        emailAddress={'support@tidepool.org'}
        emailSubject={title}
        onLinkClicked={this.logPasswordReset}/>
    );
    /* jshint ignore:end */
  },

  handleSubmit: function(formValues) {
    var self = this;

    if (this.state.working) {
      return;
    }

    this.resetFormStateBeforeSubmit(formValues);

    var validationErrors = this.validateFormValues(formValues);
    if (!_.isEmpty(validationErrors)) {
      return;
    }

    formValues = this.prepareFormValuesForSubmit(formValues);

    this.submitFormValues(formValues);
  },

  resetFormStateBeforeSubmit: function(formValues) {
    this.setState({
      working: true,
      formValues: formValues,
      validationErrors: {},
      notification: null
    });
  },

  validateFormValues: function(formValues) {
    var validationErrors = {};
    var IS_REQUIRED = 'This field is required.';

    if (!formValues.username) {
      validationErrors.username = IS_REQUIRED;
    }

    if (!formValues.password) {
      validationErrors.password = IS_REQUIRED;
    }

    if (!_.isEmpty(validationErrors)) {
      this.setState({
        working: false,
        validationErrors: validationErrors,
        notification: {
          type: 'error',
          message:'Some entries are invalid.'
        }
      });
    }

    return validationErrors;
  },

  prepareFormValuesForSubmit: function(formValues) {
    return {
      credentials: {
        username: formValues.username,
        password: formValues.password
      },
      options: {
        remember: formValues.remember
      }
    };
  },

  submitFormValues: function(formValues) {
    AuthActions.login(formValues.credentials, formValues.options);
  }
});

module.exports = Login;
