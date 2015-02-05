module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		uglify: {
			dist: {
				files: {
					'demo/static/js/schedjoules.min.js': [
						'assets/schedjoules.js'
					],

					'schedjoules.min.js': [
						'assets/schedjoules.js'
					],
				}
			}
		},

		watch: {
			files: ['assets/**/*.js', 'demo/static/js/demo.js'],
			tasks: ['uglify'],
			options: {
				livereload: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('build', ['uglify']);
	grunt.registerTask('default', ['uglify', 'watch']);
}
