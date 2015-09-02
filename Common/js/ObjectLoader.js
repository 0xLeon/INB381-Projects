/**
 * Created by Stefan on 19.08.2015.
 */
var ObjectLoader = (function() {
	'use strict';
	
	var parseObjData = function(objData) {
		if (!objData) {
			throw new Error('Invalid OBJ data given.');
		}
		
		var lines = objData.trim().split("\n");
		var parts = null;
		var positions = [];
		var normals = [];
		var vertices = [];
		var f1 = null;
		var f2 = null;
		var f3 = null;
		
		var arrayPush = Array.prototype.push;
		
		for (var i = 0, l = lines.length; i < l; i++) {
			parts = lines[i].trim().split(' ');
			
			if (parts.length > 0) {
				switch (parts[0]) {
					case 'v':
						positions.push(
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
						
						vertices.push(positions[parseInt(f1[0]) - 1]);
						// vertices.push(normals[parseInt(f1[2]) - 1]);
						vertices.push(positions[parseInt(f2[0]) - 1]);
						// vertices.push(normals[parseInt(f2[2]) - 1]);
						vertices.push(positions[parseInt(f3[0]) - 1]);
						// vertices.push(normals[parseInt(f3[2]) - 1]);
						
						// arrayPush.apply(vertices, positions[parseInt(f1[0]) - 1]);
						// arrayPush.apply(vertices, positions[parseInt(f2[0]) - 1]);
						// arrayPush.apply(vertices, positions[parseInt(f3[0]) - 1]);
						break;
				}
			}
		}
		
		return {
			primitiveType:	'TRIANGLES',
			vertices:	vertices,
			// vertexCount:	vertices.length / 6,
			material:	{
				ambient:	0.2,
				diffuse:	0.5,
				shininess:	10.0
			}
		};
	};
	
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
