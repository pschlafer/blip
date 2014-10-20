var gulp = require('gulp');
var react = require('gulp-react');
var jshint = require('gulp-jshint');
var cache = require('gulp-cached');

var jsFiles = [
  'app/**/*.js',
  'mock/**/*.js',
  'test/**/*.js',
  '*.js'
];

gulp.task('jshint', function() {
  var stream = gulp.src(jsFiles)
    .pipe(cache('jshint'))
    .pipe(react())
    .on('error', function(err) {
      console.error('JSX ERROR in ' + err.fileName);
      console.error(err.message);
      this.end();
    })
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));

  if (process.env.CI) {
    stream = stream.pipe(jshint.reporter('fail'));
  }

  return stream;
});

gulp.task('jshint-watch', ['jshint'], function(cb){
  console.log('Watching files for changes...');
  gulp.watch(jsFiles, ['jshint']);
});

gulp.task('default', ['jshint']);
