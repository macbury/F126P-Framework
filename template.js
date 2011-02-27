/**
 * @author Arkadiusz Buras
 */

Template = {
  cache: {},
  views_path: "/views",
  
  render: function(view, locals, callback){
    if (Template.cache[view]) {
      callback(Haml.render(Template.cache[view], locals));
    } else {
      $.ajax({
        type: "GET",
        url: [Template.views_path, view].join("/"),
        dataType: "html",
        success: function(html){
          Template.cache[view] = html;
          callback(Haml.render(html, locals));
        },
        error: function(){
          delete Template.cache[view];
          callback("Could not load "+ [Template.views_path, view].join("/"));
        },
      });
    }
  },
};

function render(view, locals, callback) {
  Template.render(view, locals, callback);
}