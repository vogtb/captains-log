define(function (require) {
  var React = require('react'),
    moment = require('moment'),
    Utils = require('utils'),
    _ = require('underscore'),
    yaml = require('yaml'),
    supportedLanguages = hljs.listLanguages(),
    Components = {},
    _encodeLineToHTML = function (text) {
      text = text
          .replace(/(\r\n|\n|\r)/gm, '<br>')
          .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
              '<a href="#" onclick="openLink(\'$1\')">$1</a>')
          .replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="#">$2</a>');
      return {__html: text};
    },
    Messages = {
      FILE_OVERWRITTEN: "File overwritten.",
      FILE_CREATED: "File created.",
      SET_DIRECTORY: "Directory set.",
      NEW_FILE_CREATED: "New file created."
    };

  Components.LogLine = React.createClass({
    componentDidMount: function () {
      if (this.props.last) {
        var node = this.getDOMNode();
        node.scrollIntoView();
      }
    },
    render: function () {
      return (
        <div className="mdl-grid logline">
          <div className="mdl-cell mdl-cell--10-col text"
              dangerouslySetInnerHTML={_encodeLineToHTML(this.props.data.line)}></div>
          <div className="mdl-cell mdl-cell--2-col timestamp">{this.props.data.time}</div>
        </div>
      );
    }
  });

  Components.LogLineCode = React.createClass({
    componentDidMount: function () {
      if (this.props.last) {
        var node = this.getDOMNode();
        node.scrollIntoView();
      }
      hljs.highlightBlock(this.getDOMNode().childNodes[0].childNodes[0].childNodes[0]);
    },
    render: function () {
      return (
        <div className="mdl-grid logline">
          <div className="mdl-cell mdl-cell--10-col text">
            <pre><code className={this.props.data.language}>{this.props.data.line}</code></pre>
          </div>
          <div className="mdl-cell mdl-cell--2-col timestamp">{this.props.data.time}</div>
        </div>
      );
    }
  });

  Components.LogFile = React.createClass({
    loadFileFromDisk: function () {
      if (localStorage.file && localStorage.directory) {
        var file = yaml.safeLoad(ipc.sendSync('load-file', {
          'directory': localStorage.directory,
          'file': localStorage.file
        }));
        this.setState({data: file});
      } else {
        if (!localStorage.localLogFile) {
          localStorage.localLogFile = JSON.stringify({data: {lines: []}});
        }
        this.setState(JSON.parse(localStorage.localLogFile));
      }
    },
    saveFileToDisk: function () {
      if (!localStorage.directory || !localStorage.file) {
        localStorage.localLogFile = JSON.stringify(this.state.data);
      } else {
        var response = ipc.sendSync('save-file', {
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
      window.addEventListener('addLineEvent', this.handleAddLineEvent);
      window.addEventListener('newFileEvent', this.handleNewFileEvent);
      window.addEventListener('shouldLoadFile', this.handleShouldLoadFile);
    },
    handleShouldLoadFile: function (event) {
      this.loadFileFromDisk();
    },
    handleNewFileEvent: function (event) {
      this.state.data = {lines: []};
      this.forceUpdate();
    },
    handleAddLineEvent: function (event) {
      this.state.data.lines.push(event.detail);
      this.saveFileToDisk();
      this.forceUpdate();
    },
    handleLocalStorageUpdate: function (event) {
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
      content.push(<Components.Instructions visible={!localStorage.directory}/>);
      if (this.state.data.lines.length) {
        var length = this.state.data.lines.length;
        var loglines = this.state.data.lines.map(function(line, index) {
          var last = (index == length - 1);
          return line.code ? <Components.LogLineCode data={line} last={last}/> :
              <Components.LogLine last={last} data={line}/>;
        });
        content = content.concat(loglines);
      }
      return (
        <div>{content}</div>
      );
    }
  });

  Components.Instructions = React.createClass({
    setDirectory: function (directory) {
      localStorage.directory = directory;
      this.setState({visible: false});
      window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
      window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
    },
    chooseDirectory: function () {
      var directory = Utils.chooseDirectory();
      if (!directory) {
        Utils.alertChooseValidDirectory();
      } else {
        if (localStorage.file) {
          if (Utils.checkPath(localStorage.file, directory) != 'OK') {
            if (Utils.confirmOverwrite(directory, localStorage.file)) {
              this.setDirectory(directory);
              window.dispatchEvent(new CustomEvent("showNotification", {
                'detail': {
                  'message': Messages.FILE_OVERWRITTEN
                }
              }));
            }
          } else {
            this.setDirectory(directory);
          }
        } else {
          this.setDirectory(directory);
        }
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
            <button className="mdl-button mdl-js-button mdl-button--raised"
                onClick={this.chooseDirectory}>
              Choose Directory
            </button>
          </div>
        </div>
      );
    }
  });

  Components.MainInput = React.createClass({
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
      window.addEventListener('focusOnMainInput', this.handleFocusOnMainInput);
    },
    handleFocusOnMainInput: function (event) {
      React.findDOMNode(this.refs.mainInput).focus();
    },
    parseLineToObject: function (line) {
      var languagesDetected = _.filter(supportedLanguages, function(language) {
        return line.startsWith('/' + language + ' ');
      });
      if (!_.isEmpty(languagesDetected)) {
        var toSlice = '/' + _.first(languagesDetected) + ' ';
        line = line.slice(toSlice.length);
        return {
          'code': true,
          'language': languagesDetected,
          'line': line
        }
      } else if (line.startsWith('/code')) {
        line = line.slice('/code '.length);
        return {
          'code': true,
          'language': 'javascript',
          'line': line
        }
      }
      return {
        'code': false,
        'language': false,
        'line': line
      }
    },
    handleEnterKey: function (event) {
      if (event.target.value === '' && event.target.value === '\n') {
        event.target.value = " ";
      }
      var time = moment();
      var lineObject = this.parseLineToObject(event.target.value);
      lineObject.time = time.format("MMM DD YYYY, h:mm a");
      lineObject.timestamp = time.valueOf();
      window.dispatchEvent(new CustomEvent("addLineEvent", {'detail': lineObject}));
      event.target.value = "";
      return false;
    },
    handleKeyDown: function (event) {
      if (event.which === 13 && !event.shiftKey) {
        this.handleEnterKey(event);
      }
    },
    handleLocalStorageUpdate: function (event) {
      this.setState({
        disabled: !(localStorage.file && localStorage.directory)
      });
      this.forceUpdate();
    },
    getInitialState: function () {
      return {
        disabled: !(localStorage.file && localStorage.directory)
      }
    },
    render: function () {
      return (
        <div className="mdl-textfield mdl-js-textfield">
          <textarea className="mdl-textfield__input main-input" id="mainInput" ref="mainInput" type="text" rows="4"
              disabled={this.state.disabled} onKeyDown={this.handleKeyDown}></textarea>
          <label className="mdl-textfield__label" for="main-input">Log here...</label>
        </div>
      );
    }
  });

  Components.FileName = React.createClass({
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
      window.addEventListener('saveFileEvent', this.handleSaveFileEvent);
      window.addEventListener('newFileEvent', this.handleNewFileEvent);
    },
    handleNewFileEvent: function (event) {
      React.findDOMNode(this.refs.filename).focus();
    },
    handleLocalStorageUpdate: function () {
      this.forceUpdate();
    },
    handleSaveFileEvent: function () {
      this.render();
    },
    handleKeyPress: function (event) {
      if (event.which !== 0) {
        if (event.which === 13 || event.which === 9) {
          window.dispatchEvent(new CustomEvent("focusOnMainInput", {}));
        }
        return !/[^a-zA-Z0-9_-]/.test(String.fromCharCode(event.which));
      }
    },
    handleKeyDown: function (event) {
      // prevent tabs from being entered.
      if (event.which === 9) {
        event.preventDefault();
      }
    },
    checkFilenameAvailability: function (fileName, callback) {
      callback(Utils.checkPath(fileName, localStorage.directory));
    },
    handleBlur: function (event) {
      var self = this;
      var newFileName = event.target.innerHTML;
      if (localStorage.file !== newFileName && newFileName !== 'untitled_log_file'
          && document.hasFocus()) {
        if (localStorage.directory) {
          this.checkFilenameAvailability(newFileName, function (response) {
            if (response !== 'OK') {
              if (Utils.confirmOverwrite(localStorage.directory, newFileName)) {
                localStorage.file = newFileName;
                window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
                window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
                window.dispatchEvent(new CustomEvent("showNotification", {
                  'detail': {
                    'message': Messages.FILE_OVERWRITTEN
                  }
                }));
              } else {
                event.target.innerHTML = localStorage.file;
              }
            } else {
              localStorage.file = newFileName;
              window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
              window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
              window.dispatchEvent(new CustomEvent("showNotification", {
                'detail': {
                  'message': Messages.FILE_CREATED
                }
              }));
            }
          });
        } else {
          localStorage.file = newFileName;
          window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
          window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
        }
      }
    },
    render: function () {
      return (
        <span className="mdl-layout-title filename" id="filename" contentEditable="true"
            onKeyPress={this.handleKeyPress} onKeyDown={this.handleKeyDown}
            onBlur={this.handleBlur} ref="filename">
          {localStorage.file ? localStorage.file : 'untitlted_log_file'}
        </span>
      );
    }
  });

  Components.Notification = React.createClass({
    getInitialState: function () {
      return {
        data: {
          visible: false,
          message: '',
          timeoutID: false
        }
      };
    },
    componentDidMount: function () {
      window.addEventListener('showNotification', this.handleShowNotification);
    },
    handleShowNotification: function (event) {
      var tempState = this.state;
      tempState.data.visible = true;
      tempState.data.message = event.detail.message;
      // If we're already showing a notification, just change it and prolong the show time
      if (tempState.visible) {
        window.clearTimeout(this.state.timeoutID);
      }
      this.setState(tempState);
      var self = this;
      tempState.timeoutID = setTimeout(function () {
        self.notificationOff();
      }, 5000);
      this.forceUpdate();
    },
    notificationOff: function () {
      var tempState = this.state;
      tempState.data.visible = false;
      this.setState(tempState);
      this.forceUpdate();
    },
    render: function () {
      var classNamesForNotification = "notification ";
      classNamesForNotification += this.state.data.visible ? "" : "hidden";
      return (
        <div className={classNamesForNotification}>{this.state.data.message}</div>
      );
    }
  });

  Components.Nav = React.createClass({
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
    },
    handleLocalStorageUpdate: function (e) {
      this.forceUpdate();
    },
    setDirectory: function (directory) {
      localStorage.directory = directory;
      this.setState({visible: false});
      window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
      window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
    },
    changeDirectory: function () {
      var directory = Utils.chooseDirectory();
      if (!directory) {
        Utils.alertChooseValidDirectory();
      } else {
        if (localStorage.file) {
          if (Utils.checkPath(localStorage.file, directory) != 'OK') {
            if (Utils.confirmOverwrite(directory, localStorage.file)) {
              this.setDirectory(directory);
              window.dispatchEvent(new CustomEvent("showNotification", {
                'detail': {
                  'message': Messages.FILE_OVERWRITTEN
                }
              }));
            }
          } else {
            this.setDirectory(directory);
            window.dispatchEvent(new CustomEvent("showNotification", {
              'detail': {
                'message': Messages.SET_DIRECTORY
              }
            }));
          }
        } else {
          this.setDirectory(directory);
        }
      }
    },
    newFile: function () {
      localStorage.removeItem('file');
      window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
      window.dispatchEvent(new CustomEvent("newFileEvent", {}));
      window.dispatchEvent(new CustomEvent("showNotification", {
        'detail': {
          'message': Messages.NEW_FILE_CREATED
        }
      }));
    },
    openFile: function () {
      var newFilePathObject = ipc.sendSync('choose-file', 'choose-file');
      localStorage.directory = newFilePathObject.directory;
      localStorage.file = newFilePathObject.file;
      window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
      window.dispatchEvent(new CustomEvent("shouldLoadFile", {}));
    },
    render: function () {
      var fullPath = (localStorage.directory && localStorage.file) ?
          path.join(localStorage.directory, localStorage.file + '.yaml') : '';
      var classNameForWarning = "material-icons warning " + (localStorage.file ? "hidden" : "");
      return (
        <div className="mdl-layout__header-row menu">
          <span><img className="logo" draggable="false"
              src={path.join(__dirname, 'img', 'icon.png')} /></span>
          <Components.FileName />
          <i className={classNameForWarning} id="warning">warning</i>
          <Components.Notification />
          <div className="mdl-layout-spacer"></div>
          <span className="directory" id="directory">{fullPath}</span>
          <button className="mdl-button mdl-js-button mdl-button--icon"
              onClick={this.changeDirectory}>
            <i className="material-icons">folder_open</i>
          </button>
          <button className="mdl-button mdl-js-button mdl-button--icon"
              onClick={this.openFile}>
            <i className="material-icons">open_in_new</i>
          </button>
          <button className="mdl-button mdl-js-button mdl-button--icon"
              onClick={this.newFile}>
            <i className="material-icons">add</i>
          </button>
        </div>
      );
    }
  });

  React.render(
    <Components.LogFile />,
    document.getElementById('react-logfile')
  );
  React.render(
    <Components.Nav />,
    document.getElementById('react-nav')
  );
  React.render(
    <Components.MainInput />,
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();

  return Components;
});