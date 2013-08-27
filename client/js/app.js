var accessToken = '';
var view = {};
var data = {};
var model = {};
var viewClass = {};

$(function() {
  viewClass.Upload = Backbone.View.extend({
    initialize: function() {
    },
    render: function(groupId, tab) {
      var self = this;
      $.ajax({ url: "/template/joinUpload.ejs" }).done(function(template) {
        self.groupId = groupId;

        $('#bottom').show();  
        
        var html = _.template(template, tab ? {} : data.profile);
        
        self.$el.html(html);  
        self.$el.find('.go').addClass('disabed');

        $('#profile-setup-device-picker').fadeIn();

        self.$el.find('#upload-animas h2').click(self.aminas);
        self.$el.find('#upload-medtronic h2').click(self.medtronic);
        self.$el.find('#upload-dexcom h2').click(self.dexcom);
        self.$el.find('input[type=file]').change(self.ready);

        if(tab) {
          self.$el.find('.go').click(function() {
            model.upload(groupId, function(error, data) {
              if (error) {
                console.log('error');
                return;
              }

              console.log('uploaded within tab', data);
              //window.location.reload();
            });
          });         
        } else {
          self.$el.find('.go').click(function() {

            // todo: show progress that data is being uploaded
            view.overlay.wait();
            $('.go').html('Uploading and parsing data');

            model.upload(groupId, function(error, data) {
              if (error) {
                console.log('error');
                $('.go').html('Upload');
                return;
              }

              //window.location.reload();
              console.log('uploaded with no tab', data);

              //:set done uploading data

              $('.go').html('Parsing Complete!');

              router.navigate('group/' + groupId, {trigger: true});
            });
          });
        }
      });
    },
    fadeOut: function(callback) {
      $('#profile-setup-device-picker').slideDown(callback);
    },
    ready: function () {
      $('#uploadButton').removeClass('disabed');
    },
    aminas: function() {
      $('#upload-animas .device-import').slideToggle();
    },
    dexcom: function() {
      $('#upload-dexcom .device-import').slideToggle();
    },
    medtronic: function() {
      $('#upload-medtronic .device-import').slideToggle();
    }
  });

  viewClass.Messages = Backbone.View.extend({
    initialize: function() {
    },
    render: function(messages) {
      var self = this;
      $.ajax({ url: "/template/messages.ejs" }).done(function(template) {
        console.log('messages', messages);

        var html = _.template(template, {messages: messages || []});
        
        for(var i in messages) {
          timeline.drawComment(messages[i].createdTime.unixTime);
        }

        self.$el.html(html);  

        $(".thread >li").click(function() {
          timeline.scrollTo($(this).attr('id'));
        });

      });
    },
    load: function(groupId) {
      var self = this;
      this.get(groupId, function(error, messages) {
        self.render(messages);
      });
    },
    get: function(groupId, callback) {
      $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/group/'+ groupId +  '/messages?accessToken=' + accessToken + '&callback=?', function(messages) {
        callback(null, messages);
      });
    },
    messagesShown: false,
    hideTab: function() {
      $('.communication').hide();
      $('#messagesThreadHolder').hide();
    },
    scrollTo: function(id) {
      $('.thread').animate({
          scrollTop: $(".thread #" + id).offset().top
      });
    },
    showTab: function() {
      $('.communication').show();
      $('#messagesThreadHolder').show();
    },
    toggleMessages: function(show) {
      if(show) {
        $('#messageThread').show(0);
        $('#messageThread').animate({'margin-left': '788px', width:'300px'}, 500);

        setTimeout(function() {
          $('#messages').animate({'margin-right': '163px'}, 300); 
        }, 150);
        
        $('#timelineContainer').animate({width:'740px'}, 500); 
      } else {
        $('#messageThread').animate({'margin-left': '1088px', width:'0px'}, 500, function() {
          $('#messageThread').hide(0);
        });

        $('#messages').animate({'margin-right': '0px'}, 350);
        $('#timelineContainer').animate({width:'1041px'}, 500);
      }
      this.messagesShown = !this.messagesShown;
    }
  });
  
  view.overlay.white();
});

var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'dashboard': 'dashboard',
    'group/:id' : 'group',
    ':404': 'notFound'
  },
  home: function() {
    console.log('home');
    console.log('data', data);

    if(data.user && data.user.groupCount) {
      window.location.hash = 'dashboard';
    } else {
      view.login.render();
    }
  },
  dashboard: function() {
    if(data.user && data.user.groupCount) {
      view.dashboard.render();
    } else {
      window.location.hash = '';
    }
  },
  group: function(id) {
    console.log('groupid',id);

    // todo: refactor data loading...
    // todo: window data fetched from view
    // todo: handel when a user i looking at a page not logged in, or logged in but doesnt have permissions
    
    /*view.login.isUser(function(err, user) {
      view.dataHolder.get(id, user || {}, function(err, data) {
        console.log(data.group);
        view.header.render({
          patient: data.group.patient,
          user: user.fb || user,
          team: data.group.team
        }, {top: true, handel: true, logout: true});

        var group = _.find(user.groups || [], function(g) {return g.id === id}) || {};

        console.log('data', data);
        console.log('user', user);
        view.dataHolder.render(data.data, group.administrator);
      }); 
    });*/
  },
  notFound: function() {
    view.notFound.render();
  }
});

var hookFacebook = function() {
  FB.getLoginStatus(function(response) {
    console.log('getLoginStatus');

    model.user(function(error, user) {
      router = new Router();
      Backbone.history.start();
      console.log('start backbone');
    });
  });

  FB.Event.subscribe('auth.authResponseChange', function(response) {
    if (response.status === 'connected') {
      accessToken = response.authResponse.accessToken;
      console.log('authResponseChange');
    } else {
      data.user = null;
      
      window.location.hash = '';
      window.location.reload();
      return;
    }
  });  
};
