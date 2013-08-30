$(function() {

view.joinSelectGroup = new (Backbone.View.extend({
  initialize: function() {
    var self = this;
    $.ajax({ url: "/template/joinSelectGroup.ejs" }).done(function(content) {
      self.content = content;
    });
  },
  render: function(groups) {
    view.overlay.white();

    this.$el.show();

    this.$el.html(_.template(this.content, {groups: groups, user: data.user}));

    $('#choose-facebook-group').fadeIn();
    $("#choose-facebook-group li").click(this.select);
  },
  fadeOut: function(callback) {
    $('#choose-facebook-group').fadeOut(callback);
  },
  select: function(event) { 
    view.joinSelectGroup.fadeOut();

    var groupId = $(this).attr('id');

    model.groups.select(groupId, function(error, id) {
      if(error) {
        alert('Error getting Administrator groups');
        console.error(error);
        return;
      }
      
      view.header.render({top: true, handel: false, logout: true, groupId: id, showPatientNow: true});
      
      (new viewClass.Upload({el: $("#bottom")})).render(id);
      //upload.render(id);
    });
  }
}))({el: $("#bottom")});

});