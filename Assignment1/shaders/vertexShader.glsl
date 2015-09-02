attribute vec4 vPosition;
attribute vec4 vColor;
uniform mat4 projectionMatrix;
uniform mat4 rotationMatrix;
uniform mat4 translationMatrix;

varying vec4 fColor;

void main() {
	gl_Position = projectionMatrix * translationMatrix * rotationMatrix * vPosition;
	fColor = vColor;
}
