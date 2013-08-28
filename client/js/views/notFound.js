$(function() {

view.notFound = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/notFound.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function(text) {
    view.overlay.opaque();
    view.header.render({top: true, handel: false, hidePatientTop: true});
    this.$el.show();
    this.$el.html(_.template(this.content, text));
  }
}))({el: $("#bottom")});

});