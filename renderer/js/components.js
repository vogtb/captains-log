define(function (require) {
  var React = require('react'),
    moment = require('moment'),
    _ = require('underscore'),
    yaml = require('yaml'),
    supportedLanguages = hljs.listLanguages(),
    encodeLineToHTML = function (text) {
      text = text
          .replace(/(\r\n|\n|\r)/gm, '<br>')
          .replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
              '<a href="#" onclick="openLink(\'$1\')">$1</a>')
          .replace(/(^|[^\/])(www\.[\S]+(\b|$))/gim, '$1<a href="#">$2</a>');
      return {__html: text};
    };

  var Util = {
    confirmOverwrite: function (file, directory) {
      return confirm("This file " + path.join(directory, file + ".yaml") +
          " already exists! \nOverwrite this file?");
    },
    alertChooseValidDirectory: function () {
      alert("It doesn't look like you chose valid a directory. \nPlease try again.");
    },
    chooseDirectory: function () {
      return ipc.sendSync('choose-directory', 'choose-directory');
    },
    checkPath: function (file, directory) {
      return ipc.sendSync('check-file', {
        'directory': directory,
        'file': file
      });
    }
  };

  var LogLine = React.createClass({displayName: "LogLine",
    render: function () {
      return (
        React.createElement("div", {className: "mdl-grid logline"}, 
          React.createElement("div", {className: "mdl-cell mdl-cell--10-col text", 
              dangerouslySetInnerHTML: encodeLineToHTML(this.props.data.line)}), 
          React.createElement("div", {className: "mdl-cell mdl-cell--2-col timestamp"}, this.props.data.time)
        )
      );
    }
  });

  var LogLineCode = React.createClass({displayName: "LogLineCode",
    componentDidMount: function () {
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

  var LogFile = React.createClass({displayName: "LogFile",
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
      var response;
      if (!localStorage.directory || !localStorage.file) {
        localStorage.localLogFile = JSON.stringify(this.state.data);
        response = "OK";
      } else {
        console.log('saving file');
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
      content.push(React.createElement(Instructions, {visible: !localStorage.directory}));
      if (this.state.data.lines.length) {
        var loglines = this.state.data.lines.map(function(line) {
          return line.code ? React.createElement(LogLineCode, {data: line}) : React.createElement(LogLine, {data: line});
        });
        content = content.concat(loglines);
      }
      return (
        React.createElement("div", null, content)
      );
    }
  });

  var Instructions = React.createClass({displayName: "Instructions",
    setDirectory: function (directory) {
      localStorage.directory = directory;
      this.setState({visible: false});
      window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
      window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
    },
    chooseDirectory: function () {
      var directory = Util.chooseDirectory();
      if (!directory) {
        Util.alertChooseValidDirectory();
      } else {
        if (localStorage.file) {
          if (Util.checkPath(localStorage.file, directory) != 'OK') {
            if (Util.confirmOverwrite(localStorage.file, directory)) {
              this.setDirectory(directory);
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

  var MainInput = React.createClass({displayName: "MainInput",
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
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
          React.createElement("textarea", {className: "mdl-textfield__input main-input", type: "text", rows: "4", 
              disabled: this.state.disabled, onKeyDown: this.handleKeyDown}), 
          React.createElement("label", {className: "mdl-textfield__label", for: "main-input"}, "Log here...")
        )
      );
    }
  });

  var FileName = React.createClass({displayName: "FileName",
    componentDidMount: function () {
      window.addEventListener('localStorageUpdate', this.handleLocalStorageUpdate);
      window.addEventListener('saveFileEvent', this.handleSaveFileEvent);
      window.addEventListener('newFileEvent', this.handleNewFileEvent);
    },
    handleNewFileEvent: function (event) {
      React.findDOMNode(this.refs.filename).focus();
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
      callback(Util.checkPath(fileName, localStorage.directory));
    },
    confirmOverwrite: function (file, directory) {
      return confirm("This file " + path.join(directory, file + ".yaml") +
          " already exists! \nOverwrite this file?");
    },
    handleBlur: function (event) {
      var self = this;
      var newFileName = event.target.innerHTML;
      if (localStorage.file !== newFileName && newFileName !== 'untitled_log_file') {
        if (localStorage.directory) {
          this.checkFilenameAvailability(newFileName, function (response) {
            if (response !== 'OK') {
              if (self.confirmOverwrite(localStorage.directory, newFileName)) {
                localStorage.file = newFileName;
                window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
                window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
              } else {
                console.log("TODO: re-focus on the filename component");
              }
            } else {
              localStorage.file = newFileName;
              window.dispatchEvent(new CustomEvent("localStorageUpdate", {}));
              window.dispatchEvent(new CustomEvent("saveFileEvent", {}));
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

  var Nav = React.createClass({displayName: "Nav",
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
      var directory = Util.chooseDirectory();
      if (!directory) {
        Util.alertChooseValidDirectory();
      } else {
        if (localStorage.file) {
          if (Util.checkPath(localStorage.file, directory) != 'OK') {
            if (Util.confirmOverwrite(localStorage.file, directory)) {
              this.setDirectory(directory);
            }
          } else {
            this.setDirectory(directory);
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
          React.createElement(FileName, null), 
          React.createElement("i", {className: classNameForWarning, id: "warning"}, "warning"), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("div", {id: "notification", className: "notification hidden"}), 
          React.createElement("div", {className: "mdl-layout-spacer"}), 
          React.createElement("span", {className: "directory", id: "directory"}, fullPath), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              onClick: this.changeDirectory}, 
            React.createElement("i", {className: "material-icons"}, "folder_open")
          ), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              onClick: this.openFile}, 
            React.createElement("i", {className: "material-icons"}, "open_in_new")
          ), 
          React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon", 
              onClick: this.newFile}, 
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