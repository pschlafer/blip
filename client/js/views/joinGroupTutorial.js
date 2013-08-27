$(function() {

view.joinGroupTutorial = new (Backbone.View.extend({
  initialize: function() {
    var self = this;

    $.ajax({ url: "/template/joinGroupTutorial.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function(data) {
    var self = this;

    view.overlay.white();
    this.$el.show();
    
    view.joinData.fadeOut(function() {
      self.$el.html(_.template(self.content, data));
      $('#login-groupTutorial').fadeIn();
    });
  },
  fadeOut: function(callback) {
    $('#login-groupTutorial').fadeOut(callback);
  },
  events: { 
    "click #login-groupTutorial .done": "done"
  },
  done: function() {
    view.joinGroupTutorial.fadeOut();

    model.groups.administrator(function(error, groups) {
	    if(error) {
	      alert('Error getting Administrator groups');
	      console.log('error:', error);
	      return;
	    }

	    view.joinSelectGroup.render(groups);
	  });
  }
}))({el: $("#bottom")});

});