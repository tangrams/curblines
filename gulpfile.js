'use strict'

var gulp = require('gulp')
var gutil = require('gulp-util')
var livereload = require('gulp-livereload')

var paths = {
  styles: 'src/css/**/*.scss',
  scripts: 'src/js/**/*.js'
}

gulp.task('default', ['css', 'js', 'watch'])

gulp.task('css', function () {
  var sass = require('gulp-sass')
  var autoprefix = require('gulp-autoprefixer')
  var cssimport = require('gulp-cssimport')
  var cssnano = require('gulp-cssnano')
  var rename = require('gulp-rename')

  gulp.src('src/css/styles.scss')
    .pipe(sass())
    .pipe(autoprefix('last 2 versions'))
    .pipe(cssimport())
    .pipe(cssnano({ zindex: false }))
    .pipe(rename('styles.css'))
    .pipe(gulp.dest('./site/css'))
    .pipe(livereload())
})

gulp.task('js', function () {
  var browserify = require('browserify')
  var source = require('vinyl-source-stream')
  var buffer = require('vinyl-buffer')
  var uglify = require('gulp-uglify')
  var sourcemaps = require('gulp-sourcemaps')

  // see package.json for transforms
  return browserify({ entries: ['src/js/main.js'] })
    .transform('babelify', { presets: ['es2015'] })
    .bundle()
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      // Add transformation tasks to the pipeline here.
      .pipe(uglify())
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./site/js'))
})

gulp.task('watch', function () {
  livereload.listen()
  gulp.watch(paths.styles, ['css'])
  gulp.watch(paths.scripts, ['js'])
})
