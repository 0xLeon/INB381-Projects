/**
 * Object representing the ObjectLoading application
 * 
 * @type	{Object}
 */
var ObjectLoading = (function() {
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
	
	/**
	 * Object containing all WebGL shader variables locations for the used shaders
	 * 
	 * @type	{Object}
	 */
	var shadersVariables = {
		vPosition:	null
	};
	
	/**
	 * Vertex WebGL buffer object
	 * 
	 * @type	{WebGLBuffer}
	 */
	var vertBuffer = null;
	
	/**
	 * Vertices index WebGL buffer object
	 * 
	 * @type	{WebGLBuffer}
	 */
	var vertIndexBuffer = null;
	
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
		meshData = ObjectLoader.loadObjDataFromHttp('./obj/Monkey.obj');
	};
	
	/**
	 * Loads and compiles the shaders
	 */
	var loadShaders = function() {
		vertShader = ShaderLoader.loadShaderFromHtml(gl, $('#vertex-shader'), WebGLRenderingContext.VERTEX_SHADER);
		fragShader = ShaderLoader.loadShaderFromHtml(gl, $('#fragment-shader'), WebGLRenderingContext.FRAGMENT_SHADER);
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
		vertBuffer = gl.createBuffer();
		gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, vertBuffer);
		gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, WebGLHelper.flattenf32(meshData.vertices), WebGLRenderingContext.STATIC_DRAW);
		
		vertIndexBuffer = gl.createBuffer();
		gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, vertIndexBuffer);
		gl.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, WebGLHelper.flattenui16(meshData.vertexIndices), WebGLRenderingContext.STATIC_DRAW);
	};
	
	/**
	 * Binds needed shaders before rendering
	 */
	var bindShaders = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		
		gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, vertBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
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
		gl.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
		gl.drawElements(WebGLRenderingContext.LINES, meshData.vertexIndices.length * 3, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	};
	
	return {
		init:	init
	};
})();

$(document).ready(function() {
	ObjectLoading.init($('#gl-canvas'));
});
