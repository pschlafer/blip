$(function() {

view.login = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/login.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function() {
    this.$el.show();
    
    this.$el.html(_.template(this.content));

    view.header.render({top: true, handel: false, hidePatientTop: true});

    this.$el.find('#login').fadeIn();
    view.overlay.opaque();
  },
  fadeOut: function(callback) {
    $('#login').fadeOut(callback);
  },
  events: { 
    "click #loginButton": "join",
    "click #signin": "signin"
  },
  signin: function() {
    FB.login(function(response) {
      if (response.authResponse) {
        accessToken = response.authResponse.accessToken;
        
        window.location.reload();
      }
    }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
  },
  join: function(event){ 
    if(typeof FB == 'undefined') 
      return;

    FB.login(function(response) {
      if (response.authResponse) {
        accessToken = response.authResponse.accessToken;

        model.user(function(error, user) {
          if(error) {
            console.log(error);
            return;
          }

          if(!user.fb && user.groupCount) {
            router.navigate('dashboard', {trigger: true});
          } else {
            view.joinType.render();
          }
        });
      } else {
        window.location.hash = '';
        window.location.reload();
      }
    }, {scope: 'user_groups,user_birthday,user_status,user_about_me,publish_actions,email'});
  }
}))({el: $("#bottom")});

});