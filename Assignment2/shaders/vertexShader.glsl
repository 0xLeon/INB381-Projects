uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

uniform int mode;

void main() {
	if (0 == mode) {
		renderBird();
	}
	else if (1 == mode) {
		renderFloor();
	}
}

void renderBird() {
	
}

void renderFloor() {
	
}
