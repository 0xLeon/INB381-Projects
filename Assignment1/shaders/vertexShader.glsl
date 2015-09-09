attribute vec4 vPosition;
attribute vec4 vColor;
uniform mat4 projectionMatrix;

uniform vec3 rotation;
uniform vec3 startPos;
uniform vec3 trans;
uniform float t;

uniform float gFactor;
uniform float bFactor;

varying vec4 fColor;

void main() {
	vec3 angles = radians(rotation);
	vec3 c = cos(angles);
	vec3 s = sin(angles);
	
	mat4 rx = mat4(
		1.0, 0.0, 0.0, 0.0,
		0.0, c.x, s.x, 0.0,
		0.0, -s.x, c.x, 0.0,
		0.0, 0.0, 0.0, 1.0
	);
			
	mat4 ry = mat4(
		c.y, 0.0, -s.y, 0.0,
		0.0, 1.0, 0.0, 0.0,
		s.y, 0.0, c.y, 0.0,
		0.0, 0.0, 0.0, 1.0
	);
	
	mat4 rz = mat4(
		c.z, -s.z, 0.0, 0.0,
		s.z, c.z, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0
	);
	
	float tFrac = t / 1000.0;
	vec3 translation = ((1.0 - tFrac) * startPos) + (tFrac * trans);
	
	mat4 transMat = mat4(
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		translation, 1.0
	);
	
	gl_Position = projectionMatrix * (transMat * ((rz * ry * rx) * vPosition));
	
	fColor = vec4(vColor.x, gFactor * tFrac, bFactor * tFrac, vColor.w);
}
