/**
 * Object representing the Triangle application
 * 
 * @type	{Object}
 */
var Triangle = (function() {
	/**
	 * Canvas node
	 *
	 * @type	{jQuery}
	 */
	var canvas = null;
	
	/**
	 * WebGL rendering context
	 *
	 * @type	{WebGLRenderingContext}
	 */
	var gl = null;
	
	/**
	 * Monkey mesh object returned from OBJ Loader
	 *
	 * @type	{Object}
	 */
	var meshData = null;
	
	/**
	 * Vertex shadr WebGL object
	 *
	 * @type	{WebGLShader}
	 */
	var vertShader = null;
	
	/**
	 * Fragment shader WebGL object
	 *
	 * @type	{WebGLShader}
	 */
	var fragShader = null;
	
	/**
	 * Linked WebGL program object
	 *
	 * @type	{WebGLProgram}
	 */
	var program = null;
	
	var shadersVariables = {
		vPosition: null
	};
	
	/**
	 * Initializing constructor for this application
	 *
	 * @param	{jQuery}	_canvas		Canvas node
	 */
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
			initWebGLContext();
			loadMeshData();
			loadShaders();
			linkProgram();
			loadData();
			bindShaders();
			startWebGL();
		}
		catch (e) {
			window.alert(e.message);
			console.error(e);
		}
	};
	
	/**
	 * Setting up the WebGL context and viewport
	 */
	var initWebGLContext = function() {
		gl.viewport(0, 0, canvas.get(0).width, canvas.get(0).height);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	/**
	 * Loads the mesh data
	 */
	var loadMeshData = function() {
		meshData = [
			vec2.fromValues(-0.5, -0.5),
			vec2.fromValues(-0.5, 0.5),
			vec2.fromValues(0.5, -0.5),
			vec2.fromValues(0.5, 0.5)
		];
	};
	
	/**
	 * Loads and compiles the shaders
	 */
	var loadShaders = function() {
		vertShader = ShaderLoader.loadShaderFromHtml(gl, '#vertex-shader', gl.VERTEX_SHADER);
		fragShader = ShaderLoader.loadShaderFromHtml(gl, '#fragment-shader', gl.FRAGMENT_SHADER);
	};
	
	/**
	 * Links the shader program
	 */
	var linkProgram = function() {
		program = ShaderLoader.linkProgram(gl, vertShader, fragShader);
		
		gl.useProgram(program);
	};
	
	/**
	 * Creates the buffers and puts the data to the shaders
	 */
	var loadData = function() {
		var bufferID = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, WebGLHelper.flattenf32(meshData), gl.STATIC_DRAW);
	};
	
	/**
	 * Binds needed shaders before rendering
	 */
	var bindShaders = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		
		gl.vertexAttribPointer(shadersVariables.vPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shadersVariables.vPosition);
	};
	
	/**
	 * Initializes the rendering
	 */
	var startWebGL = function() {
		render();
	};
	
	/**
	 * Renders a frame
	 */
	var render = function() {
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, meshData.length);
	};
	
	return {
		init: init
	};
})();

$(document).ready(function() {
	Triangle.init($('#gl-canvas'));
});
