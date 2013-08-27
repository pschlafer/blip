$(function() {

view.header = new (Backbone.View.extend({
  patientShown: false,
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/header.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function(options) {
    var self = this;
		console.log(options);
    //todo: render team.
		info = data.user ? { user: data.user.fb || data.user } : {};
    
    if(data.user && data.user.patient) {
    	info.patient = data.user.patient;
    }

    if(options.patient) {
      info.patient = options.patient;
    }
    
    info.options = options;
    info.options.logout = !!data.user;

    if(options.groupId) {
      console.log('testing header render groupId', options.groupId , 'groups', info);
      info.team = _.find(data.user.groups, function(e) { return e.id === options.groupId.toString()});

      model.groups.get(options.groupId, function(error, group) {
        info.team = group.team;

        self.$el.html(_.template(self.content, info));

        if(options.top) {
          self.top();
        } else {
          self.bottom();
        }

        if(options.showPatient) {
          $('#content-header').show();  

          $('#current_patient h1').css({
            top: '5px',
            left: '112px'
          });

          $('#current_patient img').css({
            width: '80px',
            left: '20px',
            top: '80px'
          });

          self.patientShown = true;
        } else {
          self.patientShown = false;
          self.hidePatient();
        }
        self.$el.show();
      });
    } else {
      this.$el.html(_.template(this.content, info));  

      if(options.top) {
        this.top();
      } else {
        this.bottom();
      }

      if(options.showPatient) {
        this.patientShown = true;
        this.showPatient();
      } else {
        this.patientShown = false;
        this.hidePatient();
      }
      this.$el.show();
    }
  },
  events: {
    "click #logout": "logout",
    "click #handel-header": "togglePatient"
  },
  togglePatient: function() {
    if(view.header.patientShown) {
      view.header.hidePatient();
    } else {
      view.header.showPatient();
    }
    view.header.patientShown = !view.header.patientShown;
  },
  hidePatient: function() {
    $('#content-header').slideUp();  

    $('#current_patient h1').animate({
      top: '-35px',
      left: '215px'
    });

    $('#current_patient img').animate({
      width: '70px',
      left: '135px',
      top: '32px'
    });
  },
  showPatient: function(time) {
    $('#content-header').slideDown();  

    $('#current_patient h1').animate({
      top: '5px',
      left: '112px'
    });

    $('#current_patient img').animate({
      width: '80px',
      left: '20px',
      top: '80px'
    });
  },
  top: function() {
    this.$el.css('position','relative');
  },
  bottom: function() {
    this.$el.css('position','fixed');
  },
  logout: function() {
    FB.logout();
  }
}))({el: $("header")});

});