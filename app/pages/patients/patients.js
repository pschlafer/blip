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

var config = require('../../config');

var personUtils = require('../../core/personutils');
var PeopleList = require('../../components/peoplelist');
var PersonCard = require('../../components/personcard');
var Invitation = require('../../components/invitation');

var AuthenticatedRoute = require('../../core/AuthenticatedRoute');

var AppActions = require('../../actions/AppActions');
var AppStore = require('../../stores/AppStore');
var AuthStore = require('../../stores/AuthStore');
var GroupActions = require('../../actions/GroupActions');
var GroupStore = require('../../stores/GroupStore');
var InvitationReceivedActions = require('../../actions/InvitationReceivedActions');
var InvitationReceivedStore = require('../../stores/InvitationReceivedStore');
var trackMetric = require('../../core/trackMetric');

var getUploadUrl = require('../../core/getUploadUrl');

var Patients = React.createClass({
  mixins: [AuthenticatedRoute, Navigation],

  getInitialState: function() {
    return _.assign(this.getStateFromStores(), {
      fetchingPatients: true,
      fetchingInvites: true
    });
  },

  getStateFromStores: function() {
    var appState = AppStore.getState();
    return {
      user: AuthStore.getLoggedInUser(),
      patients: GroupStore.getAll(),
      fetchingPatients: GroupStore.isFetchingAll(),
      invites: InvitationReceivedStore.getAll(),
      fetchingInvites: InvitationReceivedStore.isFetchingAll(),
      showingWelcomeTitle: appState.showingWelcomeTitle,
      showingWelcomeSetup: appState.showingWelcomeSetup
    };
  },

  componentWillMount: function() {
    this.fetchData();
    trackMetric('Viewed Care Team List');
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
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  fetchData: function() {
    GroupActions.fetchAll();
    InvitationReceivedActions.fetchAll();
  },

  render: function() {
    var welcomeTitle = this.renderWelcomeTitle();

    if (this.isLoadingOrRefreshing()) {
      return (
        <div className="container-box-outer">
          <div className="patients js-patients-page">
            {welcomeTitle}
            {this.renderLoadingIndicator()}
          </div>
        </div>
      );
    }

    var welcomeSetup = this.renderWelcomeSetup();
    var noPatientsOrInvites = this.renderNoPatientsOrInvitationsMessage();
    var invites = this.renderInvitations();
    var noPatientsSetupStorage = this.renderNoPatientsSetupStorageLink();
    var patients = this.renderPatients();

    return (
      <div className="container-box-outer">
        <div className="patients js-patients-page">
          {welcomeTitle}
          {welcomeSetup}
          {noPatientsOrInvites}
          {invites}
          {noPatientsSetupStorage}
          {patients}
        </div>
      </div>
    );
  },

  renderWelcomeSetup: function() {
    if (!this.isShowingWelcomeSetup()) {
      return null;
    }

    var self = this;
    var handleClickYes = function(e) {
      e.preventDefault();
      self.transitionTo('/patients/new');
      AppActions.hideWelcomeSetup();
    };
    var handleClickNo = function(e) {
      e.preventDefault();
      AppActions.hideWelcomeSetup();
    };

    return (
      <div className="patients-message">
        <div>
          {"Tidepool provides free, secure data storage for diabetes data."}
          <br />
          {"Would you like to set up data storage for someone’s diabetes data?"}
        </div>
        <div className="patients-welcomesetup-actions">
          <div><button className="btn btn-primary" onClick={handleClickYes}>{"Yes, let's set it up"}</button></div>
          <div><button className="btn btn-tertiary" onClick={handleClickNo}>{"No, not now"}</button></div>
          <div className="patients-welcomesetup-actions-help">{"(You can always create one later)"}</div>
        </div>
      </div>
    );
  },

  renderInvitation: function(invitation, index) {
    /* jshint ignore:start */
    return (
      <Invitation
        key={invitation.key}
        invitation={invitation}
        accepting={InvitationReceivedStore.isAccepting(invitation.key)}
        onAccept={this.handleAcceptInvitation.bind(this, invitation)}
        onDismiss={this.handleDismissInvitation.bind(this, invitation)} />
    );
  },

  handleAcceptInvitation: function(invitation) {
    AppActions.hideWelcomeSetup();
    InvitationReceivedActions.accept(invitation);
  },

  handleDismissInvitation: function(invitation) {
    AppActions.hideWelcomeSetup();
    InvitationReceivedActions.dismiss(invitation);
  },

  renderInvitations: function() {
    if (!this.hasInvites()) {
      return null;
    }

    var invitations = _.map(this.state.invites, this.renderInvitation);

    /* jshint ignore:start */
    return (
      <ul className='invitations'>
        {invitations}
      </ul>
    );
    /* jshint ignore:end */
  },

  renderNoPatientsOrInvitationsMessage: function() {
    if (this.isShowingWelcomeSetup() || this.hasPatients() || this.hasInvites()) {
      return null;
    }

    return (
      <div className="patients-message">
        {"Looks like you don’t have access to any data yet."}
        <br />
        {"Please ask people to invite you to see their data in Blip."}
      </div>
    );
  },

  renderNoPatientsSetupStorageLink: function() {
    if (this.isShowingWelcomeSetup() || this.hasPatients()) {
      return null;
    }

    return (
      <div className="patients-message">
        {"You can also "}
        <a href="#/patients/new">{"setup data storage"}</a>
        {" for someone’s diabetes data."}
      </div>
    );
  },

  renderPatients: function() {
    if (!this.hasPatients()) {
      return null;
    }

    var patients = _.clone(this.state.patients);
    var addDataStorage = this.renderAddDataStorage();

    return (
      <div className="container-box-inner patients-section js-patients-shared">
        <div className="patients-section-title-wrapper">
          <div className="patients-section-title">{"View data for:"}</div>
        </div>
        <div className="patients-section-content">
          {addDataStorage}
          <div className='clear'></div>
          <PeopleList
            people={patients}
            isPatientList={true}
            uploadUrl={getUploadUrl()}
            onClickPerson={this.handleClickPatient} />
        </div>
      </div>
    );
  },

  renderAddDataStorage: function() {
    // Until the "child accounts" feature,
    // don't allow additional data accounts once the primary one has been setup
    if (personUtils.isPatient(this.state.user)) {
      return null;
    }

    return (
      <a
        className="patients-new-account"
        href="#/patients/new"
        onClick={this.handleClickCreateProfile}>
        Setup data storage
        <i className="icon-add"></i>
      </a>
    );
  },

  renderWelcomeTitle: function() {
    if (!this.isShowingWelcomeTitle()) {
      return null;
    }

    return (
      <div className="patients-welcome-title">
        {'Welcome to Blip!'}
      </div>
    );
  },

  renderLoadingIndicator: function() {
    return (
      <div className="patients-message patients-message-loading">
        Loading...
      </div>
    );
  },

  handleClickCreateProfile: function() {
    trackMetric('Clicked Create Profile');
  },

  handleClickPatient: function(patient) {
    if (personUtils.isSame(this.state.user, patient)) {
      trackMetric('Clicked Own Care Team');
    }
    else {
      trackMetric('Clicked Other Care Team');
    }
  },

  isLoadingOrRefreshing: function() {
    return this.state.fetchingInvites || this.state.fetchingPatients;
  },

  isShowingWelcomeTitle: function() {
    return this.state.showingWelcomeTitle;
  },

  hasInvites: function() {
    return !_.isEmpty(this.state.invites);
  },

  isShowingWelcomeSetup: function() {
    return this.state.showingWelcomeSetup && !this.hasInvites();
  },

  hasPatients: function() {
    return !_.isEmpty(this.state.patients) || personUtils.isPatient(this.state.user);
  }
});

module.exports = Patients;
