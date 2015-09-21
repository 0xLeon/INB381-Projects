var Assignment1 = (function() {
	var canvas = null;
	var gl = null;
	
	var projectionMatrix = mat4.create();
	var viewMatrix = mat4.create();
	
	var monkeyObj = null;
	var monkeyColors = [];
	
	var sphereObj = null;
	var sphereColors = [];
	
	var monkeys = {
		1: {
			direction:	1,
			rotation:	vec3.fromValues(0, 0, 0),
			amp:		0.7,
			freq:		2.0,
			transSpeedFac:	5,
			rotSpeedFac:	1,
			t:		0,
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
			pickingColor:	WebGLHelper.flatteni32([0, 0, 2]),
			onpick:		null
		}
	};
	
	var spheres = {
		1: {
			t:		0,
			transStart:	vec3.fromValues(-4, 2, 0),
			endTrans:	vec3.fromValues(-4, -2, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 3]),
			onpick:		null
		},
		2: {
			t:		0,
			transStart:	vec3.fromValues(4, 2, 0),
			endTrans:	vec3.fromValues(4, -2, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 4]),
			onpick:		null
		},
		3: {
			t:		0,
			transStart:	vec3.fromValues(-4, -2, 0),
			endTrans:	vec3.fromValues(-4, 2, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 5]),
			onpick:		null
		},
		4: {
			t:		0,
			transStart:	vec3.fromValues(4, -2, 0),
			endTrans:	vec3.fromValues(4, 2, 0),
			pickingColor:	WebGLHelper.flatteni32([0, 0, 6]),
			onpick:		null
		}
	};
	
	var programs = {
		monkey:		null,
		spheres:	null
	};
	
	var shaders = {
		vertex:	{
			monkey:		null,
			spheres:	null
		},
		fragment: {
			standard:	null
		}
	};
	
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
	
	var buffers = {
		monkeyColorBuffer:		null,
		sphereColorBuffer:		null
	};
	
	var picking = {
		capturedColorMap:	null,
		framebuffer:		null,
		list:			{}
	};
	
	var mouseState = {
		doPicking:		false,
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
	
	var lastTime = window.performance.now();
	var elapsedTime = 0;
	
	var $fpsValue = null;
	var framecount = 0;
	var fps = 0;
	
	
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		canvas.on('mousedown', function(event) {
			mouseState.currentPosition.x = event.pageX - $(this).offset().left - (parseInt($(this).css('borderLeftWidth'), 10) || 0) - (parseInt($(this).css('paddingLeft'), 10) || 0);
			mouseState.currentPosition.y = event.pageY - $(this).offset().top - (parseInt($(this).css('borderTopWidth'), 10) || 0) - (parseInt($(this).css('paddingTop'), 10) || 0);
			
			if ((mouseState.currentPosition.x >= 0) && (mouseState.currentPosition.y >= 0) && (mouseState.currentPosition.x < canvas.get(0).width) && (mouseState.currentPosition.y < canvas.get(0).height)) {
				mouseState.doPicking = true;
			}
		});
		canvas.on('mousemove', function(event) {
			// mouseState.currentPosition.x = event.pageX - $(this).offset().left;
			// mouseState.currentPosition.y = event.pageY - $(this).offset().top;
		});
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
			mat4.perspective(projectionMatrix, Math.PI / 4, canvas.get(0).width / canvas.get(0).height, 1, 100000);
			mat4.lookAt(viewMatrix, vec3.fromValues(0, 0, -8), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
			
			initFps();
			initSliders();
			initButtons();
			initMouseState();
			
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
	
	var initFps = function() {
		$fpsValue = $('#fps-value');
		
		window.setInterval(function() {
			$fpsValue.text(Assignment1.getFps());
		}, 1000);
	};
	
	var initSliders = function() {
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
	
	var initWebGLContext = function() {
		gl.viewport(0, 0, canvas.get(0).width, canvas.get(0).height);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	var initPicking = function() {
		picking.capturedColorMap = new Uint8Array(canvas.get(0).width * canvas.get(0).height * 4);
		picking.framebuffer = gl.createFramebuffer();
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, picking.framebuffer);
		
		var rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.get(0).width, canvas.get(0).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
		var renderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.get(0).width, canvas.get(0).height);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
		
		picking.list[buildAddressFromColor(monkeys[1].pickingColor)] = monkeys[1];
		picking.list[buildAddressFromColor(monkeys[2].pickingColor)] = monkeys[2];
		picking.list[buildAddressFromColor(spheres[1].pickingColor)] = spheres[1];
		picking.list[buildAddressFromColor(spheres[2].pickingColor)] = spheres[2];
		picking.list[buildAddressFromColor(spheres[3].pickingColor)] = spheres[3];
		picking.list[buildAddressFromColor(spheres[4].pickingColor)] = spheres[4];
		
		for (var i = 1; i < 3; ++i) {
			monkeys[i].onpick = function() {
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
		}
		
		for (var j = 1; j < 5; ++j) {
			spheres[j].onpick = startSphereDrag;
		}
	};
	
	var loadMeshData = function() {
		monkeyObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Monkey.obj'));
		sphereObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Sphere.obj'));
	};
	
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
	
	var loadShaders = function() {
		shaders.vertex.monkey = ShaderLoader.loadShaderFromHttp(gl, './shaders/monkeyVertexShader.glsl', gl.VERTEX_SHADER);
		shaders.fragment.standard = ShaderLoader.loadShaderFromHttp(gl, './shaders/standardFragmentShader.glsl', gl.FRAGMENT_SHADER);
	};
	
	var linkProgram = function() {
		programs.monkey = ShaderLoader.linkProgram(gl, shaders.vertex.monkey, shaders.fragment.standard);
	};
	
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
	
	var startWebGL = function() {
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(programs.monkey);
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		gl.uniformMatrix4fv(shadersVariables.viewMatrix, false, viewMatrix);
		gl.uniform1i(shadersVariables.doPickingRender, 0);
		
		window[WebGLHelper.requestAnimationFrame](render);
	};
	
	var render = function(timestampNow) {
		if (mouseState.doPicking) {
			mouseState.doPicking = false;
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, picking.framebuffer);
			gl.uniform1i(shadersVariables.doPickingRender, 1);
			
			draw();
			
			try {
				gl.readPixels(0, 0, canvas.get(0).width, canvas.get(0).height, gl.RGBA, gl.UNSIGNED_BYTE, picking.capturedColorMap);
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
		gl.uniform3iv(shadersVariables.pickingColor, spheres[1].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[2].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[2].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[2].t);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[2].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[3].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[3].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[3].t);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[3].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres[4].transStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres[4].endTrans);
		gl.uniform1f(shadersVariables.t, spheres[4].t);
		gl.uniform3iv(shadersVariables.pickingColor, spheres[4].pickingColor);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
	};
	
	var animate = function(timestampNow, deltaTime) {
		monkeys[1].t += monkeys[1].direction * monkeys[1].transSpeedFac;
		
		if (monkeys[1].t > 1000) {
			monkeys[1].t = 1000;
			monkeys[1].direction *= -1;
		}
		else if (monkeys[1].t < 0) {
			monkeys[1].t = 0;
			monkeys[1].direction *= -1;
		}
		
		monkeys[2].t += monkeys[2].direction * monkeys[2].transSpeedFac;
		
		if (monkeys[2].t > 1000) {
			monkeys[2].t = 1000;
			monkeys[2].direction *= -1;
		}
		else if (monkeys[2].t < 0) {
			monkeys[2].t = 0;
			monkeys[2].direction *= -1;
		}
		
		var fract = deltaTime / 5000.0;
		var angle = 360 * fract;
		
		monkeys[1].rotation[1] = (monkeys[1].rotation[1] + (angle * monkeys[1].rotSpeedFac)) % 360;
		monkeys[2].rotation[1] = (monkeys[2].rotation[1] + (angle * monkeys[2].rotSpeedFac)) % 360;
	};
	
	var getColorMapColor = function(x, y) {
		if ((x < 0) || (y < 0) || (x > canvas.get(0).width) || (y > canvas.get(0).height)) {
			throw new Error('Invalid color map location.');
		}
		
		if (!picking.capturedColorMap) {
			throw new Error('No color map rendered.');
		}
		
		var startAddress = (canvas.get(0).height - y - 1) * canvas.get(0).width * 4 + x * 4;
		
		return [picking.capturedColorMap[startAddress], picking.capturedColorMap[startAddress + 1], picking.capturedColorMap[startAddress + 2]];
	};
	
	var buildAddressFromColor = function(color) {
		return color[0] * 65536 + color[1] * 256 + color[2];
	};
	
	var startSphereDrag = function() {
		if (!mouseState.dragging.element) {
			mouseState.dragging.element = this;
		}
	};
	
	var getSpherePosition = function(sphere) {
		var spherePos = vec3.lerp(vec3.create(), sphere.transStart, sphere.endTrans, sphere.t / 1000.0);
		var view = mat4.multiply(mat4.create(), viewMatrix, projectionMatrix);
		
		return vec3.transformMat4(spherePos, spherePos, view);
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
