/**
 * Object containing functions to load OBJ data
 * 
 * @type	{Object}
 */
var ObjectLoader = (function() {
	'use strict';
	
	/**
	 * Parses a given OBJ data string and returns an object containing
	 * the vertices, the normals and a vertex indices array.
	 * OBJ object should contain only triangles. Groups etc. are not handled.
	 * 
	 * @param	{Object}	objData		OBJ Data String
	 * @returns	{Object}			Parsed OBJ object
	 */
	var parseObjData = function(objData) {
		if (!objData) {
			throw new Error('Invalid OBJ data given.');
		}
		
		var lines = objData.trim().split("\n");
		var parts = null;
		var vertices = [];
		var normals = [];
		var vertexIndices = [];
		var normalsPerVertex = [];
		var f1 = null;
		var f2 = null;
		var f3 = null;
		
		var arrayPush = Array.prototype.push;
		
		for (var i = 0, l = lines.length; i < l; i++) {
			parts = lines[i].trim().split(' ');
			
			if (parts.length > 0) {
				switch (parts[0]) {
					case 'v':
						vertices.push(
							vec3.fromValues(
								parseFloat(parts[1]),
								parseFloat(parts[2]),
								parseFloat(parts[3])
							)
						);
						break;
					case 'vn':
						normals.push(
							vec3.fromValues(
								parseFloat(parts[1]),
								parseFloat(parts[2]),
								parseFloat(parts[3])
							)
						);
						break;
					case 'f':
						f1 = parts[1].split('/');
						f2 = parts[2].split('/');
						f3 = parts[3].split('/');
						
						vertexIndices.push([
							(parseInt(f1[0]) - 1),
							(parseInt(f2[0]) - 1),
							(parseInt(f3[0]) - 1)
						]);
						
						normalsPerVertex.push(
							(normals[(parseInt(f1[2]) - 1)]));
						normalsPerVertex.push(
							(normals[(parseInt(f2[2]) - 1)]));
						normalsPerVertex.push(
							(normals[(parseInt(f3[2]) - 1)])
						);
						
						break;
				}
			}
		}
		
		return {
			primitiveType:		WebGLRenderingContext.TRIANGLES,
			vertices:		vertices,
			normals:		normals,
			vertexIndices:		vertexIndices,
			normalsPerVertex:	normalsPerVertex,
			material:	{
				ambient:	0.2,
				diffuse:	0.5,
				shininess:	10.0
			}
		};
	};
	
	/**
	 * Loads OBJ data from HTTP and returns the parsed OBJ data.
	 * 
	 * @param	{String}	url		HTTP location of the OBJ data
	 * @returns	{Object}			Parsed OBJ data
	 */
	var loadObjDataFromHttp = function(url) {
		if (!url || (url === '')) {
			throw new Error('Invalid url given.');
		}
		
		var objData = null;
		var errorMessage = null;
		
		$.ajax(url, {
			async: false,
			success: function(data, textStatus, jqXHR) {
				objData = data;
			},
			error: function(jqXHR, textStatus, errorThrown) {
				errorMessage = jqXHR.statusText;
			}
		});
		
		if (!objData || !!errorMessage) {
			throw new Error('Couldn\'t load OBJ data.' + ((!!errorMessage) ? ("\n" + errorMessage) : ''));
		}
		
		return parseObjData(objData);
	};
	
	return {
		parseObjData:		parseObjData,
		loadObjDataFromHttp:	loadObjDataFromHttp
	}
})();
