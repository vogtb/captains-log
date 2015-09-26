define(function () {
  var Utils = {
    confirmOverwrite: function (directory, file) {
      return confirm("The following file already exists:\n\n"
          + path.join(directory, file + ".yaml")
          + "\n\nWould you like to overwrite this file?");
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

  module.exports = Utils;
  return module.exports;
});