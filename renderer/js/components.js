define(['react', 'moment', 'utils', 'underscore', 'yaml'], function (React, moment, Utils, _, yaml) {
  var supportedLanguages = hljs.listLanguages(),
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

  Components.LogLine = React.createClass({displayName: "LogLine",
    componentDidMount: function () {
      if (this.props.last) {
        var node = this.getDOMNode();
        node.scrollIntoView();
      }
    },
    render: function () {
      return (
        React.createElement("div", {className: "mdl-grid logline"}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--10-col text", 
              dangerouslySetInnerHTML: _encodeLineToHTML(this.props.data.line)}), 
          React.createElement("div", {className: "mdl-cell mdl-cell--2-col timestamp"}, this.props.data.time)
        )
      );
    }
  });

  Components.LogLineCode = React.createClass({displayName: "LogLineCode",
    componentDidMount: function () {
      if (this.props.last) {
        var node = this.getDOMNode();
        node.scrollIntoView();
      }
      hljs.highlightBlock(this.getDOMNode().childNodes[0].childNodes[0].childNodes[0]);
    },
    render: function () {
      return (
        React.createElement("div", {className: "mdl-grid logline"}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--10-col text"}, 
            React.createElement("pre", null, React.createElement("code", {className: this.props.data.language}, this.props.data.line))
          ), 
          React.createElement("div", {className: "mdl-cell mdl-cell--2-col timestamp"}, this.props.data.time)
        )
      );
    }
  });

  Components.LogFile = React.createClass({displayName: "LogFile",
    loadFileFromDisk: function () {
      if (localStorage.file && localStorage.directory) {
        // in case the file is not formatted properly
        try {
          var file = yaml.safeLoad(ipc.sendSync('load-file', {
            'directory': localStorage.directory,
            'file': localStorage.file
          }));
          if (file instanceof Object) {
            if (_.isUndefined(file.lines) || !(file.lines instanceof Array)) {
              throw new Error();
            }
          }
          this.setState({data: file});
        } catch (err) {
          Utils.alertYAMLFileFormatErr();
          this.setState({data:{lines: []}});
          localStorage.removeItem("file");
          window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
        }
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
      content.push(React.createElement(Components.Instructions, {visible: !localStorage.directory}));
      if (this.state.data.lines.length) {
        var length = this.state.data.lines.length;
        var loglines = this.state.data.lines.map(function(line, index) {
          var last = (index == length - 1);
          return line.code ? React.createElement(Components.LogLineCode, {data: line, last: last}) :
              React.createElement(Components.LogLine, {last: last, data: line});
        });
        content = content.concat(loglines);
      }
      return (
        React.createElement("div", null, content)
      );
    }
  });

  Components.Instructions = React.createClass({displayName: "Instructions",
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
        React.createElement("div", {className: classNameForInstructions}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--12-col"}, 
            React.createElement("h5", null, "Where would you like to store the logs?"), 
            React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--raised", 
                onClick: this.chooseDirectory}, 
              "Choose Directory"
            )
          )
        )
      );
    }
  });

  Components.MainInput = React.createClass({displayName: "MainInput",
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
        React.createElement("div", {className: "mdl-textfield mdl-js-textfield"}, 
          React.createElement("textarea", {className: "mdl-textfield__input main-input", id: "mainInput", ref: "mainInput", type: "text", rows: "4", 
              disabled: this.state.disabled, onKeyDown: this.handleKeyDown}), 
          React.createElement("label", {className: "mdl-textfield__label", for: "main-input"}, "Log here...")
        )
      );
    }
  });

  Components.FileName = React.createClass({displayName: "FileName",
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
        React.createElement("span", {className: "mdl-layout-title filename", id: "filename", contentEditable: "true", 
            onKeyPress: this.handleKeyPress, onKeyDown: this.handleKeyDown, 
            onBlur: this.handleBlur, ref: "filename"}, 
          localStorage.file ? localStorage.file : 'untitlted_log_file'
        )
      );
    }
  });

  Components.Notification = React.createClass({displayName: "Notification",
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
        React.createElement("div", {className: classNamesForNotification}, this.state.data.message)
      );
    }
  });

  Components.Nav = React.createClass({displayName: "Nav",
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
        React.createElement("div", {className: "mdl-layout__header-row menu"}, 
          React.createElement("span", null, React.createElement("img", {className: "logo", draggable: "false", 
              src: path.join(__dirname, 'img', 'icon.png')})), 
          React.createElement(Components.FileName, null), 
          React.createElement("span", {className: classNameForWarning, id: "warning"}, 
            React.createElement("svg", {fill: "#FFFFFF", height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg"}, 
              React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
              React.createElement("path", {d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"})
            )
          ), 
          React.createElement(Components.Notification, null), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("span", {className: "directory", id: "directory"}, fullPath), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              title: "Change Directory", 
              onClick: this.changeDirectory}, 
            React.createElement("span", null, 
              React.createElement("svg", {fill: "#FFFFFF", height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg"}, 
                React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                React.createElement("path", {d: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"})
              )
            )
          ), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              title: "Open File", 
              onClick: this.openFile}, 
            React.createElement("span", null, 
              React.createElement("svg", {fill: "#FFFFFF", height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg"}, 
                React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"}), 
                React.createElement("path", {d: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"})
              )
            )
          ), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              title: "New File", 
              onClick: this.newFile}, 
            React.createElement("span", null, 
              React.createElement("svg", {fill: "#FFFFFF", height: "24", viewBox: "0 0 24 24", width: "24", xmlns: "http://www.w3.org/2000/svg"}, 
                React.createElement("path", {d: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"}), 
                React.createElement("path", {d: "M0 0h24v24H0z", fill: "none"})
              )
            )
          )
        )
      );
    }
  });

  React.render(
    React.createElement(Components.LogFile, null),
    document.getElementById('react-logfile')
  );
  React.render(
    React.createElement(Components.Nav, null),
    document.getElementById('react-nav')
  );
  React.render(
    React.createElement(Components.MainInput, null),
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();

  return Components;
});