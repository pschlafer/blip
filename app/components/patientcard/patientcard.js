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
var cx = require('react/lib/cx');

var personUtils = require('../../core/personutils');
var ModalOverlay = require('../modaloverlay');

var GroupActions = require('../../actions/GroupActions');
var GroupStore = require('../../stores/GroupStore');

var RemovePatientDialog = React.createClass({
  propTypes: {
    patient: React.PropTypes.object,
    onCancel: React.PropTypes.func
  },

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return {
      working: GroupStore.isLeaving(this.props.patient.userid)
    };
  },

  componentDidMount: function() {
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    // Carefull, will unmount when done removing, don't try to update
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var disabled = this.state.working;
    var buttonText = this.state.working ? 'Removing...' : 'I\'m sure, remove me';

    return (
      <div>
        <div className="ModalOverlay-content">{"Are you sure you want to leave this person's Care Team? You will no longer be able to view their data."}</div>
        <div className="ModalOverlay-controls">
          <button className="PatientInfo-button PatientInfo-button--secondary" type="button" onClick={this.props.onCancel} disabled={disabled}>Cancel</button>
          <button className="PatientInfo-button PatientInfo-button--primary" type="submit" onClick={this.handleRemovePatient} disabled={disabled}>{buttonText}</button>
        </div>
      </div>
    );
  },

  handleRemovePatient: function() {
    // Note: this component will unmount
    // when leaving group is complete
    GroupActions.leave(this.props.patient.userid);
  }
});

var PatientCard = React.createClass({
  propTypes: {
    href: React.PropTypes.string,
    onClick: React.PropTypes.func,
    uploadUrl: React.PropTypes.string,
    patient: React.PropTypes.object
  },

  getInitialState: function() {
    return {
      showModalOverlay: false
    };
  },

  render: function() {
    var patient = this.props.patient;
    var self = this;
    var classes = cx({
      'patientcard': true
    });

    var remove = (function(patient) {

        if (_.isEmpty(patient.permissions) === false && (!patient.permissions.admin && !patient.permissions.root)) {

          var title = 'Remove yourself from ' + self.getFullName() + "'s care team.";

          return (
            /* jshint ignore:start */
            <a href="" onClick={self.handleRemove(patient)} title={title}>
              <i className="Navbar-icon icon-remove"></i>
            </a>
            /* jshint ignore:end */
          );
        }
    })(patient);

    var permissions = (function(patient) {
      var classes = {
        'Navbar-icon': true,
        'patientcard-permissions-icon': true
      };

      if(_.isEmpty(patient.permissions) === false && patient.permissions.root) {
        classes['icon-permissions-upload'] = true;
      } else {
        return null;
      }

      classes = cx(classes);

      return (
        /* jshint ignore:start */
        <a href={self.props.uploadUrl} target='_blank' title="Upload data">
          <i className={classes}></i>
        </a>
        /* jshint ignore:end */
      );
    })(patient);

    /* jshint ignore:start */
    return (
      <div>
        <a className={classes}
          href={this.props.href}
          onClick={this.props.onClick}>
          <i className="Navbar-icon icon-face-standin"><span className="patientcard-fullname">{this.getFullName()}</span></i>
        </a>
        <div className="patientcard-controls">
          {remove}
          {permissions}
        </div>
        {this.renderModalOverlay()}
      </div>
    );
    /* jshint ignore:end */
  },

  renderRemoveDialog: function() {
    return <RemovePatientDialog
      patient={this.props.patient}
      onCancel={this.overlayClickHandler} />;
  },

  handleRemove: function(patient) {
    var self = this;

    return function() {
      self.setState({
        showModalOverlay: true,
        dialog: self.renderRemoveDialog()
      });

      return false;
    };
  },

  overlayClickHandler: function() {
    this.setState({
      showModalOverlay: false
    });
  },

  renderModalOverlay: function() {

    return (
      /* jshint ignore:start */
      <ModalOverlay
        show={this.state.showModalOverlay}
        dialog={this.state.dialog}
        overlayClickHandler={this.overlayClickHandler}/>
      /* jshint ignore:end */
    );

  },

  getFullName: function() {
    return personUtils.patientFullName(this.props.patient);
  }
});

module.exports = PatientCard;
