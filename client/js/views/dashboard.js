$(function() {

view.dashboard = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/dashboard.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function() {
    var self = this;
    
    view.header.render({top: true, handel: false, hidePatientTop: true});

    this.get(function(error, groups) {
      if(groups.length) {
        if(groups.length === 1) {
          window.location.hash = 'group/' + groups[0].id;  
          return;
        }
        self.$el.html(_.template(self.content, { groups: groups }));
      } else {
        alert('looks like you dont have access to any group');
      }
      view.overlay.white();
    });
  },
  get: function(callback) {
    $.getJSON('http://'+$('#api_endpoint').attr('content')+'/v1/groups?selected=true&accessToken=' + accessToken + '&callback=?', function(groups) {
      callback(null, groups);
    });
  }
}))({el: $("#bottom")});

});