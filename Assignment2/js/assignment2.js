var Assignment2 = (function() {
	/**
	 * Canvas node
	 *
	 * @type	{jQuery}
	 */
	var $canvas = null;
	
	/**
	 * WebGL rendering context
	 *
	 * @type	{WebGLRenderingContext}
	 */
	var gl = null;
	
	/**
	 * Projection matrix
	 *
	 * @type	{mat4}
	 */
	var projectionMatrix = mat4.create();
	
	/**
	 * View matrix
	 * @type	{mat4}
	 */
	var viewMatrix = mat4.create();
	
	var loadingStatus = {
		shaders:	false,
		mesh:		false
	};
	
	var birdMeshes = {
		body:	null,
		wing:	null
	};
	
	var shaders = {
		vertex:		null,
		fragment:	null
	};
	
	var shadersVariables = {
		projectionMatrix:	null,
		viewMatrix:		null,
		mode:			null
	};
	
	var program = null;
	
	/**
	 * Timestamp to keep track of elapsed time for animation
	 *
	 * @type	{number}
	 */
	var lastTime = window.performance.now();
	
	/**
	 * Constructor initializing all needed stuff and starting rendering
	 *
	 * @param	{jQuery}	canvas		The used canvas node
	 */
	var init = function(canvas) {
		$canvas = $(canvas);
		
		try {
			gl = WebGLHelper.createContext($canvas, {});
			
			initViewMatrices();
			initWebGLContext();
			
			loadMeshData();
			loadShaders();
			
			linkProgram();
			locateShadersVariables();
			
			var loadingInterval = window.setInterval(function() {
				if (loadingStatus.shaders && loadingStatus.mesh) {
					window.clearInterval(loadingInterval);
					
					startWebGL();
				}
			}, 10);
		}
		catch (e) {
			window.alert(e);
			console.error(e);
		}
	};
	
	/**
	 * Initializes the view and projection matrices
	 */
	var initViewMatrices = function() {
		mat4.perspective(projectionMatrix, Math.PI / 4, $canvas.get(0).width / $canvas.get(0).height, 1, 100000);
		mat4.lookAt(viewMatrix, vec3.fromValues(0, 0, -8), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
	};
	
	/**
	 * Setting up the WebGL context and viewport
	 */
	var initWebGLContext = function() {
		gl.viewport(0, 0, $canvas.get(0).width, $canvas.get(0).height);
		gl.enable(WebGLRenderingContext.DEPTH_TEST);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
	};
	
	
	/**
	 * Load mesh data objects by HTTP for monkey and sphere
	 */
	var loadMeshData = function() {
		birdMeshes.body = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Bird-Body.obj'));
		birdMeshes.wing = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Bird-Wing.obj'));
		
		loadingStatus.mesh = true;
	};
	
	/**
	 * Load shaders by HTTP
	 */
	var loadShaders = function() {
		shaders.vertex = ShaderLoader.loadShaderFromHttp(gl, './shaders/vertexShader.glsl', WebGLRenderingContext.VERTEX_SHADER);
		shaders.fragment = ShaderLoader.loadShaderFromHttp(gl, './shaders/fragmentShader.glsl', WebGLRenderingContext.FRAGMENT_SHADER);
		
		loadingStatus.shaders = true;
	};
	
	/**
	 * Link all used shader programs
	 */
	var linkProgram = function() {
		program = ShaderLoader.linkProgram(gl, shaders.vertex, shaders.fragment);
	};
	
	/**
	 * Locate all used shaders variables
	 */
	var locateShadersVariables = function() {
		shadersVariables.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
		shadersVariables.viewMatrix = gl.getUniformLocation(program, 'viewMatrix');
		
		shadersVariables.mode = gl.getUniformLocation(program, 'mode');
	};
	
	
	/**
	 * Push view matrices to shaders and start render loop
	 */
	var startWebGL = function() {
		gl.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
		gl.useProgram(program);
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		gl.uniformMatrix4fv(shadersVariables.viewMatrix, false, viewMatrix);
		
		window[WebGLHelper.requestAnimationFrame](render);
	};
	
	/**
	 * Executes one render cycle by drawing and then animating
	 *
	 * @param	{number}	timestampNow	High resolution timestamp
	 */
	var render = function(timestampNow) {
		draw();
		animate(timestampNow, timestampNow - lastTime);
		
		lastTime = timestampNow;
		
		// schedule next render
		window[WebGLHelper.requestAnimationFrame](render);
	};
	
	/**
	 * Executes one draw cycle by pushing needed data and drawing the objects.
	 */
	var draw = function() {
		gl.clear(WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.COLOR_BUFFER_BIT);
	};
	
	/**
	 * Animate all animating objects
	 *
	 * @param	{number}	timestampNow	High resolution timestamp
	 * @param	{number}	deltaTime	High resolution timestamp delta between now and last animation cycle
	 */
	var animate = function(timestampNow, deltaTime) {
		
	};
	
	return {
		init:	init
	};
})();

$(document).ready(function() {
	Assignment2.init($('#gl-canvas'));
});
