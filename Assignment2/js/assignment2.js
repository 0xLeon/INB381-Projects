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
	
	
	var keyState = {
		a:	false,
		d:	false,
		s:	false,
		x:	false,
		z:	false
	};
	
	var birdStates = {
		crashing:	false,
		spiraling:	false,
		sliding:	false
	};
	
	var groundObj = null;
	
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
			initKeyState();
			
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
		mat4.perspective(projectionMatrix, Math.PI / 4, $canvas.get(0).width / $canvas.get(0).height, 0.1, 1000);
		mat4.lookAt(viewMatrix, vec3.fromValues(0, 5, -30), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
	};
	
	/**
	 * Setting up the WebGL context and viewport
	 */
	var initWebGLContext = function() {
		gl.viewport(0, 0, $canvas.get(0).width, $canvas.get(0).height);
		gl.enable(WebGLRenderingContext.DEPTH_TEST);
		gl.clearColor(0.5, 0.5, 0.5, 1.0);
	};
	
	var initKeyState = function() {
		$(document).on('keydown', function(event) {
			switch (event.keyCode) {
				case 65:
					keyState.a = true;
					break;
				case 68:
					keyState.d = true;
					break;
				case 83:
					keyState.s = true;
					break;
				case 88:
					keyState.x = true;
					break;
				case 90:
					keyState.z = true;
					break;
			}
		});
		$(document).on('keyup', function(event) {
			switch (event.keyCode) {
				case 65:
					keyState.a = false;
					break;
				case 68:
					keyState.d = false;
					break;
				case 83:
					keyState.s = false;
					break;
				case 88:
					keyState.x = false;
					break;
				case 90:
					keyState.z = false;
					break;
			}
		})
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
		
		groundObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdGround.obj'));
		
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
		
		gl.uniform1i(shadersVariables.mode, 1);
		gl.uniformMatrix4fv(shadersVariables.viewMatrix, false, viewMatrix);
		gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, groundObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, groundObj.buffers.vertexIndicesBuffer);
		gl.drawElements(WebGLRenderingContext.TRIANGLES, groundObj.meshData.vertexIndices.length * 3, WebGLRenderingContext.UNSIGNED_SHORT, 0);
		
	};
	
	var d1 = 0.0175 * 2.5;
	var s = 0.2;
	
	var motionVector = vec2.create();
	var deltaTurn = 0;
	
	/**
	 * Animate all animating objects
	 *
	 * @param	{number}	timestampNow	High resolution timestamp
	 * @param	{number}	deltaTime	High resolution timestamp delta between now and last animation cycle
	 */
	var animate = function(timestampNow, deltaTime) {
		// bird.getTree().body.localRotation[1] = (bird.getTree().body.localRotation[1] + 0.0175) % (Math.PI * 2);
		
		var birdX = bird.getTree().root.worldTransform[12];
		var birdY = bird.getTree().root.worldTransform[13];
		var birdZ = bird.getTree().root.worldTransform[14];
		
		if (birdY > -7) {
			if (keyState.z && !birdStates.spiraling) {
				birdStates.crashing = true;
			}
			
			if (keyState.x && !birdStates.spiraling && !birdStates.spiraling) {
				birdStates.spiraling = true;
				deltaTurn = 0;
				s = 0.2;
			}
		}
		
		if (birdStates.crashing) {
			mat4.multiply(
				bird.getTree().root.worldTransform,
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, -.5, 0)),
				bird.getTree().root.worldTransform
			);
			
			if (birdY < -7) {
				birdStates.crashing = false;
				s = 0;
			}
		}
		else if (birdStates.spiraling) {
			var deltaY = -.02;
			deltaTurn += 0.0007;
			
			
			if (birdY > -7) {
				s += 0.0004;
				
				bird.getTree().body.localRotation[1] += deltaTurn;
				
				motionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				motionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			}
			else {
				s -= 0.005;
				
				if (s <= 0) {
					s = 0;
				}
			}
			
			if (birdY < -7) {
				deltaY = 0;
			}
			
			mat4.multiply(
				bird.getTree().root.worldTransform,
				mat4.fromTranslation(mat4.create(), vec3.fromValues(s * motionVector[0], deltaY, s * motionVector[1])),
				bird.getTree().root.worldTransform
			);
			
			bird.getTree().leftUpperWing.localRotation[2] += d1;
			bird.getTree().rightUpperWing.localRotation[2] += d1;
			bird.getTree().leftLowerWing.localRotation[2] += d1;
			bird.getTree().rightLowerWing.localRotation[2] += -d1;
			
			if ((bird.getTree().leftUpperWing.localRotation[2] >= (Math.PI * 25 / 180)) || (bird.getTree().leftUpperWing.localRotation[2] <= (Math.PI * -25 / 180))) {
				d1 *= -1;
			}
			
			if (Math.abs(s) < 0.00001) {
				birdStates.spiraling = false;
				s = 0;
			}
		}
		else {
			if (keyState.s) {
				s = .2;
			}
			
			if (keyState.a) {
				bird.getTree().body.localRotation[1] += 0.0175 * 2;
			}
			
			if (keyState.d) {
				bird.getTree().body.localRotation[1] -= 0.0175 * 2;
			}
			
			
			motionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
			motionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			
			if ((Math.abs(birdX) > (.675 * (birdZ + 20) + 5))) {
				motionVector[1] = 0;
				
				if (birdX < 0) {
					motionVector[0] = 1;
				}
				else {
					motionVector[0] = -1;
				}
				
				bird.getTree().body.localRotation[1] = Math.atan2(motionVector[0], motionVector[1]);
			}
			
			if ((birdZ <= -20) || (birdZ >= 50)) {
				motionVector[1] *= -1;
				
				bird.getTree().body.localRotation[1] = Math.atan2(motionVector[0], motionVector[1]);
			}
			
			if (s > 0) {
				if (birdY < 0) {
					bird.getTree().root.worldTransform[13] += .15;
				}
				
				mat4.multiply(
					bird.getTree().root.worldTransform,
					mat4.fromTranslation(mat4.create(), vec3.fromValues(s * motionVector[0], 0, s * motionVector[1])),
					bird.getTree().root.worldTransform
				);
				
				bird.getTree().leftUpperWing.localRotation[2] += d1;
				bird.getTree().rightUpperWing.localRotation[2] += d1;
				bird.getTree().leftLowerWing.localRotation[2] += d1;
				bird.getTree().rightLowerWing.localRotation[2] += -d1;
				
				if ((bird.getTree().leftUpperWing.localRotation[2] >= (Math.PI * 25 / 180)) || (bird.getTree().leftUpperWing.localRotation[2] <= (Math.PI * -25 / 180))) {
					d1 *= -1;
				}
			}
		}
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
