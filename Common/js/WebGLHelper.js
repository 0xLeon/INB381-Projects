/**
 * Created by Stefan on 19.08.2015.
 */
var WebGLHelper = (function() {
	'use strict';
	
	var webglContextNames = ['webgl', 'moz-webgl', 'webkit-webgl', 'experimental-webgl'];
	
	var createContext = function(canvasNode, options) {
		if (!window.WebGLRenderingContext) {
			throw new Error('WebGL not supported.');
		}
		
		canvasNode = $(canvasNode);
		
		if (canvasNode.length === 1) {
			var context = null;
			
			for (var i = 0, l = webglContextNames.length; i < l; i++) {
				try {
					context = canvasNode.get(0).getContext(webglContextNames[i], options);
				}
				catch (e) { }
				
				if (!!context) {
					return context;
				}
			}
			
			throw new Error('WebGL not supported.');
		}
		else {
			throw new Error('Couldn\'t find canvas node.');
		}
	};
	
	var __flatten = function(values, __targetType) {
		if (!(values instanceof Array) && !(values instanceof glMatrix.ARRAY_TYPE)) {
			throw new TypeError('Invalid parameter.');
		}
		
		var n = values.length;
		var isArrayOfArrays = false;
		var innerLength = 1;
		var fArray = null;
		
		if ((values[0] instanceof Array) || (values[0] instanceof glMatrix.ARRAY_TYPE)) {
			if (typeof(values[0][0]) != 'number') {
				throw new TypeError();
			}
			
			n *= values[0].length;
			isArrayOfArrays = true;
			innerLength = values[0].length;
		}
		else if (typeof(values[0]) != 'number') {
			throw new TypeError();
		}
		
		fArray = new __targetType(n);
		
		if (isArrayOfArrays) {
			for (var i = 0, l = values.length, idx = 0; i < l; ++i) {
				for (var j = 0; j < innerLength; ++j) {
					fArray[idx++] = values[i][j];
				}
			}
		}
		else {
			for (var i = 0; i < n; ++i) {
				fArray[i] = values[i];
			}
		}
		
		return fArray;
	};
	
	var flattenf32 = function(values) {
		return __flatten(values, Float32Array);
	};
	
	var flattenf64 = function(values) {
		return __flatten(values, Float64Array);
	};
	
	var flatteni8 = function(values) {
		return __flatten(values, Int8Array);
	};
	
	var flattenui8 = function(values) {
		return __flatten(values, Uint8Array);
	};
	
	var flatteni16 = function(values) {
		return __flatten(values, Int16Array);
	};
	
	var flattenui16 = function(values) {
		return __flatten(values, Uint16Array);
	};
	
	var flatteni32 = function(values) {
		return __flatten(values, Int32Array);
	};
	
	var flattenui32 = function(values) {
		return __flatten(values, Uint32Array);
	};
	
	var requestAnimFrame = (function() {
		return	window.requestAnimationFrame || 
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			(window.webglHelperRequestAnimationFrame = function webglHelperRequestAnimationFrame(callback) {
				window.setTimeout(callback, 1000 / 60);
			});
	})();
	
	return {
		createContext:		createContext,
		flattenf32:		flattenf32,
		flattenf64:		flattenf64,
		flatteni8:		flatteni8,
		flattenui8:		flattenui8,
		flatteni16:		flatteni16,
		flattenui16:		flattenui16,
		flatteni32:		flatteni32,
		flattenui32:		flattenui32,
		requestAnimationFrame:	/^function\s+([\w\$]+)\s*\(/.exec(requestAnimFrame.toString())[1]
	};
})();
