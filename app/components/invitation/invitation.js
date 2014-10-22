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

var utils = require('../../core/utils');

var Invitation = React.createClass({
  propTypes: {
    invitation: React.PropTypes.object,
    accepting: React.PropTypes.bool,
    onAccept: React.PropTypes.func,
    onDismiss: React.PropTypes.func
  },
  render: function() {
    var name = utils.getIn(this.props.invitation, ['creator', 'profile', 'fullName']);

    if (this.props.accepting) {
      /* jshint ignore:start */
      return (
        <li className='invitation'>
          <div className='invitation-message'>{'Joining ' + name + '\'s team...'}</div>
        </li>
      );
      /* jshint ignore:end */
    }

    /* jshint ignore:start */
    return (
      <li className='invitation'>
        <div className='invitation-message'>{'You have been invited to see ' + name + '\'s data!'}</div>
        <div className='invitation-action'>
          <button
            className='invitation-action-submit btn btn-primary js-form-submit'
            onClick={this.props.onAccept}
            disabled={this.props.accepting}
            ref="submitButton">{'Join the team!'}</button>
          <button
            className="invitation-action-ignore btn js-form-submit"
            onClick={this.props.onDismiss}
            disabled={this.props.accepting}
            ref="ignoreButton">{'Ignore'}</button>
        </div>
      </li>
    );
    /* jshint ignore:end */
  }
});

module.exports = Invitation;
