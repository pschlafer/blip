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
var ModalOverlay = require('../modaloverlay');


var Footeritem = React.createClass({
  propTypes: {
    linkTitle : React.PropTypes.string.isRequired,
    linkAddress : React.PropTypes.string.isRequired,
    onLinkClicked: React.PropTypes.func.isRequired,
    subText: React.PropTypes.string.isRequired
  },
  
  getInitialState: function() {
    return {
      showModalOverlay: false
    };
  },


  render: function() {

    // var mailtoInfo = 'mailto:'+this.props.linkAddress+'?Subject='+this.props.emailSubject;

    // Hack: don't let "mailto:" link cancel other XHR requests by pointing it
    // to a hidden iframe
    // https://github.com/angular/angular.js/issues/7461#issuecomment-43073994

    if(this.props.linkAddress.substring(0,6)==='mailto'){
      
      return (
        /* jshint ignore:start */
          <div className='footer-item'>
            <div className='mailto'>
              <a href={this.props.linkAddress} onClick={this.props.onLinkClicked} target="mailto">{this.props.linkTitle}</a>
              <iframe name="mailto" src="about:blank" style={{display: 'none'}}></iframe>
            </div>
            {this.props.subText}
          </div>
        /* jshint ignore:end */
      );

    }else{

      return (
        /* jshint ignore:start */
        <div className='footer-item'>
          <div>
            <a onClick={this.props.onLinkClicked}>{this.props.linkTitle}</a>
          </div>
          {this.props.subText}
        </div>
        /* jshint ignore:end */
      );

    }
  }

});

module.exports = Footeritem;
