var Assignment1 = (function() {
	var canvas = null;
	var gl = null;
	var meshData = null;
	var vertShader = null;
	var fragShader = null;
	var program = null;
	var colors = [];
	var projectionMatrix = mat4.create();
	var rotationAxis = vec3.fromValues(0, 1, 0);
	var rotationMatrix = mat4.create();
	
	var ob1_translationMatrix = mat4.create();
	var ob1_startPoint = vec3.fromValues(-2, 1, 0);
	var ob1_endFromStartPoint = vec3.fromValues(2, 0, 0);
	var ob1_endPoint = vec3.create();
	var ob1_x_speed = 0.01;
	var ob1_x_direction = 1;
	var ob1_current_x = 0;
	var ob1_y_speed = 0;
	var ob1_current_y = 0;
	var ob1_y_direction = 1;
	
	var ob2_translationMatrix = mat4.create();
	var ob2_startPoint = vec3.fromValues(-2, -1, 0);
	var ob2_endFromStartPoint = vec3.fromValues(2, 0, 0);
	var ob2_endPoint = vec3.create();
	var ob2_x_speed = 0.02;
	var ob2_x_direction = 1;
	var ob2_current_x = 0;
	var ob2_y_speed = 0;
	var ob2_current_y = 0;
	var ob2_y_direction = 1;
	
	var shadersVariables = {
		vPosition:		null,
		vColor:			null,
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
			
			vec3.add(ob1_endPoint, ob1_startPoint, ob1_endFromStartPoint);
			vec3.add(ob2_endPoint, ob2_startPoint, ob2_endFromStartPoint);
			
			mat4.identity(ob1_translationMatrix);
			mat4.translate(ob1_translationMatrix, ob1_translationMatrix, ob1_startPoint);
			
			mat4.identity(ob2_translationMatrix);
			mat4.translate(ob2_translationMatrix, ob2_translationMatrix, ob2_startPoint);
			
			initWebGLContext();
			loadMeshData();
			// makeColorData();
			loadShaders();
			linkProgram();
			// loadColor();
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
	
	var makeColorData = function() {
		var numvert = meshData.vertices.length / 3;
		for(var i=0;i<numvert;i++) {
			colors.push(0.0);
			//colors.push(0.5+(Math.random()*.5));
			colors.push(1.0);
			colors.push(1.0);
			colors.push(1.0);
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
	
	var loadData = function() {
		var bufferID = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData.vertices), gl.STATIC_DRAW);
	};
	
	var loadColor = function() {
		var cBuffer = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
		gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
	}
	
	var bindShaders = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		gl.vertexAttribPointer(shadersVariables.vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shadersVariables.vPosition);
		
		shadersVariables.projectionMatrix = gl.getUniformLocation(program, 'projectionMatrix');
		gl.uniformMatrix4fv(shadersVariables.projectionMatrix, false, projectionMatrix);
		
		shadersVariables.translationMatrix = gl.getUniformLocation(program, 'translationMatrix');
		gl.uniformMatrix4fv(shadersVariables.translationMatrix, false, ob1_translationMatrix);
		
		shadersVariables.rotationMatrix = gl.getUniformLocation(program, 'rotationMatrix');
		gl.uniformMatrix4fv(shadersVariables.rotationMatrix, false, rotationMatrix);
		
		shadersVariables.vColor = gl.getAttribLocation(program, 'fColor');
		gl.vertexAttribPointer( shadersVariables.vColor, 4, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray(shadersVariables.vColor);
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
		
		gl.uniformMatrix4fv(shadersVariables.translationMatrix, false, ob1_translationMatrix);
		gl.uniformMatrix4fv(shadersVariables.rotationMatrix, false, rotationMatrix);
		gl.drawArrays(gl.TRIANGLES, 0, meshData.vertices.length);
		
		gl.uniformMatrix4fv(shadersVariables.translationMatrix, false, ob2_translationMatrix);
		gl.uniformMatrix4fv(shadersVariables.rotationMatrix, false, rotationMatrix);
		gl.drawArrays(gl.TRIANGLES, 0, meshData.vertices.length);
		
		/*WebGLHelper.*/requestAnimationFrame(function() {
			// animate
			// TODO: animate translation
			mat4.translate(ob1_translationMatrix, ob1_translationMatrix, vec3.fromValues(ob1_x_direction * ob1_x_speed, ob1_y_direction * ob1_y_speed, 0));
			mat4.translate(ob2_translationMatrix, ob2_translationMatrix, vec3.fromValues(ob2_x_direction * ob2_x_speed, ob2_y_direction * ob2_y_speed, 0));
			
			if (((ob1_translationMatrix[12] >= ob1_endPoint[0]) ) || (ob1_translationMatrix[12] <= ob1_startPoint[0])) {
				ob1_x_direction *= -1;
			}
			
			if ((ob1_translationMatrix[13] >= ob1_endPoint[1]) || (ob1_translationMatrix[13] <= ob1_startPoint[1])) {
				ob1_y_direction *= -1;
			}
			
			if (((ob2_translationMatrix[12] >= ob2_endPoint[0]) ) || (ob2_translationMatrix[12] <= ob2_startPoint[0])) {
				ob2_x_direction *= -1;
			}
			
			if ((ob2_translationMatrix[13] >= ob2_endPoint[1]) || (ob2_translationMatrix[13] <= ob2_startPoint[1])) {
				ob2_y_direction *= -1;
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
