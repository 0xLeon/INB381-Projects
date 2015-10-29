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
		normalMatrix:		null,
		mode:			null,
		doLighting:		null,
		useBasicMaterial:	null
	};
	
	var program = null;
	
	var keyState = {
		a:	false,
		d:	false,
		s:	false,
		x:	false,
		z:	false
	};
	
	/**
	 *
	 * @type {Bird}
	 */
	var bird = null;
	
	var birdStates = {
		crashing:	false,
		spiraling:	false,
		sliding:	false
	};
	
	var wingsFlapRotationVelocity = 0.04375;
	var forwardMovementVelocity = 0.2;
	var spiralRotationVelocity = 0;
	
	var groundObj = null;
	
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
	 * 
	 * 
	 * @type	{jQuery}
	 */
	var $lightingSwitch = null;
	
	var doLighting = false;
	
	/**
	 *
	 *
	 * @type	{jQuery}
	 */
	var $basicMaterialSwitch = null;
	
	var useBasicMaterial = false;
	
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
			initLightingSwitches();
			
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
		mat4.lookAt(viewMatrix, vec3.fromValues(0, 5, -30), vec3.fromValues(0, 0, -5), vec3.fromValues(0, 1, 0));
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
	
	var initLightingSwitches = function() {
		$lightingSwitch = $('#enable-lighting');
		$lightingSwitch.on('change', function() {
			doLighting = $(this).is(':checked');
			useBasicMaterial = doLighting && $basicMaterialSwitch.is(':checked');
			
			$basicMaterialSwitch.prop('disabled', !doLighting);
			
			gl.uniform1i(shadersVariables.doLighting, (0 + doLighting));
			gl.uniform1i(shadersVariables.useBasicMaterial, (0 + useBasicMaterial));
		});
		doLighting = $lightingSwitch.is(':checked');
		
		$basicMaterialSwitch = $('#basic-material');
		$basicMaterialSwitch.prop('disabled', !doLighting);
		$basicMaterialSwitch.on('change', function() {
			useBasicMaterial = doLighting && $(this).is(':checked');
			
			gl.uniform1i(shadersVariables.useBasicMaterial, (0 + useBasicMaterial));
		});
		useBasicMaterial = doLighting && $basicMaterialSwitch.is(':checked');
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
		shadersVariables.normalMatrix = gl.getUniformLocation(program, 'normalMatrix');
		
		shadersVariables.mode = gl.getUniformLocation(program, 'mode');
		shadersVariables.doLighting = gl.getUniformLocation(program, 'doLighting');
		shadersVariables.useBasicMaterial = gl.getUniformLocation(program, 'useBasicMaterial');
		
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
		gl.uniform1i(shadersVariables.doLighting, (0 + $lightingSwitch.is(':checked')));
		gl.uniform1i(shadersVariables.useBasicMaterial, (0 + $basicMaterialSwitch.is(':checked')));
		
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
		
		var normalMatrix = mat4.create();
		mat4.invert(normalMatrix, viewMatrix);
		mat4.transpose(normalMatrix, normalMatrix);
		
		gl.uniform1i(shadersVariables.mode, 1);
		gl.uniformMatrix4fv(shadersVariables.viewMatrix, false, viewMatrix);
		gl.uniformMatrix4fv(shadersVariables.normalMatrix, false, normalMatrix);
		gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, groundObj.buffers.normalsBuffer);
		gl.vertexAttribPointer(shadersVariables.vNormal, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, groundObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, groundObj.buffers.vertexIndicesBuffer);
		gl.drawElements(WebGLRenderingContext.TRIANGLES, groundObj.meshData.vertexIndices.length * 3, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	};
	
	/**
	 * Animate all animating objects
	 *
	 * @param	{number}	timestampNow	High resolution timestamp
	 * @param	{number}	deltaTime	High resolution timestamp delta between now and last animation cycle
	 */
	var animate = function(timestampNow, deltaTime) {
		var birdX = bird.getTree().root.worldTransform[12];
		var birdY = bird.getTree().root.worldTransform[13];
		var birdZ = bird.getTree().root.worldTransform[14];
		
		var birdMotionVector = vec2.fromValues(Math.sin(bird.getTree().body.localRotation[1]), Math.cos(bird.getTree().body.localRotation[1]));
		var birdTranslation = vec3.create();
		
		if ((birdY > -7) && !(birdStates.crashing || birdStates.spiraling)) {
			if (keyState.z) {
				birdStates.crashing = true;
			}
			else if (keyState.x) {
				birdStates.spiraling = true;
				spiralRotationVelocity = 0;
				forwardMovementVelocity = 0.2;
			}
		}
		
		if (birdStates.crashing) {
			vec3.set(birdTranslation, 0, -0.5, 0);
			
			if (birdY < -7) {
				birdStates.crashing = false;
				forwardMovementVelocity = 0;
			}
		}
		else if (birdStates.spiraling) {
			spiralRotationVelocity += 0.0007;
			
			if (birdY > -7) {
				forwardMovementVelocity += 0.0004;
				
				bird.getTree().body.localRotation[1] += spiralRotationVelocity;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
				
				birdTranslation[1] = -0.02;
			}
			else {
				forwardMovementVelocity -= 0.005;
				
				if (forwardMovementVelocity <= 0) {
					forwardMovementVelocity = 0;
				}
			}
			
			vec3.set(
				birdTranslation,
				forwardMovementVelocity * birdMotionVector[0],
				birdTranslation[1],
				forwardMovementVelocity * birdMotionVector[1]
			);
			
			if (Math.abs(forwardMovementVelocity) < 0.000001) {
				birdStates.spiraling = false;
				forwardMovementVelocity = 0;
			}
		}
		else {
			if (keyState.s) {
				forwardMovementVelocity = 0.2;
			}
			
			if (keyState.a) {
				bird.getTree().body.localRotation[1] += 0.035;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			}
			
			if (keyState.d) {
				bird.getTree().body.localRotation[1] -= 0.035;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			}
			
			if ((Math.abs(birdX) > (.475 * (birdZ + 20) + 7))) {
				birdMotionVector[1] = 0;
				
				if (birdX < 0) {
					birdMotionVector[0] = 1;
				}
				else {
					birdMotionVector[0] = -1;
				}
				
				bird.getTree().body.localRotation[1] = Math.atan2(birdMotionVector[0], birdMotionVector[1]);
			}
			
			if ((birdZ <= -20) || (birdZ >= 75)) {
				birdMotionVector[1] *= -1;
				
				bird.getTree().body.localRotation[1] = Math.atan2(birdMotionVector[0], birdMotionVector[1]);
			}
			
			if (forwardMovementVelocity > 0) {
				vec3.set(
					birdTranslation,
					forwardMovementVelocity * birdMotionVector[0],
					0,
					forwardMovementVelocity * birdMotionVector[1]
				);
				
				if (birdY < 0) {
					birdTranslation[1] = 0.15;
				}
			}
		}
		
		if (Math.abs(forwardMovementVelocity) > 0.000001) {
			bird.getTree().leftUpperWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().rightUpperWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().leftLowerWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().rightLowerWing.localRotation[2] += -wingsFlapRotationVelocity;
			
			if ((bird.getTree().leftUpperWing.localRotation[2] >= (Math.PI * 25 / 180)) || (bird.getTree().leftUpperWing.localRotation[2] <= (Math.PI * -25 / 180))) {
				wingsFlapRotationVelocity *= -1;
			}
		}
		
		mat4.multiply(
			bird.getTree().root.worldTransform,
			mat4.fromTranslation(mat4.create(), birdTranslation),
			bird.getTree().root.worldTransform
		);
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
