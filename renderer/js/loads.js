requirejs.config({
    baseUrl: 'js',
    paths: {
      index: 'index',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      moment: 'moment',
      underscore: 'underscore.min',
      yaml: 'js-yaml.min'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'moment': 'moment',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml.min',
      'handlebars': 'handlebars-v3.0.3',
      index: {
        deps: ['jquery', 'yaml', 'moment', 'underscore']
      }
    }
});

requirejs([
  'jquery',
  'handlebars',
  'underscore',
  'yaml',
  'moment',
  'index'
]);