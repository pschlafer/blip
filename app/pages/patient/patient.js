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

var AuthenticatedRoute = require('../../core/AuthenticatedRoute');

var GroupActions = require('../../actions/GroupActions');
var GroupStore = require('../../stores/GroupStore');
var InvitationSentActions = require('../../actions/InvitationSentActions');
var trackMetric = require('../../core/trackMetric');

var Patient = React.createClass({
  propTypes: {
    shareOnly: React.PropTypes.bool
  },

  mixins: [AuthenticatedRoute],

  getInitialState: function() {
    return _.assign(this.getStateFromStores(), {
      showModalOverlay: false
    });
  },

  getStateFromStores: function(props) {
    props = props || this.props;
    return {
      patient: GroupStore.get(this.props.params.patientId)
    };
  },

  componentWillMount: function() {
    this.fetchData();
    if (this.props.shareOnly) {
      trackMetric('Viewed Share');
    }
    else {
      trackMetric('Viewed Profile');
    }
  },

  componentDidMount: function() {
    GroupStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this.getStateFromStores(nextProps));
    if (nextProps.params.patientId !== this.props.params.patientId) {
      this.fetchData(nextProps);
    }
  },

  fetchData: function(props) {
    props = props || this.props;
    GroupActions.fetch(props.params.patientId);
    InvitationSentActions.fetchForGroup(props.params.patientId);
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
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
      </div>
    );
  },

  renderContent: function() {
    var share;
    var modal;
    var profile = this.renderInfo();

    if (this.props.shareOnly) {
      share = this.renderAccess();
      modal = this.renderModalOverlay();
      profile = null;
    }

    return (
      <div className="PatientPage-content">
        {profile}
        {share}
        {modal}
      </div>
    );
  },

  renderFooter: function() {
    return <div className="PatientPage-footer"></div>;
  },

  renderInfo: function() {
    return (
      <div className="PatientPage-infoSection">
        <PatientInfo patientId={this.props.params.patientId} />
      </div>
    );
  },

  hasEditPermissions: function() {
    return personUtils.hasEditPermissions(this.state.patient);
  },

  renderDeleteDialog: function() {
    return (
      <div>If you are sure you want to delete your account, <a href="mailto:support@tidepool.org?Subject=Delete%20my%20account" target="_blank">send an email</a> to support@tidepool.org and we take care of it for you.</div>
    );
  },

  renderDelete: function() {
    var self = this;

    if (!this.hasEditPermissions()) {
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

  renderAccess: function() {
    if (!this.hasEditPermissions()) {
      return null;
    }

    return (
      <div className="PatientPage-teamSection">
        <PatientTeam patientId={this.props.params.patientId} />
      </div>
    );
  }
});

module.exports = Patient;
