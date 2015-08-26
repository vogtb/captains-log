requirejs.config({
    baseUrl: 'js',
    paths: {
      index: 'index',
      components: 'components',
      jquery: 'jquery-2.1.4.min',
      handlebars: 'handlebars-v3.0.3',
      react: 'react.min',
      moment: 'moment',
      underscore: 'underscore.min',
      yaml: 'js-yaml.min',
      highlight: 'highlight.pack'
    },
    shim: {
      'jquery': 'jquery-2.1.4.min',
      'react': 'react.min',
      'highlight': 'highlight.pack',
      'moment': 'moment',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml.min',
      'handlebars': 'handlebars-v3.0.3',
      index: {
        deps: ['jquery', 'react', 'yaml', 'moment', 'underscore', 'highlight']
      },
      components: {
        deps: ['jquery', 'react', 'yaml', 'moment', 'underscore', 'highlight']
      }
    }
});

requirejs([
  'jquery',
  'react',
  'highlight',
  'handlebars',
  'underscore',
  'yaml',
  'moment',
  'index'
]);