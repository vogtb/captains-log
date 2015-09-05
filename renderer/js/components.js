define(function (require) {
  var React = require('react'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml');


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
    componentDidMount: function () {
      // //actually load data
      // var file = ipc.sendSync('load-file', {
      //   'directory': localStorage.directory,
      //   'file': localStorage.file
      // });
    },
    getInitialState: function() {
      // this should be empty. mocking out data for development.
      return {
        data: {
          lines: [{
            line: "This is a line",
            timestamp: "This is a timestamp"
          },
          {
            line: "This is a line",
            timestamp: "This is a timestamp"
          }]
        }
      };
    },
    render: function () {
      return (
        React.createElement("div", null, 
          this.state.data.lines.map(function(line) {
            return React.createElement(LogLine, {data: line});
          })
        )
      );
    }
  });

  var Instructions = React.createClass({displayName: "Instructions",
    render: function () {
      return (
        React.createElement("div", {className: "mdl-grid hidden"}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--12-col"}, 
            React.createElement("h5", null, "Where would you like to store the logs?"), 
            React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--raised"}, "Choose Directory")
          )
        )
      );
    }
  });

  var MainInput = React.createClass({displayName: "MainInput",
    render: function () {
      return (
        React.createElement("div", {className: "mdl-textfield mdl-js-textfield"}, 
          React.createElement("textarea", {className: "mdl-textfield__input main-input", type: "text", rows: "4"}), 
          React.createElement("label", {className: "mdl-textfield__label", for: "main-input"}, "Log here...")
        )
      );
    }
  });

  var FileName = React.createClass({displayName: "FileName",
    render: function () {
      return (
        React.createElement("span", {className: "mdl-layout-title filename", id: "filename", contentEditable: "true"}, "untitlted_log_file")
      );
    }
  });

  var Nav = React.createClass({displayName: "Nav",
    render: function () {
      var logoPath = path.join(__dirname, 'img', 'icon.png');
      return (
        React.createElement("div", {className: "mdl-layout__header-row menu"}, 
          React.createElement("span", null, React.createElement("img", {className: "logo", src: logoPath})), 
          React.createElement(FileName, null), 
          React.createElement("i", {className: "material-icons warning hidden", id: "warning"}, "warning"), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("div", {id: "notification", className: "notification hidden"}), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("span", {className: "hidden directory", id: "directory"}), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", id: "change-directory"}, 
            React.createElement("i", {className: "material-icons"}, "folder_open")
          ), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", id: "new"}, 
            React.createElement("i", {className: "material-icons"}, "add")
          )
        )
      );
    }
  });

  React.render(
    React.createElement(LogBox, null),
    document.getElementById('react-logbox')
  );
  React.render(
    React.createElement(Nav, null),
    document.getElementById('react-nav')
  );
  React.render(
    React.createElement(MainInput, null),
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();
});