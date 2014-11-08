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
var moment = require('moment');

var personUtils = require('../../core/personutils');
var datetimeUtils = require('../../core/datetimeutils');

var GroupStore = require('../../stores/GroupStore');
var GroupActions = require('../../actions/GroupActions');
var trackMetric = require('../../core/trackMetric');

var SERVER_DATE_FORMAT = 'YYYY-MM-DD';
var FORM_DATE_FORMAT = 'MM/DD/YYYY';

var PatientInfo = React.createClass({
  propTypes: {
    patientId: React.PropTypes.string
  },

  getInitialState: function() {
    return _.assign({
      editing: false,
      notification: null
    }, this.getStateFromStores());
  },

  getStateFromStores: function(props) {
    props = props || this.props;
    return {
      patient: GroupStore.get(props.patientId)
    };
  },

  componentDidMount: function() {
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this.getStateFromStores(nextProps));
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  render: function() {
    if (_.isEmpty(this.state.patient)) {
      return this.renderSkeleton();
    }

    if (this.state.editing) {
      return this.renderEditing();
    }

    var patient = this.state.patient;
    var self = this;
    var handleClick = function(e) {
      e.preventDefault();
      self.toggleEdit();
    };
    var nameNode;
    var ageNode;
    var diagnosisNode;
    if (this.isRootOrAdmin()) {
      nameNode = (
        <a href="" onClick={handleClick} className="PatientInfo-block PatientInfo-block--withArrow">
          {this.getDisplayName(patient)}
        </a>
      );
      ageNode = (
        <a href="" onClick={handleClick} className="PatientInfo-block">
          {this.getAgeText(patient)}
        </a>
      );
      diagnosisNode = (
        <a href="" onClick={handleClick} className="PatientInfo-block">
          {this.getDiagnosisText(patient)}
        </a>
      );
    }
    else {
      nameNode = (
        <div className="PatientInfo-block PatientInfo-block--withArrow">
          {this.getDisplayName(patient)}
        </div>
      );
      ageNode = (
        <div className="PatientInfo-block">
          {this.getAgeText(patient)}
        </div>
      );
      diagnosisNode = (
        <div className="PatientInfo-block">
          {this.getDiagnosisText(patient)}
        </div>
      );
    }

    return (
      <div className="PatientInfo">
        <div className="PatientPage-sectionTitle">Info</div>
        <div className="PatientInfo-controls">
          {this.renderEditLink()}
        </div>
        <div className="clear"></div>

        <div className="PatientInfo-content">
          <div className="PatientInfo-head">
            <div className="PatientInfo-picture"></div>
            <div className="PatientInfo-blocks">
              <div className="PatientInfo-blockRow">
                {nameNode}
              </div>
              <div className="PatientInfo-blockRow">
                {ageNode}
              </div>
              <div className="PatientInfo-blockRow">
                {diagnosisNode}
              </div>
            </div>
          </div>
          <div className="PatientInfo-bio">
            {this.getAboutText(patient)}
          </div>
        </div>
      </div>
    );
  },

  renderSkeleton: function() {
    return (
      <div className="PatientInfo">
        <div className="PatientPage-sectionTitle">Info</div>
        <div className="PatientInfo-controls"></div>
        <div className="clear"></div>
        <div className="PatientInfo-content">
          <div className="PatientInfo-head">
            <div className="PatientInfo-picture"></div>
            <div className="PatientInfo-blocks">
              <div className="PatientInfo-blockRow">
                <div className="PatientInfo-block PatientInfo-block--withArrow PatientInfo-block--placeholder">&nbsp;</div>
              </div>
              <div className="PatientInfo-blockRow">
                <div className="PatientInfo-block PatientInfo-block--placeholder">&nbsp;</div>
              </div>
              <div className="PatientInfo-blockRow">
                <div className="PatientInfo-block PatientInfo-block--placeholder">&nbsp;</div>
              </div>
            </div>
          </div>
          <div className="PatientInfo-bio PatientInfo-bio--placeholder">&nbsp;</div>
        </div>
      </div>
    );
  },

  renderEditLink: function() {
    if (!this.isRootOrAdmin()) {
      return null;
    }

    var self = this;
    var handleClick = function(e) {
      e.preventDefault();
      trackMetric('Clicked Edit Profile');
      self.toggleEdit();
    };

    // Important to add a `key`, different from the "Cancel" button in edit mode
    // or else react will maintain the "focus" state when flipping back and forth
    return (
      <button key="edit" className="PatientInfo-button PatientInfo-button--secondary" type="button" onClick={handleClick}>Edit</button>
    );
  },

  toggleEdit: function() {
    this.setState({
      editing: !this.state.editing,
      notification: null
    });
  },

  renderEditing: function() {
    var patient = this.state.patient;
    var formValues = this.formValuesFromPatient(patient);

    var self = this;
    var handleCancel = function(e) {
      e.preventDefault();
      self.toggleEdit();
    };

    // Legacy: revisit when proper "child accounts" are implemented
    var fullNameNode;
    if (personUtils.patientIsOtherPerson(patient)) {
      fullNameNode = (
        <div className="">
          <input className="PatientInfo-input" id="fullName" ref="fullName" placeholder="Full name" defaultValue={formValues.fullName} />
        </div>
      );
    }
    else {
      formValues = _.omit(formValues, 'fullName');
      fullNameNode = (
        <div className="PatientInfo-block PatientInfo-block--withArrow">
          {this.getDisplayName(patient)}
          {' (edit in '}
          <a href="#/profile">account</a>
          {')'}
        </div>
      );
    }

    return (
      <div className="PatientInfo">
        <div className="PatientInfo-controls">
          <button key="cancel" className="PatientInfo-button PatientInfo-button--secondary" type="button" disabled={this.state.working} onClick={handleCancel}>Cancel</button>
          {this.renderSubmit()}
          {this.renderNotification()}
        </div>
        <div className="PatientInfo-content">
          <div className="PatientInfo-head">
            <div className="PatientInfo-picture"></div>
            <div className="PatientInfo-blocks">
              <div className="PatientInfo-blockRow">
                {fullNameNode}
              </div>
              <div className="PatientInfo-blockRow">
                <div className="">
                  <label className="PatientInfo-label" htmlFor="birthday">Date of birth</label>
                  <input className="PatientInfo-input" id="birthday" ref="birthday" placeholder={FORM_DATE_FORMAT} defaultValue={formValues.birthday} />
                </div>
              </div>
              <div className="PatientInfo-blockRow">
                <div className="">
                  <label className="PatientInfo-label" htmlFor="diagnosisDate">Date of diagnosis</label>
                  <input className="PatientInfo-input" id="diagnosisDate" ref="diagnosisDate" placeholder={FORM_DATE_FORMAT} defaultValue={formValues.diagnosisDate} />
                </div>
              </div>
            </div>
          </div>
          <div className="PatientInfo-bio">
            <textarea className="PatientInfo-input" ref="about"
              placeholder="Anything you would like to share?"
              rows="3"
              defaultValue={formValues.about}>
            </textarea>
          </div>
        </div>
      </div>
    );
  },

  renderSubmit: function() {
    return (
      <button className="PatientInfo-button PatientInfo-button--primary"
        type="submit" onClick={this.handleSubmit}>
        {'Save changes'}
      </button>
    );
  },

  renderNotification: function() {
    var notification = this.state.notification;
    if (!notification) {
      return null;
    }

    return (
      <div className={'PatientInfo-notification PatientInfo-notification--' + notification.type}>
        {notification.message}
      </div>
    );
  },

  isRootOrAdmin: function() {
    return personUtils.hasPermissions('root', this.state.patient) ||
           personUtils.hasPermissions('admin', this.state.patient);
  },

  getDisplayName: function(patient) {
    return personUtils.patientFullName(patient);
  },

  getAgeText: function(patient) {
    var patientInfo = personUtils.patientInfo(patient) || {};
    var birthday = patientInfo.birthday;

    if (!birthday) {
      return;
    }

    return datetimeUtils.yearsOldText(birthday);
  },

  getDiagnosisText: function(patient) {
    var patientInfo = personUtils.patientInfo(patient) || {};
    var diagnosisDate = patientInfo.diagnosisDate;

    if (!diagnosisDate) {
      return;
    }

    return 'Diagnosed ' + datetimeUtils.yearsAgoText(diagnosisDate);
  },

  getAboutText: function(patient) {
    var patientInfo = personUtils.patientInfo(patient) || {};
    return patientInfo.about;
  },

  formValuesFromPatient: function(patient) {
    if (!patient) {
      return {};
    }

    var formValues = {};
    var patientInfo = personUtils.patientInfo(patient);

    formValues.fullName = personUtils.patientFullName(patient);

    if (patientInfo.birthday) {
      formValues.birthday = moment(patientInfo.birthday)
        .format(FORM_DATE_FORMAT);
    }

    if (patientInfo.diagnosisDate) {
      formValues.diagnosisDate = moment(patientInfo.diagnosisDate)
        .format(FORM_DATE_FORMAT);
    }

    if (patientInfo.about) {
      formValues.about = patientInfo.about;
    }

    return formValues;
  },

  handleSubmit: function(e) {
    e.preventDefault();
    var formValues = this.getFormValues();

    this.setState({notification: null});
    var validationError = this.validateFormValues(formValues);
    if (validationError) {
      this.setState({
        notification: {type: 'error', message: validationError}
      });
      return;
    }

    this.submitFormValues(formValues);
  },

  getFormValues: function() {
    var self = this;
    return _.reduce([
      'fullName',
      'birthday',
      'diagnosisDate',
      'about'
    ], function(acc, key, value) {
      if (self.refs[key]) {
        acc[key] = self.refs[key].getDOMNode().value;
      }
      return acc;
    }, {});
  },

  validateFormValues: function(formValues) {
    // Legacy: revisit when proper "child accounts" are implemented
    if (personUtils.patientIsOtherPerson(this.state.patient) &&
        !formValues.fullName) {
      return 'Full name is required';
    }

    var birthday = formValues.birthday;
    if (!(birthday && datetimeUtils.isValidDate(birthday))) {
      return 'Date of birth needs to be a valid date';
    }

    var diagnosisDate = formValues.diagnosisDate;
    if (!(diagnosisDate && datetimeUtils.isValidDate(diagnosisDate))) {
      return 'Diagnosis date needs to be a valid date';
    }

    var maxLength = 256;
    var about = formValues.about;
    if (about && about.length > maxLength) {
      return 'Please keep "about" text under ' + maxLength + ' characters';
    }
  },

  submitFormValues: function(formValues) {
    formValues = this.prepareFormValuesForSubmit(formValues);
    var self = this;

    // Save optimistically
    GroupActions.update(formValues);
    trackMetric('Updated Profile');
    this.toggleEdit();
  },

  prepareFormValuesForSubmit: function(formValues) {
    // Legacy: revisit when proper "child accounts" are implemented
    if (personUtils.patientIsOtherPerson(this.state.patient)) {
      formValues.isOtherPerson = true;
    }

    if (formValues.birthday) {
      formValues.birthday = moment(formValues.birthday, FORM_DATE_FORMAT)
        .format(SERVER_DATE_FORMAT);
    }

    if (formValues.diagnosisDate) {
      formValues.diagnosisDate = moment(formValues.diagnosisDate, FORM_DATE_FORMAT)
        .format(SERVER_DATE_FORMAT);
    }

    if (!formValues.about) {
      delete formValues.about;
    }

    var profile = _.assign({}, this.state.patient.profile, {
      patient: formValues
    });

    var result = _.assign({}, this.state.patient, {
      profile: profile
    });

    return result;
  }
});

module.exports = PatientInfo;
