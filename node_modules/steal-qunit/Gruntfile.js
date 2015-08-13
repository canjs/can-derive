'use strict';
module.exports = function (grunt) {
	
  var core = ['<%= pkg.name %>.js', '<%= pkg.name %>.production.js', 'ext/**'];
  
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*\n *  <%= pkg.name %> v<%= pkg.version %>\n' +
        '<%= pkg.homepage ? " *  " + pkg.homepage + "\\n" : "" %>' +
        ' *  \n' +
        ' *  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */'
    },
    copy: {
    	// copy plugins that steal should contain
      qunit: {
        files: [
          {src:["bower_components/qunit/qunit/qunit.js"], dest: "qunit.js", filter: 'isFile'},
          {src:["bower_components/qunit/qunit/qunit.css"], dest: "qunit.css", filter: 'isFile'}
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-contrib-copy');
  
  //grunt.registerTask('test', [ 'build', 'testee' ]);
  grunt.registerTask('build', [ 'copy' ]);
  grunt.registerTask('default', [ 'build' ]);
};
