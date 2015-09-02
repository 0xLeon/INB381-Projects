var Assignment1 = (function() {
	var canvas = null;
	var gl = null;
	var meshData = null;
	var projectionMatrix = mat4.create();
	var rotationAxis = vec3.fromValues(0, 1, 0);
	var rotationMatrix = mat4.create();
	var translationMatrix = mat4.create();
	var startPoint = vec3.fromValues(-2, 0, 0);
	var endFromStartPoint = vec3.fromValues(2, 0, 0);
	var endPoint = vec3.create();
	var vertShader = null;
	var fragShader = null;
	var program = null;
	
	var x_speed = 0.01;
	var x_direction = 1;
	var current_x = 0;
	var y_speed = 0;
	var current_y = 0;
	var y_direction = 1;
	
	var shadersVariables = {
		vPosition:		null,
		projectionMatrix:	null,
		translationMatrix:	null,
		rotationMatrix:		null
	};
	
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
			mat4.perspective(projectionMatrix, Math.PI / 4, canvas.get(0).width / canvas.get(0).height, 1, 100000);
			mat4.translate(projectionMatrix, projectionMatrix, vec3.fromValues(0, 0, -5));
			
			vec3.normalize(rotationAxis, rotationAxis);
			
			vec3.add(endPoint, startPoint, endFromStartPoint);
			
			mat4.identity(translationMatrix);
			mat4.translate(translationMatrix, translationMatrix, startPoint);
			
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
	
	var initWebGLContext = function() {
		gl.viewport(0, 0, canvas.get(0).width, canvas.get(0).height);
		gl.enable(gl.DEPTH_TEST);
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	var loadMeshData = function() {
		meshData = ObjectLoader.loadObjDataFromHttp('./obj/Monkey.obj');
	};
	
	var loadShaders = function() {
		vertShader = ShaderLoader.loadShaderFromHttp(gl, './shaders/vertexShader.glsl', gl.VERTEX_SHADER);
		fragShader = ShaderLoader.loadShaderFromHttp(gl, './shaders/fragmentShader.glsl', gl.FRAGMENT_SHADER);
	};
	
	var linkProgram = function() {
		program = ShaderLoader.linkProgram(gl, vertShader, fragShader);
		
		gl.useProgram(program);
	};
	
	var loadData = function() {
		var bufferID = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData.vertices), gl.STATIC_DRAW);
	};
	
	var bindShaders = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		
		shadersVariables.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		
		shadersVariables.translationMatrix = gl.getUniformLocation(program, 'translationMatrix');
		gl.uniformMatrix4fv(shadersVariables.translationMatrix, false, translationMatrix);
		
		shadersVariables.rotationMatrix = gl.getUniformLocation(program, 'rotationMatrix');
		gl.uniformMatrix4fv(shadersVariables.rotationMatrix, false, rotationMatrix);
	};
	
	var startWebGL = function() {
		/*WebGLHelper.*/requestAnimationFrame(function() {
			render();
		});
	};
	
	var currentTime = Date.now();
	var currentLocation = vec3.create();
	var render = function() {
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.uniformMatrix4fv(shadersVariables.translationMatrix, false, translationMatrix);
		gl.uniformMatrix4fv(shadersVariables.rotationMatrix, false, rotationMatrix);
		gl.drawArrays(gl.LINES	, 0, meshData.vertices.length);
		
		
		/*WebGLHelper.*/requestAnimationFrame(function() {
			// animate
			// TODO: animate translation
			mat4.translate(translationMatrix, translationMatrix, vec3.fromValues(x_direction * x_speed, y_direction * y_speed, 0));
			
			if (((translationMatrix[12] >= endPoint[0]) ) || (translationMatrix[12] <= startPoint[0])) {
				x_direction *= -1;
			}
			
			if ((translationMatrix[13] >= endPoint[1]) || (translationMatrix[13] <= startPoint[1])) {
				y_direction *= -1;
			}
			
			
			var now = Date.now();
			var deltat = now - currentTime;
			currentTime = now;
			var fract = deltat / 5000;
			var angle = Math.PI * 2 * fract;
			mat4.rotate(rotationMatrix, rotationMatrix, angle, rotationAxis);
			
			render();
		})
	};
	
	return {
		init:	init
	};
})();

$(document).ready(function() {
	Assignment1.init($('#gl-canvas'));
});
