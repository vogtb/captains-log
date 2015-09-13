define(function (require) {
  var React = require('react'),
    moment = require('moment'),
    _ = require('underscore'), //maybe not necessary?
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

  var LogFile = React.createClass({displayName: "LogFile",
    loadFileFromDisk: function () {
      if (localStorage.file && localStorage.directory) {
        // var file = ipc.sendSync('load-file', {
        //   'directory': localStorage.directory,
        //   'file': localStorage.file
        // });
        // this.setState({data: file});
      }
    },
    saveFileToDisk: function () {
      var response;
      if (!localStorage.directory || !localStorage.file) {
        localStorage.localLogFile = JSON.stringify(this.state.data);
        response = "OK";
      } else {
        response = ipc.sendSync('save-file', {
          'directory': localStorage.directory,
          'file': localStorage.file,
          'log': yaml.safeDump(this.state.data)
        });
      }
      this.render();
    },
    componentDidMount: function () {
      this.loadFileFromDisk();
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
      window.addEventListener('saveFileEvent', this.saveFileToDisk);
    },
    handleLocalStorageUpdate: function (e) {
      this.render();
    },
    getInitialState: function() {
      return {
        data: {
          lines: []
        }
      };
    },
    render: function () {
      var content = [];
      content.push(React.createElement(Instructions, {visible: !localStorage.directory}));
      if (this.state.data.lines.length) {
        var loglines = this.state.data.lines.map(function(line) {
          return React.createElement(LogLine, {data: line});
        });
        content.concat(loglines);
      }
      return (
        React.createElement("div", null, content)
      );
    }
  });

  var Instructions = React.createClass({displayName: "Instructions",
    chooseDirectory: function () {
      var directory = remoteCall('choose-directory');
      if (!directory) {
        alertChooseValidDirectory();
      } else {
        localStorage.directory = directory;
        this.setState({visible: false});
      }
    },
    getInitialState: function() {
      return {
        visible: this.props.visible
      };
    },
    render: function () {
      var classNameForInstructions = "mdl-grid " + (this.state.visible ? "" : "hidden");
      return (
        React.createElement("div", {className: classNameForInstructions}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--12-col"}, 
            React.createElement("h5", null, "Where would you like to store the logs?"), 
            React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--raised", onClick: this.chooseDirectory}, 
              "Choose Directory"
            )
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
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
      window.addEventListener('saveFileEvent', this.handleSaveFileEvent);
    },
    handleLocalStorageUpdate: function () {
      this.render();
    },
    handleSaveFileEvent: function () {
      this.render();
    },
    handleKeyPress: function (event) {
      if (event.which !== 0) {
        var character = String.fromCharCode(event.which);
        if (event.which === 13) {
          // Move focus, user is done entering the name.
        }
        return !/[^a-zA-Z0-9_-]/.test(character);
      }
    },
    handleKeyDown: function (event) {
      // prevent tabs from being entered.
      if (event.which === 9) {
        event.preventDefault();
      }
    },
    checkFilenameAvailability: function (fileName, callback) {
      var response = ipc.sendSync('check-file', {
        'directory': localStorage.directory,
        'file': fileName
      });
      callback(response);
    },
    confirmOverwrite: function (file, directory) {
      return confirm("This file " + path.join(directory, file + ".yaml") + " already exists! \nOverwrite this file?");
    },
    handleBlur: function (event) {
      var newFileName = event.target.innerHTML;
      if (localStorage.file !== newFileName && newFileName !== 'untitled_log_file') {
        this.checkFilenameAvailability(newFileName, function (response) {
          console.log(response);
          if (response !== 'OK') {
            if (this.confirmOverwrite(localStorage.directory, newFileName)) {
              localStorage.file = newFileName;
              window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
              window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
            } else {
              console.log("TODO: re-focus on the filename component");
            }
          } else {
            console.log('about to set localStorage, trigger localStorageUpdate, saveFileEvent');
            localStorage.file = newFileName;
            window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
            window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
          }
        });
      }
    },
    render: function () {
      return (
        React.createElement("span", {className: "mdl-layout-title filename", id: "filename", contentEditable: "true", 
            onKeyPress: this.handleKeyPress, onKeyDown: this.handleKeyDown, onBlur: this.handleBlur}, 
          localStorage.file ? localStorage.file : 'untitlted_log_file'
        )
      );
    }
  });

  var Nav = React.createClass({displayName: "Nav",
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
    },
    handleLocalStorageUpdate: function (e) {
      this.forceUpdate();
    },
    render: function () {
      var fullPath = (localStorage.directory && localStorage.file) ?
          path.join(localStorage.directory, localStorage.file + '.yaml') : '';
      var classNameForWarning = "material-icons warning " + (localStorage.file ? "hidden" : "");
      return (
        React.createElement("div", {className: "mdl-layout__header-row menu"}, 
          React.createElement("span", null, React.createElement("img", {className: "logo", src: path.join(__dirname, 'img', 'icon.png')})), 
          React.createElement(FileName, null), 
          React.createElement("i", {className: classNameForWarning, id: "warning"}, "warning"), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("div", {id: "notification", className: "notification hidden"}), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("span", {className: "directory", id: "directory"}, fullPath), 
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
    React.createElement(LogFile, null),
    document.getElementById('react-logfile')
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