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
	
	/**
	 * Object keeping track of loading status of other assets
	 * 
	 * @type	{Object}
	 */
	var loadingStatus = {
		shaders:	false,
		mesh:		false
	};
	
	/**
	 * Object containing all WebGL shaders for this application
	 * 
	 * @type	{Object}
	 */
	var shaders = {
		vertex:		null,
		fragment:	null
	};
	
	/**
	 * Object containing all WebGL shader variables pointers for the used shaders
	 * 
	 * @type	{Object}
	 */
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
	
	/**
	 * The WebGL shader program used for this application
	 * 
	 * @type	{Object}
	 */
	var program = null;
	
	/**
	 * Object keeping track of the keyboard state
	 * 
	 * @type	{Object}
	 */
	var keyState = {
		a:	false,
		d:	false,
		s:	false,
		x:	false,
		y:	false,
		z:	false
	};
	
	/**
	 *
	 * @type {Bird}
	 */
	var bird = null;
	
	/**
	 * Object keeping track of the bird states
	 * 
	 * @type	{Object}
	 */
	var birdStates = {
		crashing:	false,
		spiraling:	false,
		looping:	false
	};
	
	/**
	 * The rotation speed for the wing flapping
	 * 
	 * @type	{number}
	 */
	var wingsFlapRotationVelocity = 0.04375;
	
	/**
	 * The rotation speed for the neck, head and tail flappng
	 * 
	 * @type	{number}
	 */
	var bodyFlapRotationVelocity = 0.021875;
	
	/**
	 * The movement speed for xz movement
	 * 
	 * @type	{number}
	 */
	var forwardMovementVelocity = 0.2;
	
	/**
	 * The radial velocity for the spiral path
	 * 
	 * @type	{number}
	 */
	var spiralRotationVelocity = 0;
	
	/**
	 * The WebGL graphics object for the ground
	 * 
	 * @type	{WebGLGraphicsObject}
	 */
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
	 * jQuery object to access the lighting switch
	 * 
	 * @type	{jQuery}
	 */
	var $lightingSwitch = null;
	
	/**
	 * Current lighting state
	 * 
	 * @type	{boolean}
	 */
	var doLighting = false;
	
	/**
	 * jQuery object to access the material switch
	 *
	 * @type	{jQuery}
	 */
	var $basicMaterialSwitch = null;
	
	/**
	 * Current material state
	 * 
	 * @type	{boolean}
	 */
	var useBasicMaterial = false;
	
	/**
	 * jQuery object to access the sound checkbox
	 *
	 * @type	{jQuery}
	 */
	var $soundSwitch = null;
	
	/**
	 * Current sound state
	 *
	 * @type	{boolean}
	 */
	var enableSound = false;
	
	/**
	 * Sound object used for the flapping sound
	 * 
	 * @type	{Audio}
	 */
	var birdFlapSound = new Audio('./sound/WingFlapA.wav');
	
	
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
			initConfigSwitches();
			
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
	
	/**
	 * Initialized the keyboard event listeners
	 */
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
				case 89:
					keyState.y = true;
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
				case 89:
					keyState.y = false;
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
	 * Initializes the DOM checkbox event listeners and get's their initial state
	 */
	var initConfigSwitches = function() {
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
		
		$soundSwitch = $('#enable-sound');
		$soundSwitch.on('change', function() {
			enableSound = $(this).is(':checked');
		});
		enableSound = $soundSwitch.is(':checked');
	};
	
	
	/**
	 * Load mesh data objects by HTTP for bird and ground
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
	 * Push basic config to shaders and start render loop
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
		
		// handle fps stats
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
		
		// render bird
		bird.render();
		
		
		// render ground
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
		// current bird position
		var birdX = bird.getTree().root.worldTransform[12];
		var birdY = bird.getTree().root.worldTransform[13];
		var birdZ = bird.getTree().root.worldTransform[14];
		
		// bird movement vector based on current orientation
		var birdMotionVector = vec2.fromValues(Math.sin(bird.getTree().body.localRotation[1]), Math.cos(bird.getTree().body.localRotation[1]));
		
		// amount to translate bird in this animation step
		var birdTranslation = vec3.create();
		
		// check for state changes if there is no special state now
		if ((birdY > -7) && !(birdStates.crashing || birdStates.spiraling || birdStates.looping)) {
			if (keyState.z) {
				birdStates.crashing = true;
			}
			else if (keyState.x) {
				birdStates.spiraling = true;
				spiralRotationVelocity = 0;
				forwardMovementVelocity = 0.2;
			}
			else if (keyState.y) {
				birdStates.looping = true;
				forwardMovementVelocity = 0.2;
			}
		}
		
		if (birdStates.crashing) {
			// handle crashing state
			
			vec3.set(birdTranslation, 0, -0.5, 0);
			
			if (birdY < -7) {
				// leave state if bird is on the ground
				birdStates.crashing = false;
				forwardMovementVelocity = 0;
			}
		}
		else if (birdStates.spiraling) {
			// handle spiraling state
			
			spiralRotationVelocity += 0.0007;
			
			if (birdY > -7) {
				// in spiraling, not slinding if bird is above the ground
				forwardMovementVelocity += 0.0004;
				
				bird.getTree().body.localRotation[1] += spiralRotationVelocity;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
				
				birdTranslation[1] = -0.02;
			}
			else {
				// bird is on the ground, no spiraling, but sliding
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
				// leave state if there is no more movement (sliding)
				birdStates.spiraling = false;
				forwardMovementVelocity = 0;
			}
		}
		else {
			// looping state allows normal steering
			if (birdStates.looping) {
				bird.getTree().body.localRotation[2] -= 0.1;
				
				if (Math.abs(bird.getTree().body.localRotation[2]) % (Math.PI * 2) < 0.1) {
					bird.getTree().body.localRotation[2] = 0;
					forwardMovementVelocity = 0.2;
					birdStates.looping = false;
				}
			}
			
			if (keyState.s) {
				// start moveing after stopping
				forwardMovementVelocity = 0.2;
			}
			
			if (keyState.a) {
				// turn left
				bird.getTree().body.localRotation[1] += 0.035;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			}
			
			if (keyState.d) {
				// turn right
				bird.getTree().body.localRotation[1] -= 0.035;
				
				birdMotionVector[0] = Math.sin(bird.getTree().body.localRotation[1]);
				birdMotionVector[1] = Math.cos(bird.getTree().body.localRotation[1]);
			}
			
			// checl for left and right limits
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
			
			// check for front and back limits
			if ((birdZ <= -20) || (birdZ >= 75)) {
				birdMotionVector[1] *= -1;
				
				bird.getTree().body.localRotation[1] = Math.atan2(birdMotionVector[0], birdMotionVector[1]);
			}
			
			// move if the forward velocity is greater than zero
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
		
		// flap, if the bird if moving
		if (!birdStates.looping && (Math.abs(forwardMovementVelocity) > 0.000001)) {
			bird.getTree().leftUpperWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().rightUpperWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().leftLowerWing.localRotation[2] += wingsFlapRotationVelocity;
			bird.getTree().rightLowerWing.localRotation[2] += -wingsFlapRotationVelocity;
			
			bird.getTree().tail.localRotation[0] += bodyFlapRotationVelocity;
			bird.getTree().neck.localRotation[0] -= bodyFlapRotationVelocity;
			bird.getTree().head.localRotation[0] += bodyFlapRotationVelocity;
			
			// check for joint limits
			if ((bird.getTree().leftUpperWing.localRotation[2] >= (Math.PI * 25 / 180)) || (bird.getTree().leftUpperWing.localRotation[2] <= (Math.PI * -25 / 180))) {
				wingsFlapRotationVelocity *= -1;
				bodyFlapRotationVelocity *= -1;
				
				if (enableSound && (wingsFlapRotationVelocity < 0)) {
					// play sound if flapping downwards
					birdFlapSound.play();
				}
			}
		}
		
		// move the bird
		mat4.multiply(
			bird.getTree().root.worldTransform,
			mat4.fromTranslation(mat4.create(), birdTranslation),
			bird.getTree().root.worldTransform
		);
	};
	
	/**
	 * Returns the canvas' WebGL context
	 * 
	 * @returns	{WebGLRenderingContext}		The canvas' WebGL context
	 */
	var getGL = function() {
		return gl;
	};
	
	/**
	 * Returns the current object view matrix
	 * 
	 * @returns	{mat4}				The current object view matrix
	 */
	var getModelViewMatrix = function() {
		return viewMatrix;
	};
	
	/**
	 * Returns the pointer ID of the given shader variable name in the current program.
	 * If no variable with that name exists, returns undefined.
	 * 
	 * @param	{string}	name		Te name of the shader variable
	 * @returns	{number}			The shader variable pointer ID or undefined
	 */
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
