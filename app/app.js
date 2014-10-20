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

var nurseShark = require('tideline/plugins/nurseshark/');
var TidelineData = require('tideline/js/tidelinedata');

var config = require('./config');
var router = require('./router');
var api = require('./core/api');
var personUtils = require('./core/personutils');
var queryString = require('./core/querystring');
var detectTouchScreen = require('./core/notouch');
var utils = require('./core/utils');

var Navbar = require('./components/navbar');
var LogoutOverlay = require('./components/logoutoverlay');
var BrowserWarningOverlay = require('./components/browserwarningoverlay');
var Notification = require('./components/notification');
var TermsOverlay = require('./components/termsoverlay');
var MailTo = require('./components/mailto');

var Login = require('./pages/login');
var Signup = require('./pages/signup');
var Profile = require('./pages/profile');
var Patients = require('./pages/patients');
var Patient = require('./pages/patient');

var PatientEdit = require('./pages/patientedit');
var PatientData = require('./pages/patientdata');

var AuthActions = window.AuthActions = require('./actions/AuthActions');
var AuthStore = window.AuthStore = require('./stores/AuthStore');
var GroupActions = window.GroupActions = require('./actions/GroupActions');
var GroupStore = window.GroupStore = require('./stores/GroupStore');
var MemberStore = window.MemberStore = require('./stores/MemberStore');
var RequestActions = window.RequestActions = require('./actions/RequestActions');
var RequestStore = window.RequestStore = require('./stores/RequestStore');
var UserStore = window.UserStore = require('./stores/UserStore');

// Styles
require('tideline/css/tideline.less');
require('./core/less/fonts.less');
require('./style.less');

// For React developer tools
window.React = React;

var DEBUG = window.localStorage && window.localStorage.debug;

var app = {
  log: bows('App'),
  api: api,
  personUtils: personUtils,
  router: router
};

var routes = {
  '/': 'redirectToDefaultRoute',
  '/login': 'showLogin',
  '/signup': 'showSignup',
  '/profile': 'showProfile',
  '/patients': 'showPatients',
  '/patients/new': 'showPatientNew',
  '/patients/:id': 'showPatient',
  '/patients/:id/data': 'showPatientData'
};

var noAuthRoutes = ['/login', '/signup'];

var defaultNotAuthenticatedRoute = '/login';
var defaultAuthenticatedRoute = '/patients';

// Shallow difference of two objects
// Returns all attributes and their values in `destination`
// that have different values from `source`
function objectDifference(destination, source) {
  var result = {};

  _.forEach(source, function(sourceValue, key) {
    var destinactionValue = destination[key];
    if (!_.isEqual(sourceValue, destinactionValue)) {
      result[key] = destinactionValue;
    }
  });

  return result;
}

function trackMetric() {
  var args = Array.prototype.slice.call(arguments);
  return app.api.metrics.track.apply(app.api.metrics, args);
}

var AppComponent = React.createClass({
  getInitialState: function() {
    return _.assign({
      notification: null,
      page: null,
      invites: null,
      fetchingInvites: true,
      pendingInvites:null,
      fetchingPendingInvites: true,
      bgPrefs: null,
      patientData: null,
      fetchingPatientData: true,
      fetchingMessageData: true,
      showingAcceptTerms: false,
      showingWelcomeMessage: false,
      dismissedBrowserWarning: false,
      queryParams: queryString.parseTypes(window.location.search)
    }, this.getStateFromStores());
  },

  // This is a React anti-pattern, but it is used like `this.renderPage`,
  // to be removed when we switch to `react-router`
  patientId: null,

  getStateFromStores: function() {
    return {
      authenticated: AuthStore.isAuthenticated(),
      user: AuthStore.getLoggedInUser(),
      loggingOut: AuthStore.isLoggingOut(),
      patient: this.patientId ? GroupStore.get(this.patientId) : null,
      fetchingPatient: this.patientId ? GroupStore.isFetching(this.patientId) : true
    };
  },

  componentDidMount: function() {
    RequestStore.addChangeListener(this.handleStoreChange);
    AuthStore.addChangeListener(this.handleStoreChange);
    GroupStore.addChangeListener(this.handleStoreChange);
    this.setupAndStartRouter();
  },

  componentWillUnmount: function() {
    RequestStore.removeChangeListener(this.handleStoreChange);
    AuthStore.removeChangeListener(this.handleStoreChange);
    GroupStore.removeChangeListener(this.handleStoreChange);
  },

  handleStoreChange: function() {
    var requestError = RequestStore.getError();
    if (requestError) {
      this.handleApiError(requestError.original, requestError.message);
    }

    var isLogoutSuccessfull = (
      this.state.loggingOut && !AuthStore.isLoggingOut() && !requestError
    );
    if (isLogoutSuccessfull) {
      this.handleLogoutSuccess();
    }

    this.setState(this.getStateFromStores());
  },

  setupAndStartRouter: function() {
    var self = this;

    var routingTable = {};
    _.forEach(routes, function(handlerName, route) {
      routingTable[route] = self[handlerName];
    });

    var isAuthenticated = function() {
      return self.state.authenticated;
    };

    // Currently no-op
    var onRouteChange = function() {};

    app.router.setup(routingTable, {
      isAuthenticated: isAuthenticated,
      noAuthRoutes: noAuthRoutes,
      defaultNotAuthenticatedRoute: defaultNotAuthenticatedRoute,
      defaultAuthenticatedRoute: defaultAuthenticatedRoute,
      onRouteChange: onRouteChange
    });
    app.router.start();
  },

  componentWillUpdate: function(nextProps, nextState) {
    // Called on props or state changes
    // Since app main component has no props,
    // this will be called on a state change
    if (DEBUG) {
      var stateDiff = objectDifference(nextState, this.state);
      app.log('State changed', stateDiff);
    }
  },

  render: function() {
    var overlay = this.renderOverlay();
    var navbar = this.renderNavbar();
    var notification = this.renderNotification();
    var page = this.renderPage();
    var footer = this.renderFooter();

    /* jshint ignore:start */
    return (
      <div className="app">
        {overlay}
        {navbar}
        {notification}
        {page}
        {footer}
      </div>
    );
    /* jshint ignore:end */
  },

  renderOverlay: function() {
    if (this.state.loggingOut) {
      /* jshint ignore:start */
      return (
        <LogoutOverlay ref="logoutOverlay" />
      );
      /* jshint ignore:end */
    }

    if (!utils.isChrome() && !this.state.dismissedBrowserWarning) {
      /* jshint ignore:start */
      return (
        <BrowserWarningOverlay onSubmit={this.handleAcceptedBrowserWarning} />
      );
      /* jshint ignore:end */
    }

    if (this.state.showingAcceptTerms) {
      /* jshint ignore:start */
      return (
        <TermsOverlay
          onSubmit={this.handleAcceptedTerms}
          trackMetric={trackMetric} />
      );
      /* jshint ignore:end */
    }

    return null;
  },

  renderNavbar: function() {
    if (this.state.authenticated) {
      var patientId;
      var getUploadUrl;

      if (this.isPatientVisibleInNavbar()) {
        patientId = this.patientId;
        getUploadUrl = app.api.getUploadUrl.bind(app.api);
      }

      return (
        /* jshint ignore:start */
        <div className="App-navbar">
          <Navbar
            version={config.VERSION}
            patientId={patientId}
            currentPage={this.state.page}
            getUploadUrl={getUploadUrl}
            trackMetric={trackMetric}/>
        </div>
        /* jshint ignore:end */
      );
    }

    return null;
  },

  isPatientVisibleInNavbar: function() {
    // Only show patient name in navbar on certain pages
    var page = this.state.page;
    var result = page && page.match(/^patients\//);
    return Boolean(result);
  },

  renderNotification: function() {
    var notification = this.state.notification;
    var handleClose;

    if (notification) {
      if (notification.isDismissable) {
        handleClose = this.closeNotification;
      }

      return (
        /* jshint ignore:start */
        <Notification
          type={notification.type}
          onClose={handleClose}>
          {notification.body}
        </Notification>
        /* jshint ignore:end */
      );
    }

    return null;
  },

  logSupportContact: function(){
    trackMetric('Clicked Give Feedback');
  },

  renderFooter: function() {
    // just the feedbak link at this stage
    return (
      /* jshint ignore:start */
      <div className='container-small-outer footer'>
        <div className='container-small-inner'>
          <MailTo
            linkTitle={'Send us feedback'}
            emailAddress={'support@tidepool.org'}
            emailSubject={'Feedback on Blip'}
            onLinkClicked={this.logSupportContact} />
        </div>
      </div>
      /* jshint ignore:end */
    );
  },

  // Override on route change
  renderPage: function() {
    return null;
  },

  redirectToDefaultRoute: function() {
    app.router.setRoute(defaultAuthenticatedRoute);
  },

  showLogin: function() {
    this.renderPage = this.renderLogin;
    this.setState({page: 'login'});
  },

  renderLogin: function() {
    return (
      /* jshint ignore:start */
      <Login
        inviteEmail={this.getInviteEmail()}
        onLoginSuccess={this.handleLoginSuccess}
        trackMetric={trackMetric} />
      /* jshint ignore:end */
    );
  },

  getInviteEmail: function() {
    var hashQueryParams = app.router.getQueryParams();
    var inviteEmail = hashQueryParams.inviteEmail;
    if (inviteEmail && utils.validateEmail(inviteEmail)) {
      return inviteEmail;
    }
    else {
      return null;
    }
  },

  showSignup: function() {
    this.renderPage = this.renderSignup;
    this.setState({page: 'signup'});
  },

  renderSignup: function() {
    return (
      /* jshint ignore:start */
      <Signup
        inviteEmail={this.getInviteEmail()}
        onSignupSuccess={this.handleSignupSuccess}
        trackMetric={trackMetric} />
      /* jshint ignore:end */
    );
  },

  showProfile: function() {
    this.renderPage = this.renderProfile;
    this.setState({page: 'profile'});
    trackMetric('Viewed Account Edit');
  },

  renderProfile: function() {
    return (
      /* jshint ignore:start */
      <Profile
          onSubmit={this.updateUser}
          trackMetric={trackMetric}/>
      /* jshint ignore:end */
    );
  },

  showPatients: function() {
    this.renderPage = this.renderPatients;
    this.setState({page: 'patients'});
    // NOTE: need this to not cause "dispatch while dispatch under way" error
    // should go away when we switch to `react-router`
    _.defer(GroupActions.fetchAll);
    this.fetchInvites();
    trackMetric('Viewed Care Team List');
  },

  renderPatients: function() {
    /* jshint ignore:start */
    return (
      <Patients
          invites={this.state.invites}
          uploadUrl={app.api.getUploadUrl()}
          fetchingInvites={this.state.fetchingInvites}
          showingWelcomeMessage={this.state.showingWelcomeMessage}
          onSetAsCareGiver={this.setUserAsCareGiver}
          trackMetric={trackMetric}
          onAcceptInvitation={this.handleAcceptInvitation}
          onDismissInvitation={this.handleDismissInvitation}
          onRemovePatient={this.handleRemovePatient}/>
    );
    /* jshint ignore:end */
  },
  handleDismissInvitation: function(invitation) {
    var self = this;

    this.setState({
      invites: this.state.invites.filter(function(e){
        return e.key !== invitation.key;
      })
    });

    app.api.invitation.dismiss(invitation.key, invitation.creator.userid, function(err) {
      if(err) {
        self.fetchInvites();

        return self.handleApiError(err, 'Something went wrong while dismissing the invitation.');
      }
    });
  },
  handleAcceptInvitation: function(invitation) {
    /* Set invitation to processing */
    var invites = _.cloneDeep(this.state.invites);
    var self = this;

    invites.map(function(invite) {
      if (invite.key === invitation.key) {
        invite.accepting = true;
      }

      return invite;
    });

    this.setState({
      invites: invites
    });

    app.api.invitation.accept(invitation.key, invitation.creator.userid, function(err) {
      GroupActions.fetchAll();

      if(err) {
        return self.handleApiError(err, 'Something went wrong while accepting the invitation.');
      }

      self.setState({
        invites: self.state.invites.filter(function(e){
          return e.key !== invitation.key;
        })
      });
    });
  },
  handleChangeMemberPermissions: function(patientId, memberId, permissions, cb) {
    var self = this;

    api.access.setMemberPermissions(memberId, permissions, function(err) {
      if(err) {
        cb(err);
        return self.handleApiError(err, 'Something went wrong while changing member perimissions.');
      }

      GroupActions.fetch(patientId);
      cb();
    });
  },

  handleRemovePatient: function(patientId,cb) {
    var self = this;

    api.access.leaveGroup(patientId, function(err) {
      if(err) {
        return self.handleApiError(err, 'Something went wrong while removing member from group.');
      }

      GroupActions.fetchAll();
    });
  },

  handleRemoveMember: function(patientId, memberId, cb) {
    var self = this;

    api.access.removeMember(memberId, function(err) {
      if(err) {
        cb(err);
        return self.handleApiError(err, 'Something went wrong while removing member.');
      }

      GroupActions.fetch(patientId);
      cb();
    });
  },

  handleInviteMember: function(email, permissions, cb) {
    var self = this;

    api.invitation.send(email, permissions, function(err, invitation) {
      if(err) {
        if (cb) {
          cb(err);
        }
        if (err.status === 500) {
          return self.handleApiError(err, 'Something went wrong while inviting member.');
        }
        return;
      }

      self.setState({
        pendingInvites: utils.concat(self.state.pendingInvites || [], invitation)
      });
      if (cb) {
        cb(null, invitation);
      }
      self.fetchPendingInvites();
    });
  },

  handleCancelInvite: function(email, cb) {
    var self = this;

    api.invitation.cancel(email, function(err) {
      if(err) {
        if (cb) {
          cb(err);
        }
        return self.handleApiError(err, 'Something went wrong while canceling the invitation.');
      }

      self.setState({
        pendingInvites: _.reject(self.state.pendingInvites, function(i) {
          return i.email === email;
        })
      });
      if (cb) {
        cb();
      }
      self.fetchPendingInvites();
    });
  },
  showPatient: function(patientId) {
    this.renderPage = this.renderPatient;
    this.patientId = patientId;
    this.setState({
      page: 'patients/' + patientId,
      // Reset patient object to avoid showing previous one
      patient: null,
      // Indicate renderPatient() that we are fetching the patient
      // (important to have this on next render)
      fetchingPatient: true
    });
    this.fetchPendingInvites();
    _.defer(GroupActions.fetch.bind(GroupActions, this.patientId));
    trackMetric('Viewed Profile');
  },

  renderPatient: function() {
    /* jshint ignore:start */
    return (
      <Patient
        patientId={this.patientId}
        onUpdatePatient={this.updatePatient}
        pendingInvites={this.state.pendingInvites}
        onChangeMemberPermissions={this.handleChangeMemberPermissions}
        onRemoveMember={this.handleRemoveMember}
        onInviteMember={this.handleInviteMember}
        onCancelInvite={this.handleCancelInvite}
        trackMetric={trackMetric}/>
    );
    /* jshint ignore:end */
  },

  showPatientNew: function() {
    this.renderPage = this.renderPatientNew;
    this.setState({
      page: 'patients/new',
      patient: null,
      fetchingPatient: false
    });
    trackMetric('Viewed Profile Create');
  },

  renderPatientNew: function() {
    var user = this.state.user;
    var patient;

    // Make sure user doesn't already have a patient
    if (this.isDoneFetchingAndUserHasPatient()) {
      var patientId = user.userid;
      var route = '/patients/' + patientId;
      app.log('User already has patient');
      app.router.setRoute(route);
      return;
    }

    if (user) {
      patient = {
        userid: user.userid,
        profile: _.assign({}, user.profile, {patient: {}})
      };
    }

    /* jshint ignore:start */
    return (
      <PatientEdit
          patient={patient}
          fetchingPatient={this.state.fetchingUser}
          isNewPatient={true}
          onSubmit={this.createPatient}
          onSubmitSuccess={this.handlePatientCreationSuccess}
          trackMetric={trackMetric}/>
    );
    /* jshint ignore:end */
  },

  isDoneFetchingAndUserHasPatient: function() {
    // Wait to have user object back from server
    if (this.state.fetchingUser) {
      return false;
    }

    return personUtils.isPatient(this.state.user);
  },

  isSamePersonUserAndPatient: function() {
    return personUtils.isSame(this.state.user, this.state.patient);
  },

  showPatientData: function(patientId) {
    this.renderPage = this.renderPatientData;
    this.patientId = patientId;
    this.setState({
      page: 'patients/' + patientId + '/data',
      patient: null,
      fetchingPatient: true,
      patientData: null,
      fetchingPatientData: true
    });

    var self = this;
    _.defer(GroupActions.fetch.bind(GroupActions, this.patientId));
    this.fetchPatientData(this.patientId);

    trackMetric('Viewed Data');
  },

  renderPatientData: function() {
    // On each state change check if patient object was returned from server
    if (this.isDoneFetchingAndNotFoundPatient()) {
      app.log('Patient not found');
      this.redirectToDefaultRoute();
      return;
    }

    /* jshint ignore:start */
    return (
      <PatientData
        patientId={this.patientId}
        bgPrefs={this.state.bgPrefs}
        patientData={this.state.patientData}
        fetchingPatientData={this.state.fetchingPatientData}
        isUserPatient={this.isSamePersonUserAndPatient()}
        queryParams={this.state.queryParams}
        uploadUrl={app.api.getUploadUrl()}
        onRefresh={this.fetchCurrentPatientData}
        onFetchMessageThread={this.fetchMessageThread}
        onSaveComment={app.api.team.replyToMessageThread.bind(app.api.team)}
        onCreateMessage={app.api.team.startMessageThread.bind(app.api.team)}
        onEditMessage={app.api.team.editMessage.bind(app.api.team)}
        onUpdatePatientData={this.handleUpdatePatientData}
        trackMetric={trackMetric}/>
    );
    /* jshint ignore:end */
  },

  handleUpdatePatientData: function(data) {
    this.setState({
      patientData: data
    });
  },

  handleLoginSuccess: function() {
    this.redirectToDefaultRoute();
    trackMetric('Logged In');
  },

  handleSignupSuccess: function(user) {
    this.setState({
      showingAcceptTerms: config.SHOW_ACCEPT_TERMS ? true : false,
      showingWelcomeMessage: true
    });
    this.redirectToDefaultRoute();
    trackMetric('Signed Up');
  },

  handleAcceptedTerms: function() {
    this.setState({
      showingAcceptTerms: false
    });
  },

  handleAcceptedBrowserWarning: function() {
    this.setState({
      dismissedBrowserWarning: true
    });
  },

  handleLogoutSuccess: function() {
    // Nasty race condition between React state change and router it seems,
    // need to call `showLogin()` to make sure we don't try to render something
    // else, although it will get called again after router changes route, but
    // that's ok
    this.showLogin();
    this.clearUserData();
    this.setState({dismissedBrowserWarning: false});
    router.setRoute('/login');
  },

  closeNotification: function() {
    RequestActions.dismissError();
    this.setState({notification: null});
  },

  fetchPendingInvites: function(cb) {
    var self = this;

    self.setState({fetchingPendingInvites: true});

    api.invitation.getSent(function(err, invites) {
      if (err) {
        var message = 'Something went wrong while fetching pending invites';

        self.setState({
          fetchingPendingInvites: false
        });

        if (cb) {
          cb(err);
        }

        return self.handleApiError(err, message);
      }

      self.setState({
        pendingInvites: invites,
        fetchingPendingInvites: false
      });

      if (cb) {
        cb();
      }
    });
  },

  fetchInvites: function() {
    var self = this;

    self.setState({fetchingInvites: true});

    api.invitation.getReceived(function(err, invites) {
      if (err) {
        var message = 'Something went wrong while fetching invitations';

        self.setState({
          fetchingInvites: false
        });

        return self.handleApiError(err, message);
      }

      self.setState({
        invites: invites,
        fetchingInvites: false
      });
    });
  },

  fetchPatientData: function(patientId) {
    var self = this;

    self.setState({fetchingPatientData: true});

    var loadPatientData = function(cb) {
      app.api.patientData.get(patientId, cb);
    };

    var loadTeamNotes = function(cb) {
      app.api.team.getNotes(patientId, cb);
    };

    async.parallel({
      patientData: loadPatientData,
      teamNotes: loadTeamNotes
    },
    function(err, results) {
      if (err) {
        var message = 'Error fetching data for patient with id ' + patientId;
        self.setState({fetchingPatientData: false});

        // Patient with id not found, cary on
        if (err.status === 404) {
          app.log(message);
          return;
        }

        return self.handleApiError(err, message);
      }

      var patientData = results.patientData || [];
      var notes = results.teamNotes || [];

      app.log('Patient device data count', patientData.length);
      app.log('Team notes count', notes.length);

      var combinedData = patientData.concat(notes);
      window.downloadInputData = function() {
        console.save(combinedData, 'blip-input.json');
      };
      patientData = self.processPatientData(combinedData);

      self.setState({
        bgPrefs: {
          bgClasses: patientData.bgClasses,
          bgUnits: patientData.bgUnits
        },
        patientData: patientData,
        fetchingPatientData: false
      });
    });
  },

  fetchMessageThread: function(messageId,callback) {
    app.log('fetching messages for ' + messageId);

    var self = this;
    self.setState({fetchingMessageData: true});

    app.api.team.getMessageThread(messageId,function(err, thread){
      self.setState({fetchingMessageData: false});

      if (err) {
        var message =
          'Error fetching data for message thread with id ' + messageId;
        self.handleApiError(err, message);
        return callback(null);
      }

      app.log('Fetched message thread with '+thread.length+' messages');
      return callback(thread);
    });
  },

  processPatientData: function(data) {
    if (!(data && data.length >= 0)) {
      return null;
    }

    var res = nurseShark.processData(data);
    var tidelineData = new TidelineData(res.processedData);

    window.tidelineData = tidelineData;
    window.downloadProcessedData = function() {
      console.save(res.processedData);
    };

    return tidelineData;
  },

  fetchCurrentPatientData: function() {
    if (!this.patientId) {
      return;
    }

    this.fetchPatientData(this.patientId);
  },

  clearUserData: function() {
    this.setState({
      patient: null,
      patientData: null
    });
  },

  updateUser: function(formValues) {
    var self = this;
    var previousUser = this.state.user;

    var user = _.assign(
      {},
      _.omit(previousUser, 'profile'),
      _.omit(formValues, 'profile'),
      {profile: _.assign({}, previousUser.profile, formValues.profile)}
    );

    // Optimistic update
    self.setState({user: _.omit(user, 'password')});

    // If username hasn't changed, don't try to update
    // or else backend will respond with "already taken" error
    if (user.username === previousUser.username) {
      user = _.omit(user, 'username', 'emails');
    }

    app.api.user.put(user, function(err, user) {
      if (err) {
        var message = 'An error occured while updating user account';
        // Rollback
        self.setState({user: previousUser});
        return self.handleApiError(err, message);
      }
      self.setState({user: user});
      trackMetric('Updated Account');
    });
  },

  setUserAsCareGiver: function() {
    this.updateUser({
      profile: {isOnlyCareGiver: true}
    });
  },

  createPatient: function(patient, cb) {
    app.api.patient.post(patient, cb);
  },

  handlePatientCreationSuccess: function(patient) {
    trackMetric('Created Profile');
    this.setState({
      user: _.extend({}, this.state.user, {
        profile: _.cloneDeep(patient.profile)
      }),
      patient: patient
    });
    var route = '/patients/' + patient.userid + '/data';
    app.router.setRoute(route);
  },

  updatePatient: function(patient) {
    var self = this;
    var previousPatient = this.state.patient;

    // Optimistic update
    self.setState({patient: patient});

    app.api.patient.put(patient, function(err, patient) {
      if (err) {
        var message = 'An error occured while saving patient';
        // Rollback
        self.setState({patient: previousPatient});
        return self.handleApiError(err, message);
      }
      self.setState({
        patient: _.assign({}, previousPatient, {profile: patient.profile})
      });
      trackMetric('Updated Profile');
    });
  },

  handleApiError: function(error, message) {
    if (message) {
      app.log(message);
    }

    var self = this;
    var status = error.status;
    var originalErrorMessage = [
      message, this.stringifyApiError(error)
    ].join(' ');

    var type = 'error';
    var body;
    /* jshint ignore:start */
    body = (
      <p>
        {'Sorry! Something went wrong. '}
        {'It\'s our fault, not yours. We\'re going to go investigate. '}
        {'For the time being, go ahead and '}
        <a href="/">refresh your browser</a>
        {'.'}
      </p>
    );
    /* jshint ignore:end */
    var isDismissable = true;

    if (status === 401) {
      var handleLogBackIn = function(e) {
        e.preventDefault();
        self.setState({notification: null});
        // We don't actually go through logout process,
        // so safer to manually destroy local session
        app.api.user.destroySession();
        self.handleLogoutSuccess();
      };

      type = 'alert';
      originalErrorMessage = null;
      /* jshint ignore:start */
      body = (
        <p>
          {'To keep your data safe we logged you out. '}
          <a
            href=""
            onClick={handleLogBackIn}>Click here to log back in</a>
          {'.'}
        </p>
      );
      /* jshint ignore:end */
      isDismissable = false;
    }

    //Check that this isn't a 401 where error message adds no context
    if (!_.isEmpty(originalErrorMessage) && status !== 401) {
      /* jshint ignore:start */
      body = (
        <div>
          {body}
          <p className="notification-body-small">
            <code>{'Original error message: ' + originalErrorMessage}</code>
          </p>
        </div>
      );
      /* jshint ignore:end */
    }

    // Send error to backend tracking
    app.api.errors.log(this.stringifyApiError(error), message);

    this.setState({
      notification: {
        type: type,
        body: body,
        isDismissable: isDismissable
      }
    });
  },

  stringifyApiError: function(error) {
    if (_.isPlainObject(error)) {
      return JSON.stringify(error);
    }
    else {
      return error.toString();
    }
  }
});

app.start = function() {
  var self = this;

  this.init(function() {
    self.component = React.renderComponent(
      /* jshint ignore:start */
      <AppComponent />,
      /* jshint ignore:end */
      document.getElementById('app')
    );

    self.log('App started');

    if (self.mock) {
      self.log('App running with mock services');
    }
  });
};

app.useMock = function(mock) {
  this.mock = mock;
  this.api = mock.patchApi(this.api);
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
        callback();
      }
    };
    AuthStore.addChangeListener(handleAuthStoreChange);
    AuthActions.loadSession();
  }

  beginInit();
};

module.exports = app;
