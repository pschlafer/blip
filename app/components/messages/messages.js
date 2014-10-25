/**
 * @jsx React.DOM
 */

/*
== BSD2 LICENSE ==
Copyright (c) 2014, Tidepool Project

This program is free software; you can redistribute it and/or modify it under
the terms of the associated License, which is identical to the BSD 2-Clause
License as published by the Open Source Initiative at opensource.org.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the License for more details.

You should have received a copy of the License along with this program; if
not, you can obtain one from Tidepool Project at tidepool.org.
== BSD2 LICENSE ==
*/
'use strict';

var React = require('react');
var _ = require('lodash');
var sundial = require('sundial');

var Message = require('./message');
var MessageForm = require('./messageform');

var AuthStore = require('../../stores/AuthStore');
var MessageThreadActions = require('../../actions/MessageThreadActions');
var MessageThreadStore = require('../../stores/MessageThreadStore');

var Messages = React.createClass({

  propTypes: {
    threadId : React.PropTypes.string,
    createDatetime : React.PropTypes.string,
    patientId : React.PropTypes.string,
    onClose : React.PropTypes.func,
    onEditMessage : React.PropTypes.func,
    onCreateThread : React.PropTypes.func,
    onAddComment : React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      NOTE_PROMPT : 'Type a new note here ...',
      COMMENT_PROMPT : 'Type a comment here ...'
    };
  },

  getInitialState: function() {
    return this.getStateFromStores();
  },

  getStateFromStores: function(props) {
    props = props || this.props;
    return {
      user: AuthStore.getLoggedInUser(),
      messages: props.threadId ? MessageThreadStore.get(props.threadId) : null,
      fetchingMessages: props.threadId ? MessageThreadStore.isFetching(props.threadId) : false,
      creatingThread: MessageThreadStore.isCreating(),
      addingComment: props.threadId ? MessageThreadStore.isUpdating(props.threadId) : false
    };
  },

  componentDidMount: function() {
    AuthStore.addChangeListener(this.handleStoreChange);
    MessageThreadStore.addChangeListener(this.handleStoreChange);
    this.fetchMessageThreadIfNeeded();
  },

  componentWillUnmount: function() {
    AuthStore.removeChangeListener(this.handleStoreChange);
    MessageThreadStore.removeChangeListener(this.handleStoreChange);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this.getStateFromStores(nextProps));
    this.fetchMessageThreadIfNeeded(nextProps);
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (prevState.creatingThread && !this.state.creatingThread) {
      // Not very clean here, but Tideline needs the new note with its id
      this.props.onCreateThread(MessageThreadStore.getNewThread()[0]);
      // Close modal after new thread creation
      this.props.onClose();
    }
    else if (prevState.addingComment && !this.state.addingComment) {
      this.props.onAddComment(this.state.messages[this.state.messages.length - 1]);
      this.refs.commentForm.resetAfterCommentAdded();
    }
  },

  handleStoreChange: function() {
    if (!this.isMounted()) {
      return;
    }
    this.setState(this.getStateFromStores());
  },

  fetchMessageThreadIfNeeded: function(props) {
    props = props || this.props;
    if (props.threadId) {
      MessageThreadActions.fetch(props.threadId);
    }
  },

  /*
   * Should the use be able to edit this message?
   */
  getSaveEdit:function(messageUserId){
    var saveEdit;
    if(messageUserId === this.state.user.userid){
      saveEdit = this.handleEditNote;
    }
    return saveEdit;
  },
  renderNote: function(message){
    /* jshint ignore:start */
    return (
      <Message
        key={message.id}
        theNote={message}
        imageSize='large'
        onSaveEdit={this.getSaveEdit(message.userid)}/>
      );
    /* jshint ignore:end */
  },
  renderComment:function(message){
    /* jshint ignore:start */
    return (
      <Message
        key={message.id}
        theNote={message}
        imageSize='small'
        onSaveEdit={this.getSaveEdit(message.userid)}/>
      );
    /* jshint ignore:end */
  },
  renderThread:function(){

    if(this.isMessageThread()){

      var thread = _.map(this.state.messages, function(message) {
        if(!message.parentmessage) {
          return this.renderNote(message);
        } else if (message.parentmessage) {
          return this.renderComment(message);
        }
      }.bind(this));

      /* jshint ignore:start */
      return (
        <div className='messages-thread'>{thread}</div>
      );
      /* jshint ignore:end */
    }

    return;
  },
  isMessageThread:function(){
    return Boolean(this.props.threadId);
  },
  renderCommentOnThreadForm:function(){

    var submitButtonText = 'Comment';

    /* jshint ignore:start */
    return (
      <div className='messages-form'>
        <MessageForm
          ref='commentForm'
          messagePrompt={this.props.COMMENT_PROMPT}
          saveBtnText={submitButtonText}
          onSubmit={this.handleAddComment}
          working={this.state.addingComment} />
      </div>
    );
    /* jshint ignore:end */

  },
  renderNewThreadForm:function(){

    var submitButtonText = 'Post';

    /* jshint ignore:start */
    return (
      <div className='messages-form'>
        <MessageForm
            formFields={{ editableTimestamp : this.props.createDatetime }}
            messagePrompt={this.props.NOTE_PROMPT}
            saveBtnText={submitButtonText}
            onSubmit={this.handleCreateNote}
            onCancel={this.handleClose}
            working={this.state.creatingThread} />
      </div>
    );
      /* jshint ignore:end */

  },
  renderClose:function(){
    /* jshint ignore:start */
    return (<a className='messages-close' onClick={this.handleClose}>Close</a>);
    /* jshint ignore:end */
  },
  renderLoading: function() {
    // Show loading indicator only if there is nothing else to show
    if (_.isEmpty(this.state.messages) && this.state.fetchingMessages) {
      return <div className="messages-loading">Loading message thread...</div>;
    }
    return null;
  },
  render: function() {

    var thread = this.renderThread();
    var form = this.renderNewThreadForm() ;
    var close;
    var loading;

    //If we are closing an existing thread then have close and render the comment form
    if(thread){
      close = this.renderClose();
      loading = this.renderLoading();
      form = this.renderCommentOnThreadForm();
    }

    return (
     /* jshint ignore:start */
     <div className='messages'>
      <div className='messages-inner'>
        <div className='messages-header'>
          {close}
        </div>
        <div>
          {loading}
          {thread}
          {form}
        </div>
      </div>
     </div>
     /* jshint ignore:end */
     );
  },
  getParent : function(){
    if(this.isMessageThread()){
      return _.first(this.state.messages, function(message){ return !(message.parentmessage); })[0];
    }
    return;
  },
  handleAddComment : function (formValues,cb){

    if(_.isEmpty(formValues) === false){

      var addComment = this.props.onSave;
      var parent = this.getParent();

      var comment = {
        parentmessage : parent.id,
        userid : this.state.user.userid,
        groupid : parent.groupid,
        messagetext : formValues.text,
        timestamp : formValues.timestamp
      };

      MessageThreadActions.comment(comment.parentmessage, comment);
    }
  },
  handleCreateNote: function (formValues,cb){

    if(_.isEmpty(formValues) === false){

      var createNote = this.props.onSave;

      var message = {
        userid : this.state.user.userid,
        groupid : this.props.patientId,
        messagetext : formValues.text,
        timestamp : sundial.formatForStorage(formValues.timestamp,sundial.getOffset())
      };

      MessageThreadActions.create(message);
    }
  },
  handleEditNote: function (updated){
    if(_.isEmpty(updated) === false){
      MessageThreadActions.editMessage(updated);
      this.props.onEditMessage(updated);
    }
  },
  handleClose: function(e) {
    if(e){
      e.preventDefault();
    }
    var close = this.props.onClose;
    if (close) {
      close();
    }
  }
});

module.exports = Messages;
