/**
 * Created by Stefan on 19.08.2015.
 */
var ShaderLoader = (function() {
	'use strict';
	
	var handleShader = function(gl, shaderSource, shaderType) {
		// TODO: check parameters
		var shader = gl.createShader(shaderType);
		
		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);
		
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error('Couldn\'t compile shader.' + "\n" + gl.getShaderInfoLog(shader));
		}
		
		return shader;
	};
	
	var loadShaderFromHtml = function(gl, shaderNode, shaderType) {
		// TODO: check parameters
		shaderNode = $(shaderNode);
		
		if (shaderNode.length === 1) {
			return handleShader(gl, shaderNode.text().trim(), shaderType);
		}
		else {
			throw new Error('Couldn\'t find shader node.');
		}
	};
	
	var loadShaderFromHttp = function(gl, shaderLocation, shaderType) {
		// TODO: check parameters
		var shaderSource = null;
		var errorMessage = null;
		
		$.ajax(shaderLocation, {
			// TODO: make this async
			async: false,
			success: function (data, textStatus, jqXHR) {
				shaderSource = data;
			},
			error: function (jqXHR, textStatus, errorThrown) {
				errorMessage = jqXHR.statusText;
			}
		});
		
		if (!shaderSource || !!errorMessage) {
			throw new Error('Couldn\'t load shader source.' + ((!!errorMessage) ? ("\n" + errorMessage) : ''));
		}
		
		return handleShader(gl, shaderSource, shaderType);
	};
	
	var linkProgram = function(gl) {
		if (!gl) {
			throw new Error('Invalid WebGL context.');
		}
		
		var shaders = $.makeArray(arguments).filter(function(shader) {
			return !!shader;
		});
		shaders.shift();
		
		if (shaders.length === 0) {
			throw new Error('Invalid shaders given.');
		}
		
		var program = gl.createProgram();
		
		shaders.forEach(function(shader) {
			gl.attachShader(program, shader);
		});
		gl.linkProgram(program);
		
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error('Couldn\'t link WebGL program.' + "\n" + gl.getProgramInfoLog(program));
		}
		
		return program;
	};
	
	return {
		handleShader:		handleShader,
		loadShaderFromHtml:	loadShaderFromHtml,
		loadShaderFromHttp:	loadShaderFromHttp,
		linkProgram:		linkProgram
	};
})();
