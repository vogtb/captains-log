define(function (require) {
  var React = require('react');
  var LogLine = React.createClass({
    render: function() {
      return (
        <div class="mdl-grid logline">
          <div class="mdl-cell mdl-cell--10-col text">Line goes here.</div>
          <div class="mdl-cell mdl-cell--2-col timestamp">Date goes here.</div>
        </div>
      );
    }
  });
});