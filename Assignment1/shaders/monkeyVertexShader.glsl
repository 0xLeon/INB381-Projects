attribute vec3 vPosition;
attribute vec4 vColor;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

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
uniform float sinAmplitude;
uniform float sinFrequency;

uniform vec3 sphereTransStart;
uniform vec3 sphereTransEnd;

uniform int doPickingRender;
uniform ivec3 pickingColor;

varying vec4 fColor;

const float PI = 3.141592653589793238462643383;

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
		
		mat4 scaleMat = mat4(
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			0.0, 0.0, 0.0, 1.0
		);
		
		vec3 s1pos = mix(s1start, s1end, s1t / 1000.0);
		vec3 s2pos = mix(s2start, s2end, s2t / 1000.0);
		
		float tFrac = t / 1000.0;
		vec3 translation = mix(s1pos, s2pos, tFrac);
		
		translation.y += sinAmplitude * sin(sinFrequency * tFrac * 2.0 * PI);
		
		mat4 transMat = mat4(
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			translation, 1.0
		);
		
		if (1 == doPickingRender) {
			fColor = vec4((vec3(pickingColor) / 255.0), 1.0);
			
			scaleMat[0][0] = 2.5;
			scaleMat[1][1] = 2.5;
			scaleMat[2][2] = 2.5;
		}
		else {
			fColor = vec4(vColor.x, gFactor * tFrac, bFactor * tFrac, vColor.w);
		}
		
		gl_Position = projectionMatrix * (viewMatrix * (transMat * ((rz * ry * rx) * (scaleMat * vec4(vPosition, 1.0)))));
	}
	else {
		float tFrac = t / 1000.0;
		vec3 translation = mix(sphereTransStart, sphereTransEnd, tFrac);
		
		mat4 transMat = mat4(
			1.0, 0.0, 0.0, 0.0,
			0.0, 1.0, 0.0, 0.0,
			0.0, 0.0, 1.0, 0.0,
			translation, 1.0
		);
		
		gl_Position = projectionMatrix * (viewMatrix * (transMat * vec4(vPosition, 1.0)));
		
		if (1 == doPickingRender) {
			fColor = vec4((vec3(pickingColor) / 255.0), 1.0);
		}
		else {
			fColor = vColor;
		}
	}
}
