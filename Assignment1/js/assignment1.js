var Assignment1 = (function() {
	var canvas = null;
	var gl = null;
	
	var monkeyObj = null;
	var monkeyColors = [];
	
	var sphereObj = null;
	var sphereColors = [];
	
	var projectionMatrix = mat4.create();
	
	var shaders = {
		vertex:	{
			monkey:		null,
			spheres:	null
		},
		fragment: {
			standard:	null
		}
	};
	
	var programs = {
		monkey:		null,
		spheres:	null
	};
	
	var monkey1 = {
		direction:	1,
		rotation:	vec3.fromValues(0, 0, 0),
		transSpeedFac:	10,
		rotSpeedFac:	1,
		t:		0
	};
	
	var monkey2 = {
		direction:	-1,
		rotation:	vec3.fromValues(0, 0, 0),
		transSpeedFac:	2,
		rotSpeedFac:	2,
		t:		500
	};
	
	var monkey = {
		'1':	monkey1,
		'2':	monkey2
	};
	
	var shadersVariables = {
		vPosition:		null,
		vColor:			null,
		projectionMatrix:	null,
		rotation:		null,
		t:			null,
		gFactor:		null,
		bFactor:		null,
		calcColor:		null,
		
		s1start:		null,
		s1end:			null,
		s1t:			null,
		
		s2start:		null,
		s2end:			null,
		s2t:			null,
		
		sphereTransStart:	null,
		sphereTransEnd:		null
	};
	
	var buffers = {
		monkeyColorBuffer:		null,
		sphereColorBuffer:		null
	};
	
	var spheres = {
		'1': {
			t:		0,
			sphereTransStart:	vec3.fromValues(-4, 2, 0),
			endTrans:	vec3.fromValues(-4, -2, 0)
		},
		'2': {
			t:		0,
			sphereTransStart:	vec3.fromValues(4, 2, 0),
			endTrans:	vec3.fromValues(4, -2, 0)
		},
		'3': {
			t:		0,
			sphereTransStart:	vec3.fromValues(-4, -2, 0),
			endTrans:	vec3.fromValues(-4, 2, 0)
		},
		'4': {
			t:		0,
			sphereTransStart:	vec3.fromValues(4, -2, 0),
			endTrans:	vec3.fromValues(4, 2, 0)
		}
	};
	
	var sliderValues = {};
	var sphereChanged = {
		'1': $.Callbacks(),
		'2': $.Callbacks(),
		'3': $.Callbacks(),
		'4': $.Callbacks()
	};
	
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
			mat4.perspective(projectionMatrix, Math.PI / 4, canvas.get(0).width / canvas.get(0).height, 1, 100000);
			mat4.translate(projectionMatrix, projectionMatrix, vec3.fromValues(0, 0, -8));
			
			initSliders();
			initButtons();
			
			initWebGLContext();
			loadMeshData();
			makeColorData();
			loadShaders();
			linkProgram();
			locateShadersVariables();
			initColorBuffer();
			initMeshBuffer();
			startWebGL();
		}
		catch (e) {
			window.alert(e.message);
			console.error(e);
		}
	};
	
	var initSliders = function() {
		for (var i = 1; i < 5; ++i) {
			var slider = $('#sphere' + i.toString(10) + '-pos');
			var sliderVal = $('#sphere' + i.toString(10) + '-pos-val');
			
			sliderVal.text(slider.get(0).value);
			sliderValues[i.toString(10)] = parseInt(slider.get(0).value, 10);
			
			slider.data('index', i);
			slider.on('input', function() {
				var value = parseInt($(this).get(0).value, 10);
				
				$('#sphere' + $(this).data('index').toString() + '-pos-val').text(parseInt(value / 10, 10));
				sliderValues[$(this).data('index').toString()] = value
				
				spheres[$(this).data('index').toString()].t = value;
				sphereChanged[$(this).data('index').toString()].fire(value);
			});
		}
	};
	
	var initButtons = function() {
		for (var i = 1; i < 3; ++i) {
			var buttonUp = $('#monkey' + i.toString(10) + '-up');
			var buttonDown = $('#monkey' + i.toString(10) + '-down');
			
			buttonUp.data('index', i);
			buttonDown.data('index', i);
		}
	};
	
	var initWebGLContext = function() {
		gl.viewport(0, 0, canvas.get(0).width, canvas.get(0).height);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
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
			randGrey = Math.floor(Math.random() * (256)) / 255.0;
			
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
		
		shadersVariables.sphereTransStart = gl.getUniformLocation(programs.monkey, 'sphereTransStart');
		shadersVariables.sphereTransEnd = gl.getUniformLocation(programs.monkey, 'sphereTransEnd');
		
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		gl.enableVertexAttribArray(shadersVariables.vColor);
	};
	
	var initMeshBuffer = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
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
		gl.useProgram(programs.monkey);
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		
		window[WebGLHelper.requestAnimationFrame](function () {
			render();
		});
	};
	
	var currentTime = Date.now();
	var render = function() {
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		
		// draw monkey
		// gl.useProgram(programs.monkey);
		gl.uniform1i(shadersVariables.isMonkey, 1);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.monkeyColorBuffer);
		gl.vertexAttribPointer(shadersVariables.vColor, buffers.monkeyColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monkeyObj.buffers.vertexIndicesBuffer);
		
		
		gl.uniform3fv(shadersVariables.s1start, spheres['1'].sphereTransStart);
		gl.uniform3fv(shadersVariables.s1end, spheres['1'].endTrans);
		gl.uniform1f(shadersVariables.s1t, spheres['1'].t);
		gl.uniform3fv(shadersVariables.s2start, spheres['2'].sphereTransStart);
		gl.uniform3fv(shadersVariables.s2end, spheres['2'].endTrans);
		gl.uniform1f(shadersVariables.s2t, spheres['2'].t);
		gl.uniform1f(shadersVariables.t, monkey1.t);
		gl.uniform3fv(shadersVariables.rotation, monkey1.rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0 / 3.0);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		
		gl.uniform3fv(shadersVariables.s1start, spheres['3'].sphereTransStart);
		gl.uniform3fv(shadersVariables.s1end, spheres['3'].endTrans);
		gl.uniform1f(shadersVariables.s1t, spheres['3'].t);
		gl.uniform3fv(shadersVariables.s2start, spheres['4'].sphereTransStart);
		gl.uniform3fv(shadersVariables.s2end, spheres['4'].endTrans);
		gl.uniform1f(shadersVariables.s2t, spheres['4'].t);
		gl.uniform1f(shadersVariables.t, monkey2.t);
		gl.uniform3fv(shadersVariables.rotation, monkey2.rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0 / 3.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		
		// draw spheres
		// gl.useProgram(programs.sphere);
		gl.uniform1i(shadersVariables.isMonkey, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.sphereColorBuffer);
		gl.vertexAttribPointer(shadersVariables.vColor, buffers.sphereColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, sphereObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereObj.buffers.vertexIndicesBuffer);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres['1'].sphereTransStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres['1'].endTrans);
		gl.uniform1f(shadersVariables.t, spheres['1'].t);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres['2'].sphereTransStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres['2'].endTrans);
		gl.uniform1f(shadersVariables.t, spheres['2'].t);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres['3'].sphereTransStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres['3'].endTrans);
		gl.uniform1f(shadersVariables.t, spheres['3'].t);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.sphereTransStart, spheres['4'].sphereTransStart);
		gl.uniform3fv(shadersVariables.sphereTransEnd, spheres['4'].endTrans);
		gl.uniform1f(shadersVariables.t, spheres['4'].t);
		gl.drawElements(gl.TRIANGLES, sphereObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		animate();
		
		// schedule next render
		window[WebGLHelper.requestAnimationFrame](function () {
			render();
		});
	};
	
	var animate = function() {
		monkey1.t += monkey1.direction * monkey1.transSpeedFac;
		
		if (monkey1.t > 1000) {
			monkey1.t = 1000;
			monkey1.direction *= -1;
		}
		else if (monkey1.t < 0) {
			monkey1.t = 0;
			monkey1.direction *= -1;
		}
		
		monkey2.t += monkey2.direction * monkey2.transSpeedFac;
		
		if (monkey2.t > 1000) {
			monkey2.t = 1000;
			monkey2.direction *= -1;
		}
		else if (monkey2.t < 0) {
			monkey2.t = 0;
			monkey2.direction *= -1;
		}
		
		var now = Date.now();
		var deltat = now - currentTime;
		currentTime = now;
		var fract = deltat / 5000;
		var angle = 360 * fract;
		
		monkey1.rotation[1] = (monkey1.rotation[1] + (angle * monkey1.rotSpeedFac)) % 360;
		monkey2.rotation[1] = (monkey2.rotation[1] + (angle * monkey2.rotSpeedFac)) % 360;
	};
	
	return {
		init:	init
	};
})();

$(document).ready(function() {
	Assignment1.init($('#gl-canvas'));
});
