attribute vec4 vPosition;
uniform mat4 projectionMatrix;
uniform mat4 rotationMatrix;
uniform mat4 translationMatrix;

void main() {
	gl_Position = projectionMatrix * translationMatrix * rotationMatrix * vPosition;
}
