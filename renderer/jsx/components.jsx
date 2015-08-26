define(function (require) {
  var React = require('react'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml');

  var LOG_LINE_HOLDER_ID = 'log-holder';

  var LogLine = React.createClass({
    render: function () {
      return (
        <div className="mdl-grid logline">
          <div className="mdl-cell mdl-cell--10-col text">{this.props.data.line}</div>
          <div className="mdl-cell mdl-cell--2-col timestamp">{this.props.data.timestamp}</div>
        </div>
      );
    }
  });

  var LogBox = React.createClass({
    render: function () {
      return (
        <div>
          {this.props.data.lines.map(function(line) {
            return <LogLine data={line}/>;
          })}
        </div>
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
    <LogBox data={data} />,
    document.getElementById(LOG_LINE_HOLDER_ID)
  );

});