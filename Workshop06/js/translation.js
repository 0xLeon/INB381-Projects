/**
 * Created by mvandeberg on 25/08/15.
 */
function main() {
	// Get A WebGL context
	gl = WebGLUtils.setupWebGL(canvas, {});
	if (!gl) {
		alert("WebGL isn't available");
	}
	
	// setup GLSL program
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
	// look up where the vertex data needs to go.
	var positionLocation = gl.getAttribLocation(program, "a_position");
	
	// lookup uniforms
	var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
	var colorLocation = gl.getUniformLocation(program, "u_color");
	
	// set the resolution
	gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
	
	// Create a buffer.
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	
	// Set a random color.
	gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
	
	var translation = [0, 0];
	var width = 100;
	var height = 100;
	
	drawScene();
	
	// Setup a ui.
	$("#x").gmanSlider({slide: updatePosition(0), max: canvas.width});
	$("#y").gmanSlider({slide: updatePosition(1), max: canvas.height});
	
	function updatePosition(index) {
		return (function(event, ui) {
			translation[index] = ui.value;
			
			drawScene();
		});
	}
	
	// Draw a the scene.
	function drawScene() {
		// Clear the canvas.
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		// Setup a rectangle
		setRectangle(gl, translation[0], translation[1], width, height);
		
		// Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
	var x1 = x;
	var x2 = x + width;
	var y1 = y;
	var y2 = y + height;
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([
			x1, y1,
			x2, y1,
			x1, y2,
			x1, y2,
			x2, y1,
			x2, y2
		]),
		gl.STATIC_DRAW
	);
}
