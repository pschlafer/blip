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

var utils = require('../../core/utils');
var personUtils = require('../../core/personutils');
var SimpleForm = require('../../components/simpleform');
var PeopleList = require('../../components/peoplelist');
var PersonCard = require('../../components/personcard');

var AuthenticatedRoute = require('../../core/AuthenticatedRoute');

var AuthActions = require('../../actions/AuthActions');
var AuthStore = require('../../stores/AuthStore');
var LogActions = require('../../actions/LogActions');

var Profile = React.createClass({
  formInputs: [
    {name: 'fullName', label: 'Full name'},
    {name: 'username', label: 'Email', type: 'email'},
    {name: 'password', label: 'Password', type: 'password', placeholder: '******'},
    {name: 'passwordConfirm', label: 'Confirm password', type: 'password', placeholder: '******'}
  ],

  mixins: [AuthenticatedRoute],

  MESSAGE_TIMEOUT: 2000,

  getInitialState: function() {
    return _.assign({
      validationErrors: {},
      notification: null
    }, this.getStateFromStores());
  },

  getStateFromStores: function() {
    return {
      formValues: this.formValuesFromUser(AuthStore.getLoggedInUser())
    };
  },

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);

    LogActions.trackMetric('Viewed Account Edit');
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
    clearTimeout(this.messageTimeoutId);
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  formValuesFromUser: function(user) {
    if (!user) {
      return {};
    }

    return {
      fullName: user.profile && user.profile.fullName,
      username: user.username
    };
  },

  render: function() {
    var form = this.renderForm();
    var self = this;
    var handleClickBack = function() {
      LogActions.trackMetric('Clicked Back To Care Team List');
    };

    /* jshint ignore:start */
    return (
      <div className="profile">
        <div className="container-box-outer profile-subnav">
          <div className="container-box-inner profile-subnav-box">
            <div className="grid">
              <div className="grid-item one-whole medium-one-third">
                <a className="js-back" href="#/" onClick={handleClickBack}>
                  <i className="icon-back"></i>
                  {' ' + 'Back'}
                </a>
              </div>
              <div className="grid-item one-whole medium-one-third">
                <div className="profile-subnav-title">Account</div>
              </div>
            </div>
          </div>
        </div>
        <div className="container-box-outer profile-content">
          <div className="container-box-inner profile-content-box">
            <div className="profile-form">{form}</div>
          </div>
        </div>
      </div>
    );
    /* jshint ignore:end */
  },

  renderForm: function() {
    /* jshint ignore:start */
    return (
      <SimpleForm
        inputs={this.formInputs}
        formValues={this.state.formValues}
        validationErrors={this.state.validationErrors}
        submitButtonText="Save"
        onSubmit={this.handleSubmit}
        notification={this.state.notification} />
    );
    /* jshint ignore:end */
  },

  renderCreateCareTeam: function() {
    /* jshint ignore:start */
    return (
      <div>
        <div className="profile-careteam-message">
          {'Creating a Care Team allows you to get data into Blip,'}
          {' for yourself or for someone you care for with type 1 diabetes.'}
        </div>
        <PersonCard
          href="#/patients/new">
          <i className="icon-add profile-careteam-icon-link"></i>
          {' ' + 'Create a Care Team'}
        </PersonCard>
      </div>
    );
    /* jshint ignore:end */
  },

  handleSubmit: function(formValues) {
    var self = this;

    this.resetFormStateBeforeSubmit(formValues);

    formValues = this.prepareFormValuesForValidation(formValues);

    var validationErrors = this.validateFormValues(formValues);
    if (!_.isEmpty(validationErrors)) {
      return;
    }

    formValues = this.prepareFormValuesForSubmit(formValues);

    this.submitFormValues(formValues);
  },

  resetFormStateBeforeSubmit: function(formValues) {
    this.setState({
      formValues: formValues,
      validationErrors: {},
      notification: null
    });
    clearTimeout(this.messageTimeoutId);
  },

  prepareFormValuesForValidation: function(formValues) {
    formValues = _.clone(formValues);

    // If not changing password, omit password attributes
    if (!formValues.password && !formValues.passwordConfirm) {
      return _.omit(formValues, ['password', 'passwordConfirm']);
    }

    return formValues;
  },

  validateFormValues: function(formValues) {
    var validationErrors = {};
    var IS_REQUIRED = 'This field is required.';
    var INVALID_EMAIL = 'Invalid email address.';
    var SHORT_PASSWORD = 'Password must be longer than 5 characters.';

    if (!formValues.fullName) {
      validationErrors.fullName = IS_REQUIRED;
    }

    if (!formValues.username) {
      validationErrors.username = IS_REQUIRED;
    }

    if (formValues.username && !utils.validateEmail(formValues.username)) {
      validationErrors.username = INVALID_EMAIL;
    }

    if (formValues.password || formValues.passwordConfirm) {
      if (!formValues.password) {
        validationErrors.password = IS_REQUIRED;
      }
      else if (!formValues.passwordConfirm) {
        validationErrors.passwordConfirm = IS_REQUIRED;
      }
      else if (formValues.passwordConfirm !== formValues.password) {
        validationErrors.passwordConfirm = 'Passwords don\'t match.';
      }
    }

    if (formValues.password && formValues.password.length < 6) {
      validationErrors.password = SHORT_PASSWORD;
    }

    if (!_.isEmpty(validationErrors)) {
      this.setState({
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
    var result = {
      username: formValues.username,
      emails: [formValues.username],
      profile: {
        fullName: formValues.fullName
      }
    };

    if (formValues.password) {
      result.password = formValues.password;
    }

    return result;
  },

  submitFormValues: function(formValues) {
    var self = this;
    // Save optimistically
    AuthActions.updateUser(formValues);
    LogActions.trackMetric('Updated Account');

    this.setState({
      notification: {type: 'success', message: 'All changes saved.'}
    });

    this.messageTimeoutId = setTimeout(function() {
      self.setState({notification: null});
    }, this.MESSAGE_TIMEOUT);
  }
});

module.exports = Profile;
