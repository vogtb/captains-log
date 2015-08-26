define(function (require) {
  var React = require('react'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml');

  var LOG_LINE_HOLDER_ID = 'log-holder';

  var LogLine = React.createClass({displayName: "LogLine",
    render: function () {
      return (
        React.createElement("div", {className: "mdl-grid logline"}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--10-col text"}, this.props.data.line), 
          React.createElement("div", {className: "mdl-cell mdl-cell--2-col timestamp"}, this.props.data.timestamp)
        )
      );
    }
  });

  var LogBox = React.createClass({displayName: "LogBox",
    render: function () {
      return (
        React.createElement("div", null, 
          this.props.data.lines.map(function(line) {
            return React.createElement(LogLine, {data: line});
          })
        )
      );
    }
  });

  var data = {
    lines: [{
      line: "This is a line",
      timestamp: "This is a timestamp"
    },
    {
      line: "This is a line",
      timestamp: "This is a timestamp"
    }]
  };
  React.render(
    React.createElement(LogBox, {data: data}),
    document.getElementById(LOG_LINE_HOLDER_ID)
  );

});