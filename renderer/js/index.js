define(function (require) {
  var CL = require('components'),
    React = require('react');
  React.render(
    React.createElement(CL.LogFile, null),
    document.getElementById('react-logfile')
  );
  React.render(
    React.createElement(CL.Nav, null),
    document.getElementById('react-nav')
  );
  React.render(
    React.createElement(CL.MainInput, null),
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();
});