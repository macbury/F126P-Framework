/**
 * @author Arkadiusz Buras
 */

JAKE = {
  tasks: {}
};

function jake(name) {
  JAKE.tasks[name]["method"]();
}

function Task(options) {
  var options = $.extend({
    name: "Example Task",
    description: "Description for task",
    method: function() { console.log("Example task") }
  }, options);
  
  $.extend(this, options);
  
  JAKE.tasks[options["name"]] = this;
}

new Task({
  name: "tasks",
  description: "List all defined tasks",
  method: function () {
    $.each(JAKE.tasks, function () {
      var task = this;
      console.log("jake('"+task.name+"') => "+task.description);
    });
  }
});
