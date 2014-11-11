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
'use strict';

var React = require('react');
var bows = require('bows');
var _ = require('lodash');
var async = require('async');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var Redirect = Router.Redirect;
var Navigation = Router.Navigation;
var ActiveState = Router.ActiveState;

var config = require('./config');
var api = require('./core/api');
var personUtils = require('./core/personutils');
var queryString = require('./core/querystring');
var detectTouchScreen = require('./core/notouch');
var utils = require('./core/utils');
var trackMetric = require('./core/trackMetric');

var Navbar = require('./components/navbar');
var BrowserWarningOverlay = require('./components/browserwarningoverlay');
var ApiError = require('./components/apierror');
var TermsOverlay = require('./components/termsoverlay');
var MailTo = require('./components/mailto');

var Login = require('./pages/login');
var Logout = require('./pages/logout');
var Signup = require('./pages/signup');
var Profile = require('./pages/profile');
var Patients = require('./pages/patients');
var PatientEdit = require('./pages/patientedit');
var Patient = require('./pages/patient');
var PatientData = require('./pages/patientdata');
var RequestPasswordReset = require('./pages/passwordreset/request');
var ConfirmPasswordReset = require('./pages/passwordreset/confirm');

var deferAction = require('./actions/deferAction');

var AppActions = require('./actions/AppActions');
var AuthActions = require('./actions/AuthActions');

var AppStore = require('./stores/AppStore');
var AuthStore = require('./stores/AuthStore');

// Styles
require('tideline/css/tideline.less');
require('./core/less/fonts.less');
require('./style.less');

// For React developer tools
window.React = React;

var App = React.createClass({
  mixins: [Navigation, ActiveState],

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function() {
    return _.assign(AppStore.getState(), {
      authenticated: AuthStore.isAuthenticated()
    });
  },

  componentDidMount: function() {
    AppStore.addChangeListener(this.handleStoreChange);
    AuthStore.addChangeListener(this.handleStoreChange);
  },

  componentWillUnmount: function() {
    AppStore.removeChangeListener(this.handleStoreChange);
    AuthStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    this.setState(this.getStateFromStores());
  },

  render: function() {
    var overlay = this.renderOverlay();
    var navbar = this.renderNavbar();
    var footer = this.renderFooter();

    return (
      <div className="app">
        {overlay}
        <ApiError />
        {navbar}
        <this.props.activeRouteHandler />
        {footer}
      </div>
    );
  },

  renderOverlay: function() {
    if (!utils.isChrome() && !this.state.dismissedBrowserWarning) {
      return (
        <BrowserWarningOverlay onSubmit={this.handleDismissBrowserWarning} />
      );
    }

    if (this.state.showingAcceptTerms) {
      return (
        <TermsOverlay
          onSubmit={this.handleAcceptTerms} />
      );
    }

    return null;
  },

  renderNavbar: function() {
    if (this.state.authenticated) {
      return (
        <div className="App-navbar">
          <Navbar
            version={config.VERSION}
            patientId={this.getActiveParams().patientId}
            getUploadUrl={api.getUploadUrl.bind(api)} />
        </div>
      );
    }

    return null;
  },

  renderFooter: function() {
    return (
      <div className='container-small-outer footer'>
        <div className='container-small-inner'>
          <MailTo
            linkTitle={'Send us feedback'}
            emailAddress={'support@tidepool.org'}
            emailSubject={'Feedback on Blip'}
            onLinkClicked={this.logSupportContact} />
        </div>
      </div>
    );
  },

  logSupportContact: function(){
    trackMetric('Clicked Give Feedback');
  },

  handleAcceptTerms: function() {
    AppActions.acceptTerms();
  },

  handleDismissBrowserWarning: function() {
    AppActions.dismissBrowserWarning();
  }
});

var routes = (
  <Routes>
    <Route name="app" path="/" handler={App}>
      <Route name="login" handler={Login}/>
      <Route name="logout" handler={Logout}/>
      <Route name="signup" handler={Signup}/>
      <Route name="profile" handler={Profile}/>
      <Route name="patients" handler={Patients}/>
      <Route name="patient-new" path="patients/new" handler={PatientEdit}/>
      <Route name="patient-profile" path="patients/:patientId/profile" handler={Patient}/>
      <Route name="patient-share" path="patients/:patientId/share" handler={Patient} shareOnly={true}/>
      <Route name="patient-data" path="patients/:patientId/data" handler={PatientData}/>
      <Route name="request-password-reset" handler={RequestPasswordReset}/>
      <Route name="confirm-password-reset" handler={ConfirmPasswordReset}/>
      <Redirect from="/" to="/patients"/>
      <Redirect from="/patients/:patientId" to="/patients/:patientId/data"/>
    </Route>
  </Routes>
);

var app = {
  log: bows('App'),
  api: api,
  actions: {},
  stores: {},
  AppDispatcher: require('./AppDispatcher')
};

// Attach stores and actions for easier debugging
app.actions.ApiErrorActions = require('./actions/ApiErrorActions');
app.actions.AppActions = require('./actions/AppActions');
app.actions.AuthActions = require('./actions/AuthActions');
app.actions.GroupActions = require('./actions/GroupActions');
app.actions.HealthDataActions = require('./actions/HealthDataActions');
app.actions.InvitationReceivedActions = require('./actions/InvitationReceivedActions');
app.actions.InvitationSentActions = require('./actions/InvitationSentActions');
app.actions.MemberActions = require('./actions/MemberActions');
app.actions.MessageThreadActions = require('./actions/MessageThreadActions');

app.stores.ApiErrorStore = require('./stores/ApiErrorStore');
app.stores.AppStore = require('./stores/AppStore');
app.stores.AuthStore = require('./stores/AuthStore');
app.stores.GroupStore = require('./stores/GroupStore');
app.stores.InvitationReceivedStore = require('./stores/InvitationReceivedStore');
app.stores.InvitationSentStore = require('./stores/InvitationSentStore');
app.stores.MemberStore = require('./stores/MemberStore');
app.stores.MessageThreadStore = require('./stores/MessageThreadStore');
app.stores.TidelineDataStore = require('./stores/TidelineDataStore');
app.stores.UserStore = require('./stores/UserStore');

app.start = function() {
  var self = this;

  this.init(function() {
    React.renderComponent(routes, document.getElementById('app'));
    self.log('App started');

    if (self.mock) {
      self.log('App running with mock services');
    }
  });
};

app.useMock = function(mock) {
  this.mock = mock;
  api = mock.patchApi(api);
};

app.init = function(callback) {
  var self = this;

  function beginInit() {
    initNoTouch();
  }

  function initNoTouch() {
    detectTouchScreen();
    initMock();
  }

  function initMock() {
    if (self.mock) {
      // Load mock params from config variables
      // and URL query string (before hash)
      var paramsConfig = queryString.parseTypes(config.MOCK_PARAMS);
      var paramsUrl = queryString.parseTypes(window.location.search);
      var params = _.assign(paramsConfig, paramsUrl);

      self.mock.init(params);
      self.log('Mock services initialized with params', params);
    }
    initAuth();
  }

  function initAuth() {
    var handleAuthStoreChange = function() {
      if (!AuthStore.isLoadingSession()) {
        AuthStore.removeChangeListener(handleAuthStoreChange);
        // NOTE: We are reacting to a store change and will render components
        // that are going to call actions when they mount
        // Make sure to let Flux cycle finish before doing that
        deferAction(callback);
      }
    };
    AuthStore.addChangeListener(handleAuthStoreChange);
    AuthActions.loadSession();
  }

  beginInit();
};

module.exports = app;
