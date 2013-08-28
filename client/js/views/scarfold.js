$(function() {

view.scarfold =  new (Backbone.View.extend({
  initialize: function() {},
  render: function(callback) {
  	var self = this;
    $.ajax({ url: "/template/scarfold.ejs" }).done(function(content) {
      self.$el.html(_.template(content));
    });
  }
}))({el: $("#app_content")});

});