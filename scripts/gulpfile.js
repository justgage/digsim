var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

var jsFiles = ['component*.js','./gates/*.js','digsim.js'];


gulp.task('default', function() {
   gulp.src(jsFiles)
      .pipe(jshint())
      .pipe(concat('digsim-all.js'))
      .pipe(gulp.dest('./build'));
});

var watcher = gulp.watch(jsFiles, ['default']);

watcher.on('change', function (event) {
   console.log('File '+ event.path +' was ' + event.type + ', running tasks...');
});
