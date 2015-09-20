requirejs.config({
    baseUrl: 'js',
    paths: {
      components: 'components',
      react: 'react.min',
      moment: 'moment',
      underscore: 'underscore.min',
      yaml: 'js-yaml',
      highlight: 'highlight.pack'
    },
    shim: {
      'react': 'react.min',
      'highlight': 'highlight.pack',
      'moment': 'moment',
      'underscore': 'underscore.min',
      'yaml': 'js-yaml',
      components: {
        deps: ['react', 'yaml', 'moment', 'underscore', 'highlight']
      }
    }
});

requirejs([
  'react',
  'highlight',
  'underscore',
  'yaml',
  'moment',
  'components'
]);