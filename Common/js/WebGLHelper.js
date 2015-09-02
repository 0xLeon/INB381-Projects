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
	
	var flatten = function(values) {
		// TODO: only supports arrays of vectors or matrices
		
		var fArray = new Float32Array(values.length);
		
		if (values instanceof Array) {
			for (var i = 0, l = values.length; i < l; i++) {
				if ((values[i] instanceof Array) || (values[0] instanceof glMatrix.ARRAY_TYPE)) {
					// TODO: recursive call, what about fArray length?
				}
				else if (typeof(values[i]) == 'number') {
					fArray[i] = values[i];
				}
			}
		}
	};
	
	var requestAnimationFrame = (function() {
		return	window.requestAnimationFrame || 
			window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			(function (callback) {
				window.setTimeout(callback, 1000 / 60);
			});
	})();
	
	return {
		createContext:		createContext,
		requestAnimationFrame:	requestAnimationFrame
	};
})();
