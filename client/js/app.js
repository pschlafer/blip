var accessToken = '';
var view = {};
var data = {};
var model = {};
var viewClass = {};

$(function() {
  view.overlay.wait();

  viewClass.Upload = Backbone.View.extend({
    initialize: function() {
    },
    render: function(groupId, tab) {
      var self = this;
      $.ajax({ url: "/template/joinUpload.ejs" }).done(function(template) {
        self.groupId = groupId;

        $('#bottom').show();  

        var info = tab ? {cleanUrl: 'http://' + $('#api_endpoint').attr('content') + '/v1/' + data.user.id + '/cleanallthedata?accessToken=' + accessToken} : data.profile;
        var html = _.template(template,info);

        self.$el.html(html);  
        self.$el.find('.go').addClass('disabed');

        $('#profile-setup-device-picker').fadeIn();

        if(info && info.cleanUrl) {
          self.$el.find('#remove').click(function() {
            view.overlay.wait('Removing Entries');
            $.getJSON(info.cleanUrl + '&callback=?', function() {
              window.location.hash = '';
              FB.logout();
              window.location.reload();
            }).error(function(error) {
              view.overlay.white();
            });
          });  
        }
        
        self.$el.find('#upload-animas h2').click(self.aminas);
        self.$el.find('#upload-medtronic h2').click(self.medtronic);
        self.$el.find('#upload-dexcom h2').click(self.dexcom);
        self.$el.find('input[type=file]').change(self.ready);

        if(tab) {
          self.$el.find('.go').click(function() {
            view.overlay.wait('Uploading');
            $('.go').html('Uploading and parsing data');

            model.upload(groupId, function(error, data) {
              if (error) {
                alert('An error occured while uploading data')
                console.error('error',error);
                $('.go').html('Upload');
                view.overlay.white();
                return;
              }

              setTimeout(function() {
                view.overlay.wait('Loading Data');
              }, 5000);

              window.location.reload();
            });
          });         
        } else {
          self.$el.find('.go').click(function() {
            // todo: show progress that data is being uploaded
            view.overlay.wait('Uploading');
            $('.go').html('Uploading and parsing data');

            model.upload(groupId, function(error, data) {
              if (error) {
                alert('An error occured while uploading data')
                console.error('error',error);
                $('.go').html('Upload');
                view.overlay.white();
                return;
              }

              setTimeout(function() {
                view.overlay.wait('Loading Data');
              }, 5000);

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
});

var Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'dashboard': 'dashboard',
    'group/:id' : 'group',
    ':404': 'notFound'
  },
  home: function() {
    view.overlay.wait();
    if(data.user && data.user.groupCount) {
      router.navigate('dashboard', {trigger: true});
    } else {
      view.login.render();
    }
  },
  dashboard: function() {
    view.overlay.wait();
    if(data.user && data.user.groupCount) {
      view.dashboard.render();
    } else {
      router.navigate('', {trigger: true});
    }
  },
  group: function(id) {
    if(!data.user) {
      router.navigate('', {trigger: true}); 
      return;
    }

    if(data.user.groupCount && _.find(data.user.groups, function(g) { return g.id == id})) {
      view.dataHolder.render(id);  
    } else {
      view.notFound.render({h1: 'Access Denied', h2:'Try asking them to add you to their Facebook group'});  
    }
  },
  notFound: function() {
    view.notFound.render({h1: '404',h2: 'This is not the web page you are looking for.'});
  }
});

var hookFacebook = function() {
  FB.getLoginStatus(function(response) {
    if (response.status === 'connected') {
      accessToken = response.authResponse.accessToken;
      console.info('Set accessToken', accessToken);
    }
    console.info('Facebook GetLoginStatus');

    model.user(function(error, user) {
      router = new Router();
      Backbone.history.start();
      console.info('Start Backbone Router');
    });
  });

  FB.Event.subscribe('auth.authResponseChange', function(response) {
    if (response.status === 'connected') {
      accessToken = response.authResponse.accessToken;
    } else {
      data.user = null;
      
      view.overlay.wait('');
      window.location.reload();
      return;
    }
  });  
};
