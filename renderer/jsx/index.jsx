define(function (require) {
  var CL = require('components'),
    React = require('react');
  React.render(
    <CL.LogFile />,
    document.getElementById('react-logfile')
  );
  React.render(
    <CL.Nav />,
    document.getElementById('react-nav')
  );
  React.render(
    <CL.MainInput />,
    document.getElementById('react-main-input')
  );
  componentHandler.upgradeAllRegistered();
});