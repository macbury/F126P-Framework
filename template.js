/**
 * @author Arkadiusz Buras
 */

Template = {
  cache: {},
  views_path: "/views",
  
  load: function(view, onLoadCallback){
    if (Template.cache[view]) {
      onLoadCallback(Template.cache[view]);
    } else {
      $.ajax({
        type: "GET",
        url: [Template.views_path, view].join("/"),
        dataType: "html",
        success: function(html){
          Template.cache[view] = html;
          onLoadCallback(Template.cache[view]);
        },
        error: function(){
          delete Template.cache[view];
          onLoadCallback("Could not load file: "+ [Template.views_path, view].join("/"));
        },
      });
    }
  },
  
  render: function(view, locals, callback){
    Template.load(view, function (view_content) {
      callback(Haml.render(view_content, { locals: locals }));
    });
  },
  
  partial: function (view, callback) {
    Template.load(view, function(content) {
      callback.apply({
        render: function(locals){
          return Haml.render(content, { locals: locals });
        },
      }, arguments)
    });
  }
};
