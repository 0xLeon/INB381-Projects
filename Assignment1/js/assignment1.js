/**
 * Object representing the assignment 1 application
 * 
 * @type	{Object}
 */
var Assignment1 = (function() {
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
	 * Multiplied view and projection matrix
	 * 
	 * @type	{mat4}
	 */
	var finalViewMatrix = mat4.create();
	
	/**
	 * Monkey WebGL graphics object
	 * 
	 * @type	{WebGLGraphicsObject}
	 */
	var monkeyObj = null;
	
	/**
	 * Per vertex colors for monkey object
	 * 
	 * @type	{Array.<number>}
	 */
	var monkeyColors = [];
	
	/**
	 * Sphere WebGL graphics object
	 * 
	 * @type	{WebGLGraphicsObject}
	 */
	var sphereObj = null;
	
	/**
	 * Per vertex colors for sphere object
	 * 
	 * @type	{Array.<number>}
	 */
	var sphereColors = [];
	
	/**
	 * Object containing each monkey and its attributes
	 * 
	 * @type	{Object}
	 */
	var monkeys = {
		1: {
			direction:	1,
			rotation:	vec3.fromValues(0, 0, 0),
			amp:		0.7,
			freq:		2.0,
			transSpeedFac:	5,
			rotSpeedFac:	1,
			t:		0,
			bounceSound:	null,
			pickingColor:	WebGLHelper.flatteni32([0, 0, 1]),
			onpick:		null
		},
		2: {
			direction:	-1,
			rotation:	vec3.fromValues(0, 0, 0),
			amp:		0.7,
			freq:		1.0,
			transSpeedFac:	2,
			rotSpeedFac:	2,
			t:		500,
			bounceSound:	null,
			pickingColor:	WebGLHelper.flatteni32([0, 0, 2]),
			onpick:		null
		}
	};
	
	/**
	 * Object containing each sphere and its attributes
	 * 
	 * @type	{Object}
	 */
	var spheres = {
		1: {
			index:		1,
			t:		0,
			transStart:	vec3.fromValues(-4, 2, 0),
			endTrans:	vec3.fromValues(-4, -2, 0),
			rotation:	vec3.fromValues(0, 0, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 3]),
			
			minScreen:	null,
			maxScreen:	null,
			
			onpick:		null
		},
		2: {
			index:		2,
			t:		0,
			transStart:	vec3.fromValues(4, 2, 0),
			endTrans:	vec3.fromValues(4, -2, 0),
			rotation:	vec3.fromValues(0, 0, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 4]),
			
			minScreen:	null,
			maxScreen:	null,
			
			onpick:		null
		},
		3: {
			index:		3,
			t:		0,
			transStart:	vec3.fromValues(-4, -2, 0),
			endTrans:	vec3.fromValues(-4, 2, 0),
			rotation:	vec3.fromValues(0, 0, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 5]),
			
			minScreen:	null,
			maxScreen:	null,
			
			onpick:		null
		},
		4: {
			index:		4,
			t:		0,
			transStart:	vec3.fromValues(4, -2, 0),
			endTrans:	vec3.fromValues(4, 2, 0),
			rotation:	vec3.fromValues(0, 0, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 6]),
			
			minScreen:	null,
			maxScreen:	null,
			
			onpick:		null
		}
	};
	
	/**
	 * Object containing all WebGL programs for this application
	 * 
	 * @type	{Object}
	 */
	var programs = {
		monkey:		null
	};
	
	/**
	 * Object containing all WebGL shaders for this application
	 * 
	 * @type	{Object}
	 */
	var shaders = {
		vertex:	{
			monkey:		null
		},
		fragment: {
			standard:	null
		}
	};
	
	/**
	 * Object containing all WebGL shader variables locations for the used shaders
	 * 
	 * @type	{Object}
	 */
	var shadersVariables = {
		vPosition:		null,
		vColor:			null,
		
		projectionMatrix:	null,
		viewMatrix:		null,
		
		rotation:		null,
		t:			null,
		gFactor:		null,
		bFactor:		null,
		
		s1start:		null,
		s1end:			null,
		s1t:			null,
		
		s2start:		null,
		s2end:			null,
		s2t:			null,
		
		sinAmplitude:		null,
		sinFrequency:		null,
		
		sphereTransStart:	null,
		sphereTransEnd:		null,
		
		doPickingRender:	null,
		pickingColor:		null
	};
	
	/**
	 * Object containing additionally used WebGL buffers
	 * 
	 * @type	{Object}
	 */
	var buffers = {
		monkeyColorBuffer:		null,
		sphereColorBuffer:		null
	};
	
	/**
	 * Object keeping track of the picking state and list
	 * 
	 * @type	{Object}
	 */
	var picking = {
		doPicking:		false,
		capturedColorMap:	null,
		framebuffer:		null,
		list:			{}
	};
	
	/**
	 * Object keeping track of the mouse state and dragging
	 * 
	 * @type	{Object}
	 */
	var mouseState = {
		altKey:			false,
		currentPosition: {
			x:	0,
			y:	0
		},
		dragging: {
			active:		false,
			element:	null
		}
	};
	
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
	 * jQuery object to access the sound chackbox
	 * 
	 * @type	{jQuery}
	 */
	var $soundCheckbox = null;
	
	/**
	 * Current sound state
	 * 
	 * @type	{boolean}
	 */
	var enableSound = true;
	
	
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
			
			initFps();
			initSliders();
			initButtons();
			initMouseState();
			initDragging();
			initSound();
			
			initMonkeys();
			initSpheres();
			
			initWebGLContext();
			initPicking();
			loadMeshData();
			makeColorData();
			loadShaders();
			linkProgram();
			locateShadersVariables();
			initColorBuffer();
			startWebGL();
		}
		catch (e) {
			window.alert(e.message);
			console.error(e);
		}
	};
	
	
	/**
	 * Initializes the view and projection matrices
	 */
	var initViewMatrices = function() {
		mat4.perspective(projectionMatrix, Math.PI / 4, $canvas.get(0).width / $canvas.get(0).height, 1, 100000);
		mat4.lookAt(viewMatrix, vec3.fromValues(0, 0, -8), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
		mat4.multiply(finalViewMatrix, projectionMatrix, viewMatrix);
	};
	
	
	/**
	 * Initializes the fps measurment
	 */
	var initFps = function() {
		$fpsValue = $('#fps-value');
		
		window.setInterval(function() {
			$fpsValue.text(Assignment1.getFps());
		}, 1000);
	};
	
	/**
	 * Initializes the monkey and sphere sliders
	 */
	var initSliders = function() {
		for (var j = 1; j < 3; ++j) {
			var sliderAmp = $('#monkey' + j.toString(10) + '-amp');
			var sliderAmpVal = $('#monkey' + j.toString(10) + '-amp-val');
			
			var sliderFreq = $('#monkey' + j.toString(10) + '-freq');
			var sliderFreqVal = $('#monkey' + j.toString(10) + '-freq-val');
			
			sliderAmpVal.text(sliderAmp.get(0).value);
			sliderFreqVal.text(sliderFreq.get(0).value);
			
			$([sliderAmp.get(0), sliderFreq.get(0)]).on('input', function() {
				var $this = $(this);
				var value = parseFloat($this.get(0).value);
				
				$('#monkey' + $this.data('index').toString() + '-' + $this.data('type') + '-val').text(value);
				
				monkeys[$this.data('index')][$this.data('type')] = value;
			});
		}
		
		for (var i = 1; i < 5; ++i) {
			var slider = $('#sphere' + i.toString(10) + '-pos');
			var sliderVal = $('#sphere' + i.toString(10) + '-pos-val');
			
			sliderVal.text(slider.get(0).value);
			
			slider.data('index', i);
			slider.on('input', function() {
				var value = parseInt($(this).get(0).value, 10);
				
				$('#sphere' + $(this).data('index').toString() + '-pos-val').text(parseInt(value / 10, 10));
				
				spheres[$(this).data('index')].t = value;
			});
		}
	};
	
	/**
	 * Initializes the monkey speed buttons
	 */
	var initButtons = function() {
		for (var i = 1; i < 3; ++i) {
			var buttonUp = $('#monkey' + i.toString(10) + '-up');
			var buttonDown = $('#monkey' + i.toString(10) + '-down');
			
			buttonUp.data('index', i);
			buttonDown.data('index', i);
			
			buttonUp.on('click', function() {
				monkeys[$(this).data('index')].transSpeedFac += 1;
				
				if (monkeys[$(this).data('index')].transSpeedFac >= 9.9) {
					monkeys[$(this).data('index')].transSpeedFac = 10;
				}
			});
			
			buttonDown.on('click', function() {
				monkeys[$(this).data('index')].transSpeedFac -= 1;
				
				if (monkeys[$(this).data('index')].transSpeedFac <= 0.1) {
					monkeys[$(this).data('index')].transSpeedFac = 0;
				}
			});
		}
	};
	
	/**
	 * Setting up event listeners to keep track of alt key
	 */
	var initMouseState = function() {
		$(document).on('keydown', function(event) {
			if (18 === event.keyCode) {
				mouseState.altKey = true;
			}
		});
		$(document).on('keyup', function(event) {
			if (18 === event.keyCode) {
				mouseState.altKey = false;
			}
		})
	};
	
	/**
	 * Setting up event listeners to enable and keep track of dragging
	 */
	var initDragging = function() {
		$canvas.on('mousedown', function(event) {
			mouseState.currentPosition.x = event.pageX - $(this).offset().left - (parseInt($(this).css('borderLeftWidth'), 10) || 0) - (parseInt($(this).css('paddingLeft'), 10) || 0);
			mouseState.currentPosition.y = event.pageY - $(this).offset().top - (parseInt($(this).css('borderTopWidth'), 10) || 0) - (parseInt($(this).css('paddingTop'), 10) || 0);
			
			if ((mouseState.currentPosition.x >= 0) && (mouseState.currentPosition.y >= 0) && (mouseState.currentPosition.x < $canvas.get(0).width) && (mouseState.currentPosition.y < $canvas.get(0).height)) {
				picking.doPicking = true;
			}
		});
		$(document).on('mouseup', function() {
			mouseState.dragging.active = false;
			mouseState.dragging.element = null;
		});
		$(document).on('mousemove', function(event) {
			mouseState.currentPosition.x = event.pageX - $canvas.offset().left - (parseInt($canvas.css('borderLeftWidth'), 10) || 0) - (parseInt($canvas.css('paddingLeft'), 10) || 0);
			mouseState.currentPosition.y = event.pageY - $canvas.offset().top - (parseInt($canvas.css('borderTopWidth'), 10) || 0) - (parseInt($canvas.css('paddingTop'), 10) || 0);
			
			if (mouseState.dragging.active && (null !== mouseState.dragging.element)) {
				var sphere = mouseState.dragging.element;
				
				var sphereMinY = sphere.minScreen[1];
				var sphereMaxY = sphere.maxScreen[1];
				
				sphere.t =  Math.round(((mouseState.currentPosition.y - sphereMinY) / (sphereMaxY - sphereMinY)) * 1000);
				
				if (sphere.t >= 1000) {
					sphere.t = 1000;
				}
				else if (sphere.t <= 0) {
					sphere.t = 0;
				}
				
				$('#sphere' + sphere.index.toString(10) + '-pos-val').text(parseInt(sphere.t / 10, 10));
				$('#sphere' + sphere.index.toString(10) + '-pos').get(0).value = sphere.t;
			}
		});
	};
	
	/**
	 * Initializes bounce sound
	 */
	var initSound = function() {
		$soundCheckbox = $('#enable-sound');
		enableSound = $soundCheckbox.is(':checked');
		
		$soundCheckbox.on('change', function() {
			enableSound = ($(this).is(':checked'));
		});
	};
	
	
	/**
	 * Setting up additional attributes of monkey objects
	 */
	var initMonkeys = function() {
		for (var i = 1; i < 3; ++i) {
			monkeys[i].onpick = monkeyPick;
			monkeys[i].bounceSound = new Audio('./sound/Jump.wav');
		}
	};
	
	/**
	 * Stting up additional attributrs of sphere objects
	 */
	var initSpheres = function() {
		for (var i = 1; i < 5; ++i) {
			spheres[i].minScreen = vec4.transformMat4(vec4.create(), vec4.fromValues(spheres[i].transStart[0], spheres[i].transStart[1], spheres[i].transStart[2], 1.0), finalViewMatrix);
			spheres[i].maxScreen = vec4.transformMat4(vec4.create(), vec4.fromValues(spheres[i].endTrans[0], spheres[i].endTrans[1], spheres[i].endTrans[2], 1.0), finalViewMatrix);
			
			spheres[i].minScreen[0] /= spheres[i].minScreen[3];
			spheres[i].minScreen[1] /= spheres[i].minScreen[3];
			// spheres[i].minScreen[2] /= spheres[i].minScreen[3];
			
			spheres[i].maxScreen[0] /= spheres[i].maxScreen[3];
			spheres[i].maxScreen[1] /= spheres[i].maxScreen[3];
			// spheres[i].maxScreen[2] /= spheres[i].maxScreen[3];
			
			spheres[i].minScreen[0] = $canvas.get(0).width * (spheres[i].minScreen[0] + 1) / 2;
			spheres[i].minScreen[1] = $canvas.get(0).height - ($canvas.get(0).height * (spheres[i].minScreen[1] + 1) / 2);
			
			spheres[i].maxScreen[0] = $canvas.get(0).width * (spheres[i].maxScreen[0] + 1) / 2;
			spheres[i].maxScreen[1] = $canvas.get(0).height - ($canvas.get(0).height * (spheres[i].maxScreen[1] + 1) / 2);
			
			spheres[i].minScreen = vec2.fromValues(spheres[i].minScreen[0], spheres[i].minScreen[1]);
			spheres[i].maxScreen = vec2.fromValues(spheres[i].maxScreen[0], spheres[i].maxScreen[1]);
			
			
			spheres[i].onpick = sphereStartDrag;
		}
	};
	
	
	/**
	 * Setting up the WebGL context and viewport
	 */
	var initWebGLContext = function() {
		gl.viewport(0, 0, $canvas.get(0).width, $canvas.get(0).height);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	/**
	 * Initializes needed framebuffer, texture and picking list for picking
	 */
	var initPicking = function() {
		picking.capturedColorMap = new Uint8Array($canvas.get(0).width * $canvas.get(0).height * 4);
		picking.framebuffer = gl.createFramebuffer();
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, picking.framebuffer);
		
		var rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, $canvas.get(0).width, $canvas.get(0).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
		var renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, $canvas.get(0).width, $canvas.get(0).height);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
		
		picking.list[buildAddressFromColor(monkeys[1].pickingColor)] = monkeys[1];
		picking.list[buildAddressFromColor(monkeys[2].pickingColor)] = monkeys[2];
		picking.list[buildAddressFromColor(spheres[1].pickingColor)] = spheres[1];
		picking.list[buildAddressFromColor(spheres[2].pickingColor)] = spheres[2];
		picking.list[buildAddressFromColor(spheres[3].pickingColor)] = spheres[3];
		picking.list[buildAddressFromColor(spheres[4].pickingColor)] = spheres[4];
	};
	
	/**
	 * Load mesh data objects by HTTP for monkey and sphere
	 */
	var loadMeshData = function() {
		monkeyObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Monkey.obj'));
		sphereObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Sphere.obj'));
	};
	
	/**
	 * Generate color per vertex data for monkey and sphere
	 */
	var makeColorData = function() {
		var arrayPush = Array.prototype.push;
		
		var randRed = 0;
		for (var i = 0, l = monkeyObj.meshData.vertexIndices.length * 3; i < l; i += 3) {
			randRed = .5 + (Math.random() * .5);
			
			arrayPush.apply(monkeyColors, [randRed, 0., 0., 1.0]);
			arrayPush.apply(monkeyColors, [randRed, 0., 0., 1.0]);
			arrayPush.apply(monkeyColors, [randRed, 0., 0., 1.0]);
		}
		
		var randGrey = 0;
		for (var j = 0, k = sphereObj.meshData.vertexIndices.length * 3; j < k; j += 3) {
			randGrey = (Math.floor(Math.random() * 101) + 100) / 255.0;
			
			arrayPush.apply(sphereColors, [randGrey, randGrey, randGrey, 1.0]);
			arrayPush.apply(sphereColors, [randGrey, randGrey, randGrey, 1.0]);
			arrayPush.apply(sphereColors, [randGrey, randGrey, randGrey, 1.0]);
		}
	};
	
	/**
	 * Load shaders by HTTP
	 */
	var loadShaders = function() {
		shaders.vertex.monkey = ShaderLoader.loadShaderFromHttp(gl, './shaders/monkeyVertexShader.glsl', gl.VERTEX_SHADER);
		shaders.fragment.standard = ShaderLoader.loadShaderFromHttp(gl, './shaders/standardFragmentShader.glsl', gl.FRAGMENT_SHADER);
	};
	
	/**
	 * Link all used shader programs
	 */
	var linkProgram = function() {
		programs.monkey = ShaderLoader.linkProgram(gl, shaders.vertex.monkey, shaders.fragment.standard);
	};
	
	/**
	 * Locate all used shaders variables
	 */
	var locateShadersVariables = function() {
		shadersVariables.vPosition = gl.getAttribLocation(programs.monkey, 'vPosition');
		shadersVariables.vColor = gl.getAttribLocation(programs.monkey, 'vColor');
		
		shadersVariables.projectionMatrix = gl.getUniformLocation(programs.monkey, 'projectionMatrix');
		shadersVariables.viewMatrix = gl.getUniformLocation(programs.monkey, 'viewMatrix');
		
		shadersVariables.rotation = gl.getUniformLocation(programs.monkey, 'rotation');
		shadersVariables.t = gl.getUniformLocation(programs.monkey, 't');
		
		shadersVariables.gFactor = gl.getUniformLocation(programs.monkey, 'gFactor');
		shadersVariables.bFactor = gl.getUniformLocation(programs.monkey, 'bFactor');
		
		shadersVariables.isMonkey = gl.getUniformLocation(programs.monkey, 'isMonkey');
		
		shadersVariables.s1start = gl.getUniformLocation(programs.monkey, 's1start');
		shadersVariables.s1end = gl.getUniformLocation(programs.monkey, 's1end');
		shadersVariables.s1t = gl.getUniformLocation(programs.monkey, 's1t');
		
		shadersVariables.s2start = gl.getUniformLocation(programs.monkey, 's2start');
		shadersVariables.s2end = gl.getUniformLocation(programs.monkey, 's2end');
		shadersVariables.s2t = gl.getUniformLocation(programs.monkey, 's2t');
		
		shadersVariables.sinAmplitude = gl.getUniformLocation(programs.monkey, 'sinAmplitude');
		shadersVariables.sinFrequency = gl.getUniformLocation(programs.monkey, 'sinFrequency');
		
		shadersVariables.sphereTransStart = gl.getUniformLocation(programs.monkey, 'sphereTransStart');
		shadersVariables.sphereTransEnd = gl.getUniformLocation(programs.monkey, 'sphereTransEnd');
		
		shadersVariables.doPickingRender = gl.getUniformLocation(programs.monkey, 'doPickingRender');
		shadersVariables.pickingColor = gl.getUniformLocation(programs.monkey, 'pickingColor');
		
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		gl.enableVertexAttribArray(shadersVariables.vColor);
	};
	
	/**
	 * Initializes buffers for color per vertex data
	 */
	var initColorBuffer = function() {
		// monkey colors
		buffers.monkeyColorBuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.monkeyColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(monkeyColors), gl.STATIC_DRAW);
		
		buffers.monkeyColorBuffer.itemSize = 4;
		buffers.monkeyColorBuffer.numItems = monkeyObj.meshData.vertexIndices.length;
		
		
		// sphere colors
		buffers.sphereColorBuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereColors), gl.STATIC_DRAW);
		
		buffers.sphereColorBuffer.itemSize = 4;
		buffers.sphereColorBuffer.numItems = sphereObj.meshData.vertexIndices.length;
	};
	
	
	/**
	 * Push view matrices to shaders and start render loop
	 */
	var startWebGL = function() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(programs.monkey);
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		gl.uniformMatrix4fv(shadersVariables.viewMatrix, false, viewMatrix);
		gl.uniform1i(shadersVariables.doPickingRender, 0);
		
		window[WebGLHelper.requestAnimationFrame](render);
	};
	
	/**
	 * Executes one render cycle by drawing and then animating
	 * 
	 * @param	{number}	timestampNow	High resolution timestamp
	 */
	var render = function(timestampNow) {
		if (picking.doPicking) {
			pickingRender(timestampNow);
		}
		
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
	 * Does a picking render by setting the correct shader state, drawing and
	 * then finding the picked object by color.
	 * 
	 * @param	{number}	timestampNow	High resolution timestamp
	 */
	var pickingRender = function(timestampNow) {
		picking.doPicking = false;
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, picking.framebuffer);
		gl.uniform1i(shadersVariables.doPickingRender, 1);
		
		draw();
		
		try {
			gl.readPixels(0, 0, $canvas.get(0).width, $canvas.get(0).height, gl.RGBA, gl.UNSIGNED_BYTE, picking.capturedColorMap);
			var color = getColorMapColor(mouseState.currentPosition.x, mouseState.currentPosition.y);
			var index = buildAddressFromColor(color);
			
			if (!!picking.list[index] && $.isFunction(picking.list[index].onpick)) {
				picking.list[index].onpick.apply(picking.list[index], null);
			}
		}
		catch (e) {
			console.error(e);
		}
		finally {
			gl.uniform1i(shadersVariables.doPickingRender, 0);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	};
	
	/**
	 * Executes one draw cycle by pushing needed data and drawing the objects.
	 */
	var draw = function() {
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		
		// draw monkey
		// gl.useProgram(programs.monkey);
		gl.uniform1i(shadersVariables.isMonkey, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.monkeyColorBuffer);
		gl.vertexAttribPointer(shadersVariables.vColor, buffers.monkeyColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monkeyObj.buffers.vertexIndicesBuffer);
		
		
		gl.uniform3fv(shadersVariables.s1start, spheres[1].transStart);
		gl.uniform3fv(shadersVariables.s1end, spheres[1].endTrans);
		gl.uniform1f(shadersVariables.s1t, spheres[1].t);
		gl.uniform3fv(shadersVariables.s2start, spheres[2].transStart);
		gl.uniform3fv(shadersVariables.s2end, spheres[2].endTrans);
		gl.uniform1f(shadersVariables.s2t, spheres[2].t);
		gl.uniform1f(shadersVariables.t, monkeys[1].t);
		gl.uniform1f(shadersVariables.sinAmplitude, monkeys[1].amp);
		gl.uniform1f(shadersVariables.sinFrequency, monkeys[1].freq);
		gl.uniform3fv(shadersVariables.rotation, monkeys[1].rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0 / 3.0);
		gl.uniform3iv(shadersVariables.pickingColor, monkeys[1].pickingColor);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		
		gl.uniform3fv(shadersVariables.s1start, spheres[3].transStart);
		gl.uniform3fv(shadersVariables.s1end, spheres[3].endTrans);
		gl.uniform1f(shadersVariables.s1t, spheres[3].t);
		gl.uniform3fv(shadersVariables.s2start, spheres[4].transStart);
		gl.uniform3fv(shadersVariables.s2end, spheres[4].endTrans);
		gl.uniform1f(shadersVariables.s2t, spheres[4].t);
		gl.uniform1f(shadersVariables.t, monkeys[2].t);
		gl.uniform1f(shadersVariables.sinAmplitude, monkeys[2].amp);
		gl.uniform1f(shadersVariables.sinFrequency, monkeys[2].freq);
		gl.uniform3fv(shadersVariables.rotation, monkeys[2].rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0 / 3.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0);
		gl.uniform3iv(shadersVariables.pickingColor, monkeys[2].pickingColor);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		
		// draw spheres
		// gl.useProgram(programs.sphere);
		gl.uniform1i(shadersVariables.isMonkey, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereColorBuffer);
		gl.vertexAttribPointer(shadersVariables.vColor, buffers.sphereColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, sphereObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereObj.buffers.vertexIndicesBuffer);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[1].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[1].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[1].t);
		gl.uniform3fv(shadersVariables.rotation, spheres[1].rotation);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[1].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[2].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[2].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[2].t);
		gl.uniform3fv(shadersVariables.rotation, spheres[2].rotation);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[2].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[3].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[3].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[3].t);
		gl.uniform3fv(shadersVariables.rotation, spheres[3].rotation);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[3].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[4].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[4].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[4].t);
		gl.uniform3fv(shadersVariables.rotation, spheres[4].rotation);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[4].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
	};
	
	/**
	 * Animate all animating objects
	 * 
	 * @param	{number}	timestampNow	High resolution timestamp
	 * @param	{number}	deltaTime	High resolution timestamp delta between now and last animation cycle
	 */
	var animate = function(timestampNow, deltaTime) {
		monkeys[1].t += monkeys[1].direction * monkeys[1].transSpeedFac;
		
		if (monkeys[1].t > 1000) {
			monkeys[1].t = 1000;
			monkeys[1].direction *= -1;
			
			if (enableSound) {
				monkeys[1].bounceSound.play();
			}
		}
		else if (monkeys[1].t < 0) {
			monkeys[1].t = 0;
			monkeys[1].direction *= -1;
			
			if (enableSound) {
				monkeys[1].bounceSound.play();
			}
		}
		
		monkeys[2].t += monkeys[2].direction * monkeys[2].transSpeedFac;
		
		if (monkeys[2].t > 1000) {
			monkeys[2].t = 1000;
			monkeys[2].direction *= -1;
			
			if (enableSound) {
				monkeys[2].bounceSound.play();
			}
		}
		else if (monkeys[2].t < 0) {
			monkeys[2].t = 0;
			monkeys[2].direction *= -1;
			
			if (enableSound) {
				monkeys[2].bounceSound.play();
			}
		}
		
		var fract = deltaTime / 5000.0;
		var angle = 360 * fract;
		
		monkeys[1].rotation[1] = (monkeys[1].rotation[1] + (angle * monkeys[1].rotSpeedFac)) % 360;
		monkeys[2].rotation[1] = (monkeys[2].rotation[1] + (angle * monkeys[2].rotSpeedFac)) % 360;
		
		fract = deltaTime / 3000.0;
		angle = 360 * fract;
		spheres[1].rotation[1] = (spheres[1].rotation[1] + angle) % 360;
		spheres[2].rotation[1] = (spheres[2].rotation[1] + angle) % 360;
		spheres[3].rotation[1] = (spheres[3].rotation[1] + angle) % 360;
		spheres[4].rotation[1] = (spheres[4].rotation[1] + angle) % 360;
	};
	
	
	/**
	 * Generates a RGB color array from a given mouse position and caputes picking color map.
	 * Origin of mouse position is the lower left due to WebGL texture coordinates.
	 * This function converts the y value from upper-left origin to lower-left origin.
	 * 
	 * @param	{number}	x	Horizontal mouse position
	 * @param	{number}	y	Vertical mouse position
	 * @returns	{number[]}		RGB array of given mouse position on color map
	 */
	var getColorMapColor = function(x, y) {
		if ((x < 0) || (y < 0) || (x > $canvas.get(0).width) || (y > $canvas.get(0).height)) {
			throw new Error('Invalid color map location.');
		}
		
		if (!picking.capturedColorMap) {
			throw new Error('No color map rendered.');
		}
		
		var startAddress = ($canvas.get(0).height - y - 1) * $canvas.get(0).width * 4 + x * 4;
		
		return [picking.capturedColorMap[startAddress], picking.capturedColorMap[startAddress + 1], picking.capturedColorMap[startAddress + 2]];
	};
	
	/**
	 * Takes a RGB color array and generates a unique number for this color
	 * 
	 * @param	{number[]}	color	RGB color array
	 * @returns	{number}		Unique color ID for this color
	 */
	var buildAddressFromColor = function(color) {
		return color[0] * 65536 + color[1] * 256 + color[2];
	};
	
	/**
	 * onpick listener for sphere starting dragging on this sphere if there
	 * is no other dragged sphere.
	 */
	var sphereStartDrag = function() {
		if (!mouseState.dragging.element) {
			mouseState.dragging.element = this;
			mouseState.dragging.active = true;
		}
	};
	
	/**
	 * onpick listener for monkeys. Changes speed on pick.
	 * If it's a normal pick, speed is increased.
	 * If the alt key was pressed additionally, speed is decreased.
	 */
	var monkeyPick = function() {
		if (mouseState.altKey) {
			this.transSpeedFac -= 1;
			
			if (this.transSpeedFac <= 0.1) {
				this.transSpeedFac = 0;
			}
		}
		else {
			this.transSpeedFac += 1;
			
			if (this.transSpeedFac >= 9.9) {
				this.transSpeedFac = 10;
			}
		}
	};
	
	
	/**
	 * Returns sphere position in clip coordinates
	 * 
	 * @param	{Object}	sphere		Sphere object
	 * @returns	{vec3}				Position of sphere in clip coordinates
	 */
	var getSpherePosition = function(sphere) {
		var spherePos = vec3.lerp(vec3.create(), sphere.transStart, sphere.endTrans, sphere.t / 1000.0);
		
		return vec3.transformMat4(spherePos, spherePos, finalViewMatrix);
	};
	
	
	return {
		init:	init,
		getFps:	function() {
			return fps;
		},
		getSpheres:	function() {
			return spheres;
		},
		getSpherePosition:	getSpherePosition
	};
})();

$(document).ready(function() {
	Assignment1.init($('#gl-canvas'));
});
