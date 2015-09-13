define(function (require) {
  var React = require('react'),
    moment = require('moment'),
    _ = require('underscore'), //maybe not necessary?
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

  var LogFile = React.createClass({
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
      content.push(<Instructions visible={!localStorage.directory}/>);
      if (this.state.data.lines.length) {
        var loglines = this.state.data.lines.map(function(line) {
          return <LogLine data={line}/>;
        });
        content.concat(loglines);
      }
      return (
        <div>{content}</div>
      );
    }
  });

  var Instructions = React.createClass({
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
        <div className={classNameForInstructions}>
          <div className="mdl-cell mdl-cell--12-col">
            <h5>Where would you like to store the logs?</h5>
            <button className="mdl-button mdl-js-button mdl-button--raised" onClick={this.chooseDirectory}>
              Choose Directory
            </button>
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
        <span className="mdl-layout-title filename" id="filename" contentEditable="true"
            onKeyPress={this.handleKeyPress} onKeyDown={this.handleKeyDown} onBlur={this.handleBlur}>
          {localStorage.file ? localStorage.file : 'untitlted_log_file'}
        </span>
      );
    }
  });

  var Nav = React.createClass({
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
        <div className="mdl-layout__header-row menu">
          <span><img className="logo" src={path.join(__dirname, 'img', 'icon.png')} /></span>
          <FileName />
          <i className={classNameForWarning} id="warning">warning</i>
          <div className="mdl-layout-spacer"></div>
          <div id="notification" className="notification hidden"></div>
          <div className="mdl-layout-spacer"></div>
          <span className="directory" id="directory">{fullPath}</span>
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
    <LogFile />,
    document.getElementById('react-logfile')
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