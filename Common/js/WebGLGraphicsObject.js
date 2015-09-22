var WebGLGraphicsObject = (function() {
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
	
	var __createBuffers = function() {
		this.buffers.normalsBuffer = this.glContext.createBuffer();
		this.buffers.verticesBuffer = this.glContext.createBuffer();
		this.buffers.vertexIndicesBuffer = this.glContext.createBuffer();
	};
	
	var __bindData = function() {
		this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.buffers.normalsBuffer);
		this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGLHelper.flattenf32(this.meshData.normalsPerVertex), this.glContext.STATIC_DRAW);
		
		this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, this.buffers.verticesBuffer);
		this.glContext.bufferData(this.glContext.ARRAY_BUFFER, WebGLHelper.flattenf32(this.meshData.vertices), this.glContext.STATIC_DRAW);
		
		this.glContext.bindBuffer(this.glContext.ELEMENT_ARRAY_BUFFER, this.buffers.vertexIndicesBuffer);
		this.glContext.bufferData(this.glContext.ELEMENT_ARRAY_BUFFER, WebGLHelper.flattenui16(this.meshData.vertexIndices), this.glContext.STATIC_DRAW);
		
	};
	
	__class.prototype.constructor = __class;
	
	return __class;
})();
