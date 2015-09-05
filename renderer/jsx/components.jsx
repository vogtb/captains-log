define(function (require) {
  var React = require('react'),
    moment = require('moment')
    _ = require('underscore'),
    yaml = require('yaml');


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
        <div>
          {this.state.data.lines.map(function(line) {
            return <LogLine data={line}/>;
          })}
        </div>
      );
    }
  });

  var Instructions = React.createClass({
    render: function () {
      return (
        <div className="mdl-grid hidden">
          <div className="mdl-cell mdl-cell--12-col">
            <h5>Where would you like to store the logs?</h5>
            <button className="mdl-button mdl-js-button mdl-button--raised">Choose Directory</button>
          </div>
        </div>
      );
    }
  });

  var MainInput = React.createClass({
    render: function () {
      return (
        <div className="mdl-textfield mdl-js-textfield">
          <textarea className="mdl-textfield__input main-input" type="text" rows= "4"></textarea>
          <label className="mdl-textfield__label" for="main-input">Log here...</label>
        </div>
      );
    }
  });

  var FileName = React.createClass({
    render: function () {
      return (
        <span className="mdl-layout-title filename" id="filename" contentEditable="true">untitlted_log_file</span>
      );
    }
  });

  var Nav = React.createClass({
    render: function () {
      var logoPath = path.join(__dirname, 'img', 'icon.png');
      return (
        <div className="mdl-layout__header-row menu">
          <span><img className="logo" src={logoPath} /></span>
          <FileName />
          <i className="material-icons warning hidden" id="warning">warning</i>
          <div className="mdl-layout-spacer"></div>
          <div id="notification" className="notification hidden"></div>
          <div className="mdl-layout-spacer"></div>
          <span className="hidden directory" id="directory"></span>
          <button className="mdl-button mdl-js-button mdl-button--icon" id="change-directory">
            <i className="material-icons">folder_open</i>
          </button>
          <button className="mdl-button mdl-js-button mdl-button--icon" id="new">
            <i className="material-icons">add</i>
          </button>
        </div>
      );
    }
  });

  React.render(
    <LogBox />,
    document.getElementById('react-logbox')
  );
  React.render(
    <Nav />,
    document.getElementById('react-nav')
  );
  React.render(
    <MainInput />,
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();
});