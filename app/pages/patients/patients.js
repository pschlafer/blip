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

var personUtils = require('../../core/personutils');
var PeopleList = require('../../components/peoplelist');
var PersonCard = require('../../components/personcard');
var Invitation = require('../../components/invitation');

var AuthStore = require('../../stores/AuthStore');
var GroupActions = require('../../actions/GroupActions');
var GroupStore = require('../../stores/GroupStore');
var InvitationReceivedActions = require('../../actions/InvitationReceivedActions');
var InvitationReceivedStore = require('../../stores/InvitationReceivedStore');

var Patients = React.createClass({
  propTypes: {
    showingWelcomeMessage: React.PropTypes.bool,
    trackMetric: React.PropTypes.func.isRequired,
    onRemovePatient: React.PropTypes.func,
    uploadUrl: React.PropTypes.string
  },

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return {
      user: AuthStore.getLoggedInUser(),
      patients: GroupStore.getAll(),
      fetchingPatients: GroupStore.isFetchingAll(),
      invites: InvitationReceivedStore.getAll(),
      fetchingInvites: InvitationReceivedStore.isFetchingAll()
    };
  },

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);
    GroupStore.addChangeListener(this.handleStoreChange);
    InvitationReceivedStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
    GroupStore.removeChangeListener(this.handleStoreChange);
    InvitationReceivedStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var welcomeTitle = this.renderWelcomeTitle();
    var loadingIndicator = this.renderLoadingIndicator();
    var patients = this.renderPatients();
    var invites = this.renderInvitations();

    /* jshint ignore:start */
    return (
      <div className="container-box-outer">
        <div className="patients js-patients-page">
          {welcomeTitle}
          {loadingIndicator}
          {invites}
          {patients}
        </div>
      </div>
    );
    /* jshint ignore:end */
  },
  renderInvitation: function(invitation) {
    return (
      <Invitation
        key={invitation.key}
        invitation={invitation}
        accepting={InvitationReceivedStore.isAccepting(invitation.key)}
        onAccept={InvitationReceivedActions.accept.bind(InvitationReceivedActions, invitation)}
        onDismiss={InvitationReceivedActions.dismiss.bind(InvitationReceivedActions, invitation)} />
    );
  },
  renderInvitations: function() {
    var invites = this.state.invites;

    if (_.isEmpty(invites)) {
       return null;
    }

    var invitations = _.map(invites, this.renderInvitation);

    /* jshint ignore:start */
    return (
      <ul className='invitations'>
        {invitations}
      </ul>
    );
    /* jshint ignore:end */
  },
  renderPatients: function() {
    if (this.isResettingPatientsData()) {
      return null;
    }

    var content;
    var patients = _.clone(this.state.patients) || [];

    if (_.isEmpty(patients)) {
      /* jshint ignore:start */
      content = (
        <div className="patients-message">
          <p>{"You do not have access to see anyone's data yet."}</p>
          <p>{"You need to ask the people you care for to add you to their team."}</p>
          <p>{"Or "} <a href="#/patients/new">create a new account</a> {" for them."}</p>
        </div>
      );
      /* jshint ignore:end */
    }
    else {
      patients = this.addLinkToPatients(patients);

      content = (
        <PeopleList
          people={patients}
          isPatientList={true}
          uploadUrl={this.props.uploadUrl}
          onClickPerson={this.handleClickPatient}
          onRemovePatient= {this.props.onRemovePatient}
          />
      );
    }

    var title = this.renderSectionTitle('View data for:');
    var addAccount = this.renderAddAccount();

    /* jshint ignore:start */
    return (
      <div className="container-box-inner patients-section js-patients-shared">
        {title}
        <div className="patients-section-content">
          {addAccount}
          <div className='clear'></div>
          {content}
        </div>
      </div>
    );
    /* jshint ignore:end */
  },
  renderAddAccount: function() {
    if(personUtils.isPatient(this.state.user)) {
      return null;
    }

    return (
      <a
        className="patients-new-account"
        href="#/patients/new"
        onClick={this.handleClickCreateProfile}>
        Add account
        <i className="icon-add"></i>
      </a>
    );
    /* jshint ignore:end */
  },
  renderWelcomeTitle: function() {
    if (!this.props.showingWelcomeMessage) {
      return null;
    }

    /* jshint ignore:start */
    return (
      <div className="patients-welcome-title">
        {'Welcome to Blip!'}
      </div>
    );
    /* jshint ignore:end */
  },
  renderLoadingIndicator: function() {
    if (this.isResettingPatientsData() && this.isResettingInvitesData()) {
      /* jshint ignore:start */
      return (
        <div className="patients-section">
          <div className="patients-message patients-message-center patients-message-loading">
            Loading...
          </div>
        </div>
      );
      /* jshint ignore:end */
    }

    return null;
  },

  renderSectionTitle: function(text) {
    if (this.props.showingWelcomeMessage) {
      return null;
    }

    /* jshint ignore:start */
    return (
      <div className="patients-section-title-wrapper">
        <div className="patients-section-title">{text}</div>
      </div>
    );
    /* jshint ignore:end */
  },

  handleClickCreateProfile: function() {
    this.props.trackMetric('Clicked Create Profile');
  },

  addLinkToPatients: function(patients) {
    return _.map(patients, function(patient) {
      patient = _.cloneDeep(patient);
      if (patient.userid) {
        patient.link = '#/patients/' + patient.userid + '/data';
      }
      return patient;
    });
  },

  isResettingPatientsData: function() {
    return (this.state.fetchingPatients && _.isEmpty(this.state.patients));
  },

  handleClickPatient: function(patient) {
    if (personUtils.isSame(this.state.user, patient)) {
      this.props.trackMetric('Clicked Own Care Team');
    }
    else {
      this.props.trackMetric('Clicked Other Care Team');
    }
  },

  isResettingInvitesData: function() {
    return (this.state.fetchingInvites && _.isEmpty(this.state.invites));
  }
});

module.exports = Patients;
