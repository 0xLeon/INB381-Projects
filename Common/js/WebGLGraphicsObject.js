/**
 * Represents a renderable WebGL object containing a meshData object. 
 */
var WebGLGraphicsObject = (function() {
	/**
	 * Initializing constructor.
	 * Set's up variables and takes a meshData object as parameter.
	 * 
	 * @param	{WebGLRenderingContext}	gl		The WebGL context
	 * @param	{Object}		meshData	A mesh object returned from OBJ Loader
	 */
	var __class = function(gl, meshData) {
		this.glContext = gl;
		this.meshData = meshData;
		this.buffers = {
			verticesBuffer:		null,
			vertexIndicesBuffer:	null,
			normalsBuffer:		null
		};
		
		__createBuffers.apply(this, null);
		__bindData.apply(this, null);
	};
	
	/**
	 * Creates the needed WebGL buffers.
	 * 
	 * @private
	 */
	var __createBuffers = function() {
		this.buffers.normalsBuffer = this.glContext.createBuffer();
		this.buffers.verticesBuffer = this.glContext.createBuffer();
		this.buffers.vertexIndicesBuffer = this.glContext.createBuffer();
	};
	
	/**
	 * Binds the mesh data to the created WebGL buffers.
	 * 
	 * @private
	 */
	var __bindData = function() {
		this.glContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, this.buffers.normalsBuffer);
		this.glContext.bufferData(WebGLRenderingContext.ARRAY_BUFFER, WebGLHelper.flattenf32(this.meshData.normalsPerVertex), WebGLRenderingContext.STATIC_DRAW);
		
		this.glContext.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, this.buffers.verticesBuffer);
		this.glContext.bufferData(WebGLRenderingContext.ARRAY_BUFFER, WebGLHelper.flattenf32(this.meshData.vertices), WebGLRenderingContext.STATIC_DRAW);
		
		this.glContext.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, this.buffers.vertexIndicesBuffer);
		this.glContext.bufferData(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, WebGLHelper.flattenui16(this.meshData.vertexIndices), WebGLRenderingContext.STATIC_DRAW);
		
	};
	
	__class.prototype.constructor = __class;
	
	return __class;
})();
