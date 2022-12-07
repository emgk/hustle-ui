'use strict';

// Import `src` and `dest` from gulp for use in the task.
const { src, dest, series, task, watch } = require( 'gulp' );

// ==================================================
// Supported Packages
const fs           = require( 'fs' );
const pump         = require( 'pump' );
const babel        = require( 'gulp-babel' );
const sass         = require( 'gulp-sass' );
const header       = require( 'gulp-header' );
const autoprefixer = require( 'gulp-autoprefixer' );
const cleanCSS     = require( 'gulp-clean-css' );
const eslint       = require( 'gulp-eslint' );
const uglify       = require( 'gulp-uglify-es' ).default;
const concat       = require( 'gulp-concat' );
const rename       = require( 'gulp-rename' );
const browserSync  = require( 'browser-sync' ).create();

// ==================================================
// Get Package File
const pckg = JSON.parse( fs.readFileSync( './package.json' ) );

// ==================================================
// WPMU DEV Banner
const banner = [ '/*!',
	' * WPMU DEV Hustle UI',
	' * Copyright 2019 Incsub (https://incsub.com)',
	' * Licensed under GPL v3 (http://www.gnu.org/licenses/gpl-3.0.html)',
	' */',
	'' ].join( '\n' );

// ==================================================
// List of Browsers
const browsersList = [
	'last 2 version',
	'> 1%'
];

// ==================================================
// Paths & Files

const sui = {
	fonts: './node_modules/@wpmudev/dist/fonts/'
};

const hustle = {
	source: {},
	output: {},
	watch: {}
};

hustle.source.main = './library/';
hustle.source.fonts = './library/fonts/';
hustle.source.scripts = './library/js/';
hustle.source.styles = './library/scss/';

hustle.output.main = './dist/';
hustle.output.fonts = './dist/fonts/';
hustle.output.scripts = './dist/js/';
hustle.output.styles = './dist/css/';

hustle.watch.styles = [
	hustle.source.styles + '**/*.scss'
];

hustle.watch.scripts = [
	hustle.source.scripts + '*.js'
];

hustle.watch.fonts = [
	hustle.source.fonts + '*'
];

hustle.watch.files = [
	'./README.md',
	'./CHANGELOG.md'
];

const showcase = {
	source: {},
	output: {},
	watch: {}
};

showcase.source.main = './showcase/';
showcase.source.scripts = './showcase/js/';
showcase.source.styles = './showcase/scss/';

showcase.output.main = './public/';
showcase.output.fonts = './public/assets/fonts/';
showcase.output.scripts = './public/assets/js/';
showcase.output.styles = './public/assets/css/';
showcase.output.images = './public/assets/images/';

showcase.watch.styles = [
	showcase.source.styles + '**/*.scss'
];

showcase.watch.scripts = [
	showcase.source.scripts + '*.js'
];

showcase.watch.fonts = [
	hustle.source.fonts + '*',
	sui.fonts + '*'
];

showcase.watch.html = [
	showcase.output.main + '*.html',
	showcase.output.main + 'templates/*.html',
	showcase.output.main + 'templates/opt-in/*.html'
];

// ==================================================
// BrowserSync
function BrowserSync() {

	return browserSync.init({
		injectChanges: true,
		server: {
			baseDir: showcase.output.main
		}
	});
}

// ==================================================
// Tasks

// Build Hustle styles
function HustleStyles() {

	return src( hustle.watch.styles )
		.pipe(
			sass({ outputStyle: 'compressed' })
			.on( 'error', sass.logError )
		)
		.pipe( autoprefixer( browsersList ) )
		.pipe( header( banner ) )
		.pipe( cleanCSS() )
		.pipe( rename({
			suffix: '.min'
		}) )
		.pipe( dest( hustle.output.styles ) )
		;
}

// Build Hustle scripts
function HustleScripts( cb ) {

	return pump([
		src( hustle.watch.scripts ),
		eslint(),
		eslint.format(),
		eslint.failAfterError(),
		concat( 'hustle-ui.js' ),
		babel({
			presets: [
				[ '@babel/env', {
					modules: false
				} ]
			]
		}),
		header( banner ),
		dest( hustle.output.scripts ),
		uglify(),
		rename({
			suffix: '.min'
		}),
		header( banner ),
		dest( hustle.output.scripts ),
		dest( showcase.output.scripts )
	], cb );
}

// Copy Hustle fonts
function HustleFonts() {

	return src( hustle.watch.fonts )
		.pipe( dest( hustle.output.fonts ) )
		;
}

// Copy Hustle information files
function HustleFiles() {

	return src( hustle.watch.files )
		.pipe( dest( hustle.output.main ) )
		;
}

// Build Hustle UI
function HustleBuild( done ) {
	HustleStyles();
	HustleScripts();
	HustleFonts();
	HustleFiles();
	done();
}

task( 'hustle:build', HustleBuild );

// Build Showcase styles
function ShowcaseStyles() {

	return src( showcase.watch.styles )
		.pipe(
			sass({ outputStyle: 'compressed' })
			.on( 'error', sass.logError )
		)
		.pipe( autoprefixer( browsersList ) )
		.pipe( cleanCSS() )
		.pipe( rename({
			suffix: '.min'
		}) )
		.pipe( dest( showcase.output.styles ) )
		.pipe( browserSync.stream({
			match: '**/*.css'
		}) )
		;
}

// Build Showcase scripts
function ShowcaseScripts( cb ) {

	return pump([
		src( showcase.watch.scripts ),
		eslint(),
		eslint.format(),
		eslint.failAfterError(),
		concat( 'showcase-ui.js' ),
		babel({
			presets: [
				[ '@babel/env', {
					modules: false
				} ]
			]
		}),
		uglify(),
		rename({
			suffix: '.min'
		}),
		dest( showcase.output.scripts ),
		browserSync.stream()
	], cb );
}

// Copy Showcase fonts
function ShowcaseFonts() {

	return src( showcase.watch.fonts )
		.pipe( dest( showcase.output.fonts ) )
		.pipe( browserSync.stream() )
		;
}

// Build Showcase
function ShowcaseBuild( done ) {
	ShowcaseStyles();
	ShowcaseScripts();
	ShowcaseFonts();
	done();
}

task( 'showcase:build', ShowcaseBuild );

// ==================================================
// Watch

function HustleWatch() {

	// Watch Hustle styles
	watch( hustle.watch.styles, series( HustleStyles ) );

	// Watch Hustle scripts
	watch( hustle.watch.scripts, series( HustleScripts ) );

	// Watch Hustle fonts
	watch( hustle.watch.fonts, series( HustleFonts ) );

	// Watch Hustle information files
	watch( hustle.watch.files, series( HustleFiles ) );

}

function ShowcaseWatch() {

	// Watch Showcase styles
	watch( showcase.watch.styles, series( ShowcaseStyles ) );

	// Watch Showcase scripts
	watch( showcase.watch.scripts, series( ShowcaseScripts ) );

	// Watch Showcase fonts
	watch( showcase.watch.fonts, series( ShowcaseFonts ) );

	// Watch for HTML changes
	watch( showcase.watch.html ).on( 'change', browserSync.reload );

}

// ==================================================
// Development

task( 'development', series(
	HustleBuild,
	ShowcaseBuild,
	BrowserSync,
	HustleWatch,
	ShowcaseWatch
) );
