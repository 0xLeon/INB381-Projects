/**
 * Object containing functions to load and compile shaders
 * 
 * @type	{Object}
 */
var ShaderLoader = (function() {
	'use strict';
	
	/**
	 * Handles a shader source code and compiles the shader with the given type.
	 * 
	 * @param	{WebGLRenderingContext}	gl		The WebGL context
	 * @param	{String}		shaderSource	Shader source code 
	 * @param	{Number}		shaderType	WebGL shader type
	 * @returns	{WebGLShader}				Compiled WebGL shader object
	 */
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
	
	/**
	 * Loads a shader source from the DOM and compiles this shader source.
	 * 
	 * @param	{WebGLRenderingContext}	gl		The WebGL context
	 * @param	{jQuery}		shaderNode	The script node containing the shader source
	 * @param	{Number}		shaderType	WebGL shader type
	 * @returns	{WebGLShader}				Compiled WebGL shader object
	 */
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
	
	/**
	 * Loads a shader source from HTTP and compiles this shader source.
	 * 
	 * @param	{WebGLRenderingContext}	gl		The WebGL context
	 * @param	{String}		shaderLocation	HTTP location of the shader
	 * @param	{Number}		shaderType	WebGL shader type
	 * @returns	{WebGLShader}				Compiled WebGL shader object
	 */
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
	
	/**
	 * Takes any amount of WebGL shaders and returns a linked WebGL program.
	 * 
	 * @param	{WebGLRenderingContext}	gl		The WebGL context
	 * @param	{...WebGLShader}	shaderObjects	Unlimited number of WebGL shader objects
	 * @returns	{WebGLProgram}				Linked WebGL shader program
	 */
	var linkProgram = function(gl, shaderObjects) {
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
