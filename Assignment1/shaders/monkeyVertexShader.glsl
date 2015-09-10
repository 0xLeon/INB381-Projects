attribute vec4 vPosition;
attribute vec4 vColor;
uniform mat4 projectionMatrix;

uniform vec3 rotation;
uniform float t;

uniform float gFactor;
uniform float bFactor;

uniform int isMonkey;
uniform vec3 s1start;
uniform vec3 s1end;
uniform float s1t;
uniform vec3 s2start;
uniform vec3 s2end;
uniform float s2t;

uniform vec3 sphereTransStart;
uniform vec3 sphereTransEnd;

varying vec4 fColor;

void main() {
	if (1 == isMonkey) {
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
		
		float s1tFrac = s1t / 1000.0;
		vec3 s1Pos = ((1.0 - s1tFrac) * s1start) + (s1tFrac * s1end);
		
		float s2tFrac = s2t / 1000.0;
		vec3 s2Pos = ((1.0 - s2tFrac) * s2start) + (s2tFrac * s2end);
		
		float tFrac = t / 1000.0;
		vec3 translation = ((1.0 - tFrac) * s1Pos) + (tFrac * s2Pos);
		
		mat4 transMat = mat4(
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			translation, 1.0
		);
		
		gl_Position = projectionMatrix * (transMat * ((rz * ry * rx) * vPosition));
		
		fColor = vec4(vColor.x, gFactor * tFrac, bFactor * tFrac, vColor.w);
	}
	else {
		float tFrac = t / 1000.0;
		vec3 translation = ((1.0 - tFrac) * sphereTransStart) + (tFrac * sphereTransEnd);
		
		mat4 transMat = mat4(
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			translation, 1.0
		);
		
		gl_Position = projectionMatrix * (transMat * vPosition);
		
		fColor = vColor;
	}
}
