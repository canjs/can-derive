
module.exports = function(grunt){

	grunt.initConfig({
		copy: {
			toSteal: {
				files: [
					{ expand: true, src: ['npm*'], dist: 'node_modules/steal/ext/', filter: 'isFile'}
				]
			}
		},
		testee: {
			options: {
				browsers: ["firefox"]
			},
			all: [
				"test/systemjs.html",
				"test/steal.html"
			]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks("testee");

	grunt.registerTask("test", ["copy", "testee:all"]);
};
