let fileswatch = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

const { src, dest, parallel, series, watch } = require('gulp')
const browserSync  = require('browser-sync').create()
const webpack      = require('webpack-stream')
const sass         = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const rename       = require('gulp-rename')
const imagemin     = require('gulp-imagemin')
const newer        = require('gulp-newer')
const del          = require('del')

function browsersync() {
	browserSync.init({
		server: { baseDir: 'app/' },
		notify: false,
		online: true
	})
}

function scripts() {
	return src('app/js/common.js')
	.pipe(webpack({
		mode: 'production',
		module: {
			rules: [
				{
					test: /\.(js)$/,
					exclude: /(node_modules)/,
					loader: 'babel-loader',
					query: {
						presets: ['@babel/env']
					}
				}
			]
		}
	})).on('error', function handleError() {
		this.emit('end')
	})
	.pipe(rename('common.min.js'))
	.pipe(dest('app/js'))
	.pipe(browserSync.stream())
}

function styles() {
	return src('app/scss/main.scss')
	.pipe(sass({ outputStyle: 'compressed' }))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 2 versions'], grid: true }))
	.pipe(rename('main.min.css'))
	.pipe(dest('app/css'))
	.pipe(browserSync.stream())
}

function images() {
	return src('app/img/**/*')
	.pipe(newer('app/img/'))
	.pipe(imagemin())
	.pipe(dest('app/img/'))
}

function cleanimg() {
	return del('app/img/**/*', { force: true })
}

function buildcopy() {
	return src([
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/images/**/*',
		'app/fonts/**/*',
		'app/**/*.html',
	], { base: 'app/' })
		// .pipe(gcmq())
		.pipe(dest('dist'))
}

function startwatch() {
	watch('app/scss/**/*', { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
	watch('app/img/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
	watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}

exports.assets   = series(cleanimg, scripts, images)
exports.scripts  = scripts
exports.styles   = styles
exports.images   = images
exports.cleanimg = cleanimg
exports.default  = series(scripts, images, styles, parallel(browsersync, startwatch))

exports.build = (buildcopy)
