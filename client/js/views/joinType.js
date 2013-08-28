$(function() {

view.joinType =  new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/joinType.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function() {
    var self = this;

    view.overlay.white();

    view.login.fadeOut(function(){});

    model.groups.selectedNotAdmin(function(error, groups) {
      var info = {
        user: data.user.fb || data.user,
        groups: error || groups
      };
      
      self.$el.html(_.template(self.content, info));

      $('#login-usertype').fadeIn();
      view.header.render({top:true, handel: false});
    });
  },
  fadeOut: function(callback) {
    $('#login-usertype').fadeOut(callback);
  },
  events: { 
    "click #surrogate": "surrogate",
    "click #t1d": "t1d",
    "click #team-member": "member"
  },
  member:function() {
    router.navigate('dashboard', {trigger: true});
  },
  t1d: function() { 
    data.signup = {type: 'patient'};
    view.joinData.render();
  },
  surrogate: function() {
    data.signup = {type: 'surrogate'};
    view.joinData.render();
  },
  team: function() {
    // todo: setup user and load interface
  }
}))({el: $("#bottom")});

});