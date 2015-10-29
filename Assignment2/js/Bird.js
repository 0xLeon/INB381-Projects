/**
 * Class representing a paper bird WebGL object
 */
var Bird = (function() {
	/**
	 * Class Constructor
	 * The only parameter is the caller which should provid functions to access
	 * the WebGL context, the shader variables and the current view matrix.
	 * 
	 * @param	{Object}	caller		The calling object
	 */
	var __class = function(caller) {
		this.caller = caller;
		this.gl = caller.getGL();
		this.tree = {};
		
		this.matrixStack = [];
		
		__createNodes.apply(this);
		__initNodes.apply(this);
	};
	
	/**
	 * Creates a basic node object with the given name in the current tree.
	 * This function will overwrite nodes with the same name.
	 * 
	 * @param	{string}	nodeName	The name of node to create
	 * @private
	 */
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
	
	/**
	 * Creates all the necessary basic nodes for the bird object.
	 * 
	 * @private
	 */
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
	};
	
	/**
	 * Initializes all nodes of the bird tree.
	 * 
	 * @private
	 */
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
	
	/**
	 * Initializes the root node, which has no renderable object attached.
	 * 
	 * @private
	 */
	var __initRoot = function() {
		this.tree.root.child = this.tree.body;
		this.tree.root.glObject = null;
	};
	
	/**
	 * Initializes the body node
	 * 
	 * @private
	 */
	var __initBody = function() {
		this.tree.body.child = this.tree.neck;
		this.tree.body.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdBody.obj'));
		
		mat4.scale(this.tree.body.worldTransform, this.tree.body.worldTransform, vec3.fromValues(0.25, 0.25, 0.25));
	};
	
	/**
	 * Initializes the neck node
	 *
	 * @private
	 */
	var __initNeck = function() {
		this.tree.neck.child = this.tree.head;
		this.tree.neck.sibling = this.tree.leftUpperWing;
		this.tree.neck.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdNeck.obj'));
		
		mat4.translate(this.tree.neck.worldTransform, this.tree.neck.worldTransform, vec3.fromValues(0, -5, 5));
		mat4.rotateX(this.tree.neck.worldTransform, this.tree.neck.worldTransform, -60 * Math.PI / 180);
	};
	
	/**
	 * Initializes the head node
	 *
	 * @private
	 */
	var __initHead = function() {
		this.tree.head.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdHead.obj'));
		
		mat4.translate(this.tree.head.worldTransform, this.tree.head.worldTransform, vec3.fromValues(0, 1.2, 9.7));
		mat4.rotateX(this.tree.head.worldTransform, this.tree.head.worldTransform, Math.PI / 2.75);
	};
	
	/**
	 * Initializes the left upper wing node
	 *
	 * @private
	 */
	var __initLeftUpperWing = function() {
		this.tree.leftUpperWing.child = this.tree.leftLowerWing;
		this.tree.leftUpperWing.sibling = this.tree.rightUpperWing;
		this.tree.leftUpperWing.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdInnerWing.obj'));
		
		mat4.translate(this.tree.leftUpperWing.worldTransform, this.tree.leftUpperWing.worldTransform, vec3.fromValues(0.7, -0.45, 0));
	};
	
	/**
	 * Initializes the left lower wing node
	 *
	 * @private
	 */
	var __initLeftLowerWing = function() {
		this.tree.leftLowerWing.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdOuterWing.obj'));
		
		mat4.translate(this.tree.leftLowerWing.worldTransform, this.tree.leftLowerWing.worldTransform, vec3.fromValues(8, 0.2, 0));
	};
	
	/**
	 * Initializes the right upper wing node
	 *
	 * @private
	 */
	var __initRightUpperWing = function() {
		this.tree.rightUpperWing.child = this.tree.rightLowerWing;
		this.tree.rightUpperWing.sibling = this.tree.tail;
		this.tree.rightUpperWing.glObject = this.tree.leftUpperWing.glObject;	// re-use the left upper wing object
		
		mat4.scale(this.tree.rightUpperWing.worldTransform, this.tree.rightUpperWing.worldTransform, vec3.fromValues(-1, 1, 1));
		mat4.translate(this.tree.rightUpperWing.worldTransform, this.tree.rightUpperWing.worldTransform, vec3.fromValues(0.7, -0.45, 0));
	};
	
	/**
	 * Initializes the right lower wing node
	 *
	 * @private
	 */
	var __initRightLowerWing = function() {
		this.tree.rightLowerWing.glObject = this.tree.leftLowerWing.glObject;	// re-use the left lower wing object
		
		mat4.scale(this.tree.rightLowerWing.worldTransform, this.tree.rightLowerWing.worldTransform, vec3.fromValues(1, -1, 1));
		mat4.translate(this.tree.rightLowerWing.worldTransform, this.tree.rightLowerWing.worldTransform, vec3.fromValues(8, 0.2, 0));
	};
	
	/**
	 * Initializes the tail node
	 *
	 * @private
	 */
	var __initTail = function() {
		this.tree.tail.glObject = new WebGLGraphicsObject(this.gl, ObjectLoader.loadObjDataFromHttp('./obj/BirdBits/ABirdTail.obj'));
		
		mat4.translate(this.tree.tail.worldTransform, this.tree.tail.worldTransform, vec3.fromValues(0, -5, -5));
		mat4.rotateX(this.tree.tail.worldTransform, this.tree.tail.worldTransform, 60 * Math.PI / 180);
	};
	
	/**
	 * Renders the current node and then traverses the tree down by recursion.
	 * Handles the order of the transform matrices of all involved nodes and
	 * applies the local transformations of the nodes.
	 * 
	 * @param	{Object}	node		The current node to travers
	 * @private
	 */
	var __traverse = function(node) {
		if (null === node) {
			return;
		}
		
		// push current matrix to matrix stack
		this.matrixStack.push(mat4.copy(mat4.create(), this.caller.getModelViewMatrix()));
		
		// calculate local transformation matrices
		var localTransform = mat4.create();
		var localTranslation = mat4.fromTranslation(mat4.create(), node.localTranslation);
		var localRotationX = mat4.fromXRotation(mat4.create(), node.localRotation[0]);
		var localRotationY = mat4.fromYRotation(mat4.create(), node.localRotation[1]);
		var localRotationZ = mat4.fromZRotation(mat4.create(), node.localRotation[2]);
		
		// accumulate local transformations
		mat4.multiply(localTransform, localRotationZ, localTransform);
		mat4.multiply(localTransform, localRotationY, localTransform);
		mat4.multiply(localTransform, localRotationX, localTransform);
		mat4.multiply(localTransform, localTranslation, localTransform);
		
		// apply local and world transformations of this node to the current view
		mat4.multiply(localTransform, node.worldTransform, localTransform);
		mat4.multiply(this.caller.getModelViewMatrix(), this.caller.getModelViewMatrix(), localTransform);
		
		// rneder the current node
		__renderNode.call(this, node);
		
		// travers to child
		if (null !== node.child) {
			__traverse.call(this, node.child)
		}
		
		// retriev view matrix from stack
		mat4.copy(this.caller.getModelViewMatrix(), this.matrixStack.pop());
		
		// travers to sibling
		if (null !== node.sibling) {
			__traverse.call(this, node.sibling);
		}
	};
	
	/**
	 * Renders a given node.
	 * This method calculates the normal matrix neccessary for lighting as well.
	 * 
	 * @param	{Object}	node		The current node to render
	 * @private
	 */
	var __renderNode = function(node) {
		if (null === node.glObject) {
			return;
		}
		
		// calculate normal matrix
		var normalMatrix = mat4.create();
		mat4.invert(normalMatrix, this.caller.getModelViewMatrix());
		mat4.transpose(normalMatrix, normalMatrix);
		
		// push data to uniforms and accuire buffers, then render
		this.gl.uniformMatrix4fv(this.caller.getShaderVariable('viewMatrix'), false, this.caller.getModelViewMatrix());
		this.gl.uniformMatrix4fv(this.caller.getShaderVariable('normalMatrix'), false, normalMatrix);
		this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, node.glObject.buffers.normalsBuffer);
		this.gl.vertexAttribPointer(this.caller.getShaderVariable('vNormal'), 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, node.glObject.buffers.verticesBuffer);
		this.gl.vertexAttribPointer(this.caller.getShaderVariable('vPosition'), 3, WebGLRenderingContext.FLOAT, false, 0, 0);
		this.gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, node.glObject.buffers.vertexIndicesBuffer);
		this.gl.drawElements(WebGLRenderingContext.TRIANGLES, node.glObject.meshData.vertexIndices.length * 3, WebGLRenderingContext.UNSIGNED_SHORT, 0);
	};
	
	/**
	 * Initialize a render traversing by starting with the root node.
	 */
	var render = function() {
		this.gl.uniform1i(this.caller.getShaderVariable('mode'), 0);
		__traverse.call(this, this.tree.root);
	};
	
	/**
	 * Returns the tree of this bird object.
	 * 
	 * @returns	{Object}			The current tree
	 */
	var getTree = function() {
		return this.tree;
	};
	
	__class.prototype.constructor = __class;
	__class.prototype.render = render;
	__class.prototype.getTree = getTree;
	
	return __class;
})();
