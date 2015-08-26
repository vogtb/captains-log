define(function (require) {
  var React = require('react');
  var LogLine = React.createClass({displayName: "LogLine",
    render: function() {
      return (
        React.createElement("div", {class: "mdl-grid logline"}, 
          React.createElement("div", {class: "mdl-cell mdl-cell--10-col text"}, "Line goes here."), 
          React.createElement("div", {class: "mdl-cell mdl-cell--2-col timestamp"}, "Date goes here.")
        )
      );
    }
  });
});