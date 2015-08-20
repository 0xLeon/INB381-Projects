var Triangle = (function() {
	var canvas = null;
	var gl = null;
	var meshData = null;
	var vertShader = null;
	var fragShader = null;
	var program = null;
	
	var shadersVariables = {
		vPosition: null
	};
	
	var init = function(_canvas) {
		canvas = $(_canvas);
		
		try {
			gl = WebGLHelper.createContext(canvas, {});
			
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
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
	};
	
	var loadMeshData = function() {
		meshData = [
			vec2(-0.5, -0.5),
			vec2(-0.5, 0.5),
			vec2(0.5, -0.5),
			vec2(0.5, 0.5)
		];
	};
	
	var loadShaders = function() {
		vertShader = ShaderLoader.loadShaderFromHtml(gl, '#vertex-shader', gl.VERTEX_SHADER);
		fragShader = ShaderLoader.loadShaderFromHtml(gl, '#fragment-shader', gl.FRAGMENT_SHADER);
	};
	
	var linkProgram = function() {
		program = ShaderLoader.linkProgram(gl, vertShader, fragShader);
		
		gl.useProgram(program);
	};
	
	var loadData = function() {
		var bufferID = gl.createBuffer();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(meshData), gl.STATIC_DRAW);
	};
	
	var bindShaders = function() {
		shadersVariables.vPosition = gl.getAttribLocation(program, 'vPosition');
		
		gl.vertexAttribPointer(shadersVariables.vPosition, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shadersVariables.vPosition);
	};
	
	var startWebGL = function() {
		render();
	};
	
	var render = function() {
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, meshData.length);
	};
	
	return {
		init: init
	};
})();

$(document).ready(function() {
	Triangle.init($('#gl-canvas'));
});
