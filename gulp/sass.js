// Global modules
var fs = require('fs');
var path = require('path');

// Import modules
var sass = require('gulp-sass');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var sassGlob = require('gulp-sass-glob');
var purify = require('gulp-purifycss');
var merge = require('merge-stream');
var yaml = require('js-yaml');
var sassLint = require('gulp-sass-lint');


// Import config
var config = require('./_config');

var env = process.env.NODE_ENV || 'local';
var live = env === 'prod' || env === 'stag';
var notLocal = env === 'prod' || env === 'stag' || env === 'dev';

// Sass module
module.exports = function(gulp, livereload) {
	var nanoConf = {
		safe: true
	};

	var purifyFilesArray = config.purify.concat(config.libs);

	// If a lib is stated then use the merge stream otherwise use the original sass task
	if (config.cssLibs.length > 0) {
		gulp.task('sass-base', function() {
			return gulp.src(config.sass)
				.pipe(sassGlob())
				.pipe(sass().on('error', sass.logError))
				.pipe(autoprefixer({
					browsers: [
						'last 2 versions',
						'IE 10'
					],
					cascade: false
				}))
				.pipe(gulpif(notLocal, purify(purifyFilesArray)))
				.pipe(gulpif(live, cssnano(nanoConf)))
				.pipe(concat('app-base.css'))
				.pipe(gulp.dest('dist'))
				.pipe(livereload());
		});

		gulp.task('sass-libs', function() {
			return gulp.src(config.cssLibs)
				.pipe(concat('app-libs.css'))
				.pipe(gulpif(notLocal, purify(purifyFilesArray)))
				.pipe(gulpif(live, cssnano(nanoConf)))
				.pipe(gulp.dest('dist'))
				.pipe(livereload());
		});

		gulp.task('sass', gulp.series('sass-base', 'sass-libs', function() {
			var cssFiles = [
				'dist/app-libs.css',
				'dist/app-base.css'
			];

			return gulp.src(cssFiles)
				.pipe(concat('app.css'))
				.pipe(gulp.dest('dist'))
				.pipe(livereload());
		}));
	} else {
		gulp.task('sass', function() {
			return gulp.src(config.sass)
				.pipe(sassGlob())
				.pipe(sass().on('error', sass.logError))
				.pipe(autoprefixer())
				.pipe(gulpif(notLocal, purify(purifyFilesArray)))
				.pipe(gulpif(live, cssnano(nanoConf)))
				.pipe(gulp.dest('dist'))
				.pipe(livereload());
		});
	}

	gulp.task('sass-lint', function() {
		var sassLintConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../', '.sass-lint.yml'), 'utf8'));
		var filesToLint = config.sass.concat(config.sassSkip);

		return gulp.src(filesToLint)
			.pipe(sassLint(sassLintConfig))
			.pipe(sassLint.format());
	});
};
