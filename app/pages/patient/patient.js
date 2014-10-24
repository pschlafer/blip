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

var personUtils = require('../../core/personutils');
var ModalOverlay = require('../../components/modaloverlay');
var PatientInfo = require('./patientinfo');
var PatientTeam = require('./patientteam');

var GroupStore = require('../../stores/GroupStore');
var LogActions = require('../../actions/LogActions');

var Patient = React.createClass({
  propTypes: {
    patientId: React.PropTypes.string
  },

  getInitialState: function() {
    return _.assign({
      showModalOverlay: false
    }, this.getStateFromStores());
  },

  getStateFromStores: function() {
    return {
      patient: GroupStore.get(this.props.patientId),
      fetchingPatient: GroupStore.isFetching(this.props.patientId)
    };
  },

  componentDidMount: function() {
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      patient: GroupStore.get(nextProps.patientId),
      fetchingPatient: GroupStore.isFetching(nextProps.patientId)
    });
  },

  handleStoreChange: function() {
    this.setState(this.getStateFromStores());
  },

  render: function() {
    return (
      <div className="PatientPage js-patient-page">
        <div className="PatientPage-layer">
          {this.renderSubnav()}
          {this.renderContent()}
          {this.renderFooter()}
        </div>
      </div>
    );
  },

  renderSubnav: function() {
    return (
      <div className="PatientPage-subnav grid">
        <div className="grid-item one-whole medium-one-third">
          {this.renderBackButton()}
        </div>
        <div className="grid-item one-whole medium-one-third">
          <div className="PatientPage-subnavTitle">{this.renderTitle()}</div>
        </div>
      </div>
    );
  },

  renderContent: function() {
    return (
      <div className="PatientPage-content">
        {this.renderInfo()}
        {this.renderTeam()}
        {this.renderModalOverlay()}
      </div>
    );
  },

  renderFooter: function() {
    return <div className="PatientPage-footer"></div>;
  },

  renderBackButton: function() {
    var patient = this.state.patient;
    if (this.props.fetchingPatient || !(patient && patient.userid)) {
      return null;
    }

    var text = 'Data';
    var url = '#/patients/' + patient.userid + '/data';

    var self = this;
    var handleClick = function() {
      LogActions.trackMetric('Clicked Back To Data');
    };

    return (
      <a className="js-back" href={url} onClick={handleClick}>
        <i className="icon-back"></i>
        {' ' + text}
      </a>
    );
  },

  renderTitle: function() {
    var text = 'Profile';

    if (!this.state.fetchingPatient) {
      text = personUtils.patientFullName(this.state.patient) + '\'s Profile';
    }

    return text;
  },

  renderInfo: function() {
    return (
      <div className="PatientPage-infoSection">
        <PatientInfo patientId={this.props.patientId} />
      </div>
    );
  },

  isRootOrAdmin: function() {
    return personUtils.hasPermissions('root', this.state.patient) ||
           personUtils.hasPermissions('admin', this.state.patient);
  },

  renderDeleteDialog: function() {
    return (
      <div>If you are sure you want to delete your account, <a href="mailto:support@tidepool.org?Subject=Delete%20my%20account" target="_blank">send an email</a> to support@tidepool.org and we take care of it for you.</div>
    );
  },

  renderDelete: function() {
    var self = this;

    if (!this.isRootOrAdmin()) {
      return null;
    }

    var handleClick = function() {
      self.setState({
        showModalOverlay: true,
        dialog: self.renderDeleteDialog()
      });
    };

    return (
      <div className="PatientPage-deleteSection">
        <div onClick={handleClick}>Delete my account</div>
      </div>
    );
  },
  overlayClickHandler: function() {
    this.setState({
      showModalOverlay: false
    });
  },
  renderModalOverlay: function() {
    /* jshint ignore:start */
    return (
      <ModalOverlay
        show={this.state.showModalOverlay}
        dialog={this.state.dialog}
        overlayClickHandler={this.overlayClickHandler}/>
    );
    /* jshint ignore:end */
  },

  renderTeam: function() {
    if (!this.isRootOrAdmin()) {
      return null;
    }

    return (
      <div className="PatientPage-teamSection">
        <PatientTeam patientId={this.props.patientId} />
      </div>
    );
  }
});

module.exports = Patient;
