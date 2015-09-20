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

  var LogLine = React.createClass({
    render: function () {
      return (
        <div className="mdl-grid logline">
          <div className="mdl-cell mdl-cell--10-col text"
              dangerouslySetInnerHTML={encodeLineToHTML(this.props.data.line)}></div>
          <div className="mdl-cell mdl-cell--2-col timestamp">{this.props.data.time}</div>
        </div>
      );
    }
  });

  var LogLineCode = React.createClass({
    componentDidMount: function () {
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

  var LogFile = React.createClass({
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
      content.push(<Instructions visible={!localStorage.directory}/>);
      if (this.state.data.lines.length) {
        var loglines = this.state.data.lines.map(function(line) {
          return line.code ? <LogLineCode data={line}/> : <LogLine data={line}/>;
        });
        content = content.concat(loglines);
      }
      return (
        <div>{content}</div>
      );
    }
  });

  var Instructions = React.createClass({
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

  var MainInput = React.createClass({
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
        <div className="mdl-textfield mdl-js-textfield">
          <textarea className="mdl-textfield__input main-input" type="text" rows="4"
              disabled={this.state.disabled} onKeyDown={this.handleKeyDown}></textarea>
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
        <span className="mdl-layout-title filename" id="filename" contentEditable="true"
            onKeyPress={this.handleKeyPress} onKeyDown={this.handleKeyDown}
            onBlur={this.handleBlur}>
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
    render: function () {
      var fullPath = (localStorage.directory && localStorage.file) ?
          path.join(localStorage.directory, localStorage.file + '.yaml') : '';
      var classNameForWarning = "material-icons warning " + (localStorage.file ? "hidden" : "");
      return (
        <div className="mdl-layout__header-row menu">
          <span><img className="logo" draggable="false"
              src={path.join(__dirname, 'img', 'icon.png')} /></span>
          <FileName />
          <i className={classNameForWarning} id="warning">warning</i>
          <div className="mdl-layout-spacer"></div>
          <div id="notification" className="notification hidden"></div>
          <div className="mdl-layout-spacer"></div>
          <span className="directory" id="directory">{fullPath}</span>
          <button className="mdl-button mdl-js-button mdl-button--icon" 
              onClick={this.changeDirectory}>
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