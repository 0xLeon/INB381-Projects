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
	
	var shaders = {
		vertex:		null,
		fragment:	null
	};
	
	var shadersVariables = {
		vPosition:		null,
		vNormal:		null,
		projectionMatrix:	null,
		viewMatrix:		null,
		mode:			null
	};
	
	var program = null;
	
	/**
	 *
	 * @type {Bird}
	 */
	var bird = null;
	
	/**
	 * Timestamp to keep track of elapsed time for animation
	 *
	 * @type	{number}
	 */
	var lastTime = window.performance.now();
	
	/**
	 * Time delta between two animation function calls
	 *
	 * @type	{number}
	 */
	var elapsedTime = 0;
	
	/**
	 * jQuery object to access the fps value node
	 *
	 * @type	{jQuery}
	 */
	var $fpsValue = null;
	
	/**
	 * Current frame count between two cycles
	 *
	 * @type	{number}
	 */
	var framecount = 0;
	
	/**
	 * Current fps value
	 *
	 * @type	{number}
	 */
	var fps = 0;
	
	
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
			
			initFps();
			
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
	 * Initializes the fps measurment
	 */
	var initFps = function() {
		$fpsValue = $('#fps-value');
		
		window.setInterval(function() {
			$fpsValue.text(fps);
		}, 1000);
	};
	
	
	/**
	 * Load mesh data objects by HTTP for monkey and sphere
	 */
	var loadMeshData = function() {
		bird = new Bird({
			getGL:			getGL,
			getModelViewMatrix:	getModelViewMatrix,
			getShaderVariable:	getShaderVariable
		});
		
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
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		shadersVariables.vNormal = gl.getAttribLocation(program, 'vNormal');
		
		shadersVariables.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
		shadersVariables.viewMatrix = gl.getUniformLocation(program, 'viewMatrix');
		
		shadersVariables.mode = gl.getUniformLocation(program, 'mode');
		
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		gl.enableVertexAttribArray(shadersVariables.vNormal);
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
		
		++framecount;
		elapsedTime += (timestampNow - lastTime);
		lastTime = timestampNow;
		
		if (elapsedTime >= 1000) {
			fps = framecount;
			framecount = 0;
			elapsedTime -= 1000;
		}
		
		// schedule next render
		window[WebGLHelper.requestAnimationFrame](render);
	};
	
	/**
	 * Executes one draw cycle by pushing needed data and drawing the objects.
	 */
	var draw = function() {
		gl.clear(WebGLRenderingContext.DEPTH_BUFFER_BIT | WebGLRenderingContext.COLOR_BUFFER_BIT);
		
		bird.render();
	};
	
	/**
	 * Animate all animating objects
	 *
	 * @param	{number}	timestampNow	High resolution timestamp
	 * @param	{number}	deltaTime	High resolution timestamp delta between now and last animation cycle
	 */
	var animate = function(timestampNow, deltaTime) {
		
	};
	
	/**
	 *
	 * @returns	{WebGLRenderingContext}
	 */
	var getGL = function() {
		return gl;
	};
	
	var getModelViewMatrix = function() {
		return viewMatrix;
	};
	
	var getShaderVariable = function(name) {
		return shadersVariables[name];
	};
	
	return {
		init:			init,
		
		getGL:			getGL,
		getModelViewMatrix:	getModelViewMatrix,
		getShaderVariable:	getShaderVariable
	};
})();

$(document).ready(function() {
	Assignment2.init($('#gl-canvas'));
});
