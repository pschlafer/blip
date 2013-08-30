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
    console.error('header options', options);

    var self = this;
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
          self.showPatient();
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
      top: '-30px',
      left: '210px'
    });

    $('#current_patient img').animate({
      width: '60px',
      left: '135px',
      top: '32px'
    });
  },
  showPatient: function(time) {
    if(time){
      $('#content-header').show();    
    } else {
      $('#content-header').slideDown();  
    }
    
    var h1 = {
      top: '5px',
      left: '112px'
    };

    if(time) {
      $('#current_patient h1').css(h1);
    } else {
      $('#current_patient h1').animate(h1);
    }
    
    var img = {
      width: '70px',
      left: '20px',
      top: '80px'
    };

    if(time) {
      $('#current_patient img').css(img);
    } else {
      $('#current_patient img').animate(img);
    }
  },
  top: function() {
    this.$el.css('position','relative');
  },
  bottom: function() {
    this.$el.css('position','fixed');
  },
  logout: function() {
    console.info('loggin out');
    
    view.overlay.wait('Logging out');

    FB.logout();
  }
}))({el: $("header")});

});