var Assignment1 = (function() {
	var canvas = null;
	var gl = null;
	var monkeyObj = null;
	var vertShader = null;
	var fragShader = null;
	var program = null;
	var colors = [];
	var projectionMatrix = mat4.create();
	
	var obj1 = {
		direction:	-1,
		startPos:	vec3.fromValues(-4, -2, 0),
		endTrans:	vec3.fromValues(4, -2, 0),
		rotation:	vec3.fromValues(0, 0, 0),
		t:		0
	};
	
	var obj2 = {
		direction:	1,
		startPos:	vec3.fromValues(4, 2, 0),
		endTrans:	vec3.fromValues(-4, 2, 0),
		rotation:	vec3.fromValues(0, 0, 0),
		t:		500
	};
	
	var shadersVariables = {
		vPosition:		null,
		vColor:			null,
		projectionMatrix:	null,
		rotation:		null,
		startPos:		null,
		trans:			null,
		t:			null,
		gFactor:		null,
		bFactor:		null
	};
	
	var buffers = {
		colorBuffer:		null
	};
	
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
			mat4.perspective(projectionMatrix, Math.PI / 4, canvas.get(0).width / canvas.get(0).height, 1, 100000);
			mat4.translate(projectionMatrix, projectionMatrix, vec3.fromValues(0, 0, -8));
			
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
	
	var initWebGLContext = function() {
		gl.viewport(0, 0, canvas.get(0).width, canvas.get(0).height);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	var loadMeshData = function() {
		monkeyObj = new WebGLGraphicsObject(gl, ObjectLoader.loadObjDataFromHttp('./obj/Monkey.obj'));
	};
	
	var makeColorData = function() {
		var numvert = monkeyObj.meshData.vertexIndices.length * 3;
		var randRed = 0;
		
		for (var i = 0; i < numvert; i += 3) {
			randRed = .5 + (Math.random() * .5);
			
			Array.prototype.push.apply(colors, [randRed, 0., 0., 1.0]);
			Array.prototype.push.apply(colors, [randRed, 0., 0., 1.0]);
			Array.prototype.push.apply(colors, [randRed, 0., 0., 1.0]);
		}
	};
	
	var loadShaders = function() {
		vertShader = ShaderLoader.loadShaderFromHttp(gl, './shaders/vertexShader.glsl', gl.VERTEX_SHADER);
		fragShader = ShaderLoader.loadShaderFromHttp(gl, './shaders/fragmentShader.glsl', gl.FRAGMENT_SHADER);
	};
	
	var linkProgram = function() {
		program = ShaderLoader.linkProgram(gl, vertShader, fragShader);
		
		gl.useProgram(program);
	};
	
	var locateShadersVariables = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		shadersVariables.vColor = gl.getAttribLocation(program, 'vColor');
		shadersVariables.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
		
		shadersVariables.rotation = gl.getUniformLocation(program, 'rotation');
		shadersVariables.startPos = gl.getUniformLocation(program, 'startPos');
		shadersVariables.trans = gl.getUniformLocation(program, 'trans');
		shadersVariables.t = gl.getUniformLocation(program, 't');
		
		shadersVariables.gFactor = gl.getUniformLocation(program, 'gFactor');
		shadersVariables.bFactor = gl.getUniformLocation(program, 'bFactor');
		
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		gl.enableVertexAttribArray(shadersVariables.vColor);
	};
	
	var initMeshBuffer = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
	};
	
	var initColorBuffer = function() {
		buffers.colorBuffer = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		
		buffers.colorBuffer.itemSize = 4;
		buffers.colorBuffer.numItems = monkeyObj.meshData.vertexIndices.length;
		
		gl.vertexAttribPointer(shadersVariables.vColor, buffers.colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	};
	
	var startWebGL = function() {
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		
		window[WebGLHelper.requestAnimationFrame](function () {
			render();
		});
	};
	
	var currentTime = Date.now();
	var render = function() {
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		
		// draw
		gl.uniform3fv(shadersVariables.startPos, obj1.startPos);
		gl.uniform3fv(shadersVariables.trans, obj1.endTrans);
		gl.uniform1f(shadersVariables.t, obj1.t);
		gl.uniform3fv(shadersVariables.rotation, obj1.rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0 / 3.0);
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monkeyObj.buffers.vertexIndicesBuffer);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		gl.uniform3fv(shadersVariables.startPos, obj2.startPos);
		gl.uniform3fv(shadersVariables.trans, obj2.endTrans);
		gl.uniform1f(shadersVariables.t, obj2.t);
		gl.uniform3fv(shadersVariables.rotation, obj2.rotation);
		gl.uniform1f(shadersVariables.gFactor, 1.0 / 3.0);
		gl.uniform1f(shadersVariables.bFactor, 1.0);
		gl.bindBuffer(gl.ARRAY_BUFFER, monkeyObj.buffers.verticesBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monkeyObj.buffers.vertexIndicesBuffer);
		gl.drawElements(gl.TRIANGLES, monkeyObj.meshData.vertexIndices.length * 3, gl.UNSIGNED_SHORT, 0);
		
		// animate
		obj1.t += obj1.direction * 2;
		
		if (obj1.t > 1000) {
			obj1.t = 1000;
			obj1.direction *= -1;
		}
		else if (obj1.t < 0) {
			obj1.t = 0;
			obj1.direction *= -1;
		}
		
		obj2.t += obj2.direction * 3;
		
		if (obj2.t > 1000) {
			obj2.t = 1000;
			obj2.direction *= -1;
		}
		else if (obj2.t < 0) {
			obj2.t = 0;
			obj2.direction *= -1;
		}
		
		var now = Date.now();
		var deltat = now - currentTime;
		currentTime = now;
		var fract = deltat / 5000;
		var angle = 360 * fract;
		
		obj1.rotation[1] = (obj1.rotation[1] + angle) % 360;
		obj2.rotation[1] = (obj2.rotation[1] + angle) % 360;
		
		// schedule next render
		window[WebGLHelper.requestAnimationFrame](function () {
			render();
		});
	};
	
	return {
		init:	init
	};
})();

$(document).ready(function() {
	Assignment1.init($('#gl-canvas'));
});
