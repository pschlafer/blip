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

var ModalOverlay = React.createClass({
  propTypes: {
    message: React.PropTypes.string,
    cancel: React.PropTypes.string,
    action: React.PropTypes.string,
    onAction: React.PropTypes.func
  },

  render: function() {
    return (
      /* jshint ignore:start */
      <div className="modal-overlay">
        <div className="modal-overlay-dialog">
          <div className="modal-overlay-body">
            <p>{this.props.message}</p>
          </div>
          <div className="modal-overlay-footer">
            <button
              className="btn btn-primary modal-overlay-button-cancel"
              onClick={this.onCancel}>{this.props.cancel}</button>
            <button
              className="btn btn-primary modal-overlay-button-action"
              onClick={this.props.onAction}>{this.props.action}</button>
          </div>
        </div>
      </div>
      /* jshint ignore:end */
    );
  },

  onCancel: function() {
    console.log('cancel');
    return null;
  }
});

module.exports = ModalOverlay;
