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
var Link = require('react-router').Link;

var personUtils = require('../../core/personutils');

var NavbarPatientCard = React.createClass({
  propTypes: {
    patient: React.PropTypes.object,
    navbarActive: React.PropTypes.string,
    uploadUrl: React.PropTypes.string
  },

  render: function() {
    var patient = this.props.patient;
    var self = this;

    var classes = cx({
      'patientcard': true
    });

    var view = this.renderView(patient);
    var upload = this.renderUpload(patient);
    var share = this.renderShare(patient);
    var profile = this.renderProfile(patient);

    /* jshint ignore:start */
    return (
      <div className={classes}>
        <i className="Navbar-icon icon-face-standin"></i>
        <div className="patientcard-info">
          {profile}
          <div className="patientcard-actions">
            {view}
            {share}
            {upload}
          </div>
        </div>
        <div className="clear"></div>
      </div>
    );
    /* jshint ignore:end */
  },

  renderView: function() {
    var classes = cx({
      'patientcard-actions-view': true,
      'patientcard-actions--highlight': this.props.navbarActive === 'data'
    });

    return (
      <Link
        className={classes}
        to="patient-data"
        params={{patientId: this.props.patient.userid}}>
        View
      </Link>
    );
  },

  renderProfile: function(patient) {
    var classes = cx({
      'patientcard-actions-profile': true,
      'navbarpatientcard-profile': true,
      'patientcard-actions--highlight': this.props.navbarActive === 'profile'
    });

    return (
      <Link
        className={classes}
        to="patient-profile"
        params={{patientId: this.props.patient.userid}}
        title="Profile">
        <div className="patientcard-fullname">
          {this.getFullName()}
          <i className="patientcard-icon icon-settings"></i>
        </div>
      </Link>
    );
  },

  renderUpload: function(patient) {
    var classes = cx({
      'patientcard-actions-upload': true
    });

    if(_.isEmpty(patient.permissions) === false && patient.permissions.root) {
      return (
        /* jshint ignore:start */
        <a className={classes} href={this.props.uploadUrl} target='_blank' title="Upload data">Upload</a>
        /* jshint ignore:end */
      );
    }

    return null;
  },

  renderShare: function(patient) {
    var classes = cx({
      'patientcard-actions-share': true,
      'patientcard-actions--highlight': this.props.navbarActive === 'share'
    });

    if(_.isEmpty(patient.permissions) === false && patient.permissions.root) {
      return (
        <Link
          to="patient-share"
          params={{patientId: this.props.patient.userid}}
          className={classes}
          title="Share data">
          Share
        </Link>
      );
    }

    return null;
  },

  getFullName: function() {
    return personUtils.patientFullName(this.props.patient);
  }
});

module.exports = NavbarPatientCard;
