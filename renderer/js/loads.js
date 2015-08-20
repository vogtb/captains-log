requirejs.config({
    baseUrl: 'js',
    paths: {
      index: 'index',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      moment: 'moment',
      underscore: 'underscore.min',
      yaml: 'js-yaml.min',
      highlight: 'highlight.pack'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'highlight': 'highlight.pack',
      'moment': 'moment',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml.min',
      'handlebars': 'handlebars-v3.0.3',
      index: {
        deps: ['jquery', 'yaml', 'moment', 'underscore', 'highlight']
      }
    }
});

requirejs([
  'jquery',
  'highlight',
  'handlebars',
  'underscore',
  'yaml',
  'moment',
  'index'
]);