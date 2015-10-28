var Bird = (function() {
	var __class = function(caller) {
		this.caller = caller;
		this.gl = caller.getGL();
		this.tree = {};
		
		this.matrixStack = [];
		
		__createNodes.apply(this);
		__initNodes.apply(this);
	};
	
	var __createNode = function(nodeName) {
		this.tree[nodeName] = {
			child:			null,
			sibling:		null,
			
			worldTransform:		mat4.create(),
			
			localTranslation:	vec3.create(),
			localRotation:		vec3.create(),
			
			glObject:		null
		};
	};
	
	var __createNodes = function() {
		__createNode.apply(this, ['root']);
		__createNode.apply(this, ['body']);
		__createNode.apply(this, ['neck']);
		__createNode.apply(this, ['head']);
		__createNode.apply(this, ['leftUpperWing']);
		__createNode.apply(this, ['leftLowerWing']);
		__createNode.apply(this, ['rightUpperWing']);
		__createNode.apply(this, ['rightLowerWing']);
		__createNode.apply(this, ['tail']);
		
		console.log(this.tree.neck);
	};
	
	var __initNodes = function() {
		__initRoot.apply(this);
		__initBody.apply(this);
		__initNeck.apply(this);
		__initHead.apply(this);
		__initLeftUpperWing.apply(this);
		__initLeftLowerWing.apply(this);
		__initRightUpperWing.apply(this);
		__initRightLowerWing.apply(this);
		__initTail.apply(this);
	};
	
	var __initRoot = function() {
		this.tree.root.child = this.tree.body;
		this.tree.root.glObject = null;
	};
	
	var __initBody = function() {
		this.tree.body.child = this.tree.neck;
		this.tree.body.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdBody.obj'));
		
		mat4.scale(this.tree.body.worldTransform, this.tree.body.worldTransform, vec3.fromValues(0.25, 0.25, 0.25));
	};
	
	var __initNeck = function() {
		this.tree.neck.child = this.tree.head;
		this.tree.neck.sibling = this.tree.leftUpperWing;
		this.tree.neck.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdNeck.obj'));
		
		mat4.translate(this.tree.neck.worldTransform, this.tree.neck.worldTransform, vec3.fromValues(0, -5, 5));
		mat4.rotateX(this.tree.neck.worldTransform, this.tree.neck.worldTransform, -60 * Math.PI / 180);
	};
	
	var __initHead = function() {
		this.tree.head.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdHead.obj'));
		
		mat4.translate(this.tree.head.worldTransform, this.tree.head.worldTransform, vec3.fromValues(0, 1.2, 9.7));
		mat4.rotateX(this.tree.head.worldTransform, this.tree.head.worldTransform, Math.PI / 2.75);
	};
	
	var __initLeftUpperWing = function() {
		this.tree.leftUpperWing.child = this.tree.leftLowerWing;
		this.tree.leftUpperWing.sibling = this.tree.rightUpperWing;
		this.tree.leftUpperWing.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdInnerWing.obj'));
		
		mat4.translate(this.tree.leftUpperWing.worldTransform, this.tree.leftUpperWing.worldTransform, vec3.fromValues(0.7, -0.45, 0));
	};
	
	var __initLeftLowerWing = function() {
		this.tree.leftLowerWing.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdOuterWing.obj'));
		
		mat4.translate(this.tree.leftLowerWing.worldTransform, this.tree.leftLowerWing.worldTransform, vec3.fromValues(8, 0.2, 0));
	};
	
	var __initRightUpperWing = function() {
		this.tree.rightUpperWing.child = this.tree.rightLowerWing;
		this.tree.rightUpperWing.sibling = this.tree.tail;
		this.tree.rightUpperWing.glObject = this.tree.leftUpperWing.glObject;
		
		mat4.scale(this.tree.rightUpperWing.worldTransform, this.tree.rightUpperWing.worldTransform, vec3.fromValues(-1, 1, 1));
		mat4.translate(this.tree.rightUpperWing.worldTransform, this.tree.rightUpperWing.worldTransform, vec3.fromValues(0.7, -0.45, 0));
	};
	
	var __initRightLowerWing = function() {
		this.tree.rightLowerWing.glObject = this.tree.leftLowerWing.glObject;
		
		mat4.scale(this.tree.rightLowerWing.worldTransform, this.tree.rightLowerWing.worldTransform, vec3.fromValues(1, -1, 1));
		mat4.translate(this.tree.rightLowerWing.worldTransform, this.tree.rightLowerWing.worldTransform, vec3.fromValues(8, 0.2, 0));
	};
	
	var __initTail = function() {
		this.tree.tail.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdTail.obj'));
		
		mat4.translate(this.tree.tail.worldTransform, this.tree.tail.worldTransform, vec3.fromValues(0, -5, -5));
		mat4.rotateX(this.tree.tail.worldTransform, this.tree.tail.worldTransform, 60 * Math.PI / 180);
	};
	
	var __traverse = function(node) {
		if (null === node) {
			return;
		}
		
		
		var localTransform = mat4.create();
		var localTranslation = mat4.fromTranslation(mat4.create(), node.localTranslation);
		var localRotationX = mat4.fromXRotation(mat4.create(), node.localRotation[0]);
		var localRotationY = mat4.fromYRotation(mat4.create(), node.localRotation[1]);
		var localRotationZ = mat4.fromZRotation(mat4.create(), node.localRotation[2]);
		
		mat4.multiply(localTransform, localRotationX, localTransform);
		mat4.multiply(localTransform, localRotationY, localTransform);
		mat4.multiply(localTransform, localRotationZ, localTransform);
		mat4.multiply(localTransform, localTranslation, localTransform);
		
		this.matrixStack.push(mat4.copy(mat4.create(), this.caller.getModelViewMatrix()));
		
		
		mat4.multiply(localTransform, node.worldTransform, localTransform);
		mat4.multiply(this.caller.getModelViewMatrix(), this.caller.getModelViewMatrix(), localTransform);
		
		__renderNode.call(this, node);
		
		if (null !== node.child) {
			__traverse.call(this, node.child)
		}
		
		mat4.copy(this.caller.getModelViewMatrix(), this.matrixStack.pop());
		
		if (null !== node.sibling) {
			__traverse.call(this, node.sibling);
		}
	};
	
	var __renderNode = function(node) {
		if (null === node.glObject) {
			return;
		}
		
		this.gl.uniformMatrix4fv(this.caller.getShaderVariable('viewMatrix'), false, this.caller.getModelViewMatrix());
		this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, node.glObject.buffers.normalsBuffer);
		this.gl.vertexAttribPointer(this.caller.getShaderVariable('vNormal'), 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, node.glObject.buffers.verticesBuffer);
		this.gl.vertexAttribPointer(this.caller.getShaderVariable('vPosition'), 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		this.gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, node.glObject.buffers.vertexIndicesBuffer);
		this.gl.drawElements(WebGLRenderingContext.TRIANGLES, node.glObject.meshData.vertexIndices.length * 3, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	};
	
	var render = function() {
		this.gl.uniform1i(this.caller.getShaderVariable('mode'), 0);
		__traverse.call(this, this.tree.root);
	};
	
	var getTree = function() {
		return this.tree;
	};
	
	__class.prototype.constructor = __class;
	__class.prototype.render = render;
	__class.prototype.getTree = getTree;
	
	return __class;
})();
