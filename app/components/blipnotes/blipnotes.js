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

var Blipnotes = React.createClass({

  render: function() {

    return (
      /* jshint ignore:start */
      <div className={'container-box-outer blip-notes-module'}>
        <a href="#/">&lArr; Go Back</a>
        <h2>Blip Notes</h2>
        <div className="column">
          <img src="./images/blip-logo-290x290.png" alt="Blip Notes mobile app"/>
        </div>
        <div className="column">
          <p>Add notes to Blip straight from your smartphone. You can also record notes for others that you care for.</p>
          <h3>How to Install</h3>
          <p>Blip Notes works from your favorite mobile browser on any smartphone. Get it with 2 simple steps:</p>
          <ol>
            <li>
              <p>From your smartphone,go to notes.tidepool.io. Or, enter your cell phone number here and we’ll text you a clickable link.</p>
              <small>We will not store your phone number.</small>
            </li>
            <li>
              <p>Save Blip Notes to your home screen.</p>
            </li>
          </ol>
          <p>Got questions? Feel free to reach out to us at <a href="mailto:support@tidepool.org">support@tidepool.org</a>.</p>
        </div>
      </div>
      /* jshint ignore:end */
    );

  }

});

module.exports = Blipnotes;
