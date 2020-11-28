﻿/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function () { //Code isolation
	var end = false,
		cancel = false,
		shift = false,
		index = 0,
		selected = false,
		curId = "",
		curUpdate = { //The data of the message that will be sent for every new point
			'type': 'update',
			'id': "",
			'x': 0,
			'y': 0,
			'x2': 0,
			'y2': 0,
			'index': index,
		},
		lastPos = { x: 0, y: 0 },
		lastTime = performance.now(); //The time at which the last point was drawn

	function onstart() {
		selected = true;
	}

	function start(x, y, evt) {
		evt.preventDefault();
		if (Tools.deleteForTouches(evt, curUpdate.id)) {
			cancel = true;
			curUpdate.id = "";
			return;
		}
		cancel = false;
		if (index === 0 || index === 1) {
			curId = Tools.generateUID("r");
			Tools.drawAndSend({
				'type': 'rect',
				'id': curId,
				'color': Tools.getColor(),
				'size': Tools.getSize(),
				'opacity': Tools.getOpacity(),
				'x': x,
				'y': y,
				'x2': x,
				'y2': y,
				'index': index,
			});

			curUpdate.id = curId;
			curUpdate.x = x;
			curUpdate.y = y;
			curUpdate.index = index;
		} else if(index === 4 || index === 5) {
			curUpdate.id = Tools.generateUID();
			Tools.drawAndSend({
				'type': 'triangle',
				'id': curUpdate.id,
				'color': Tools.getColor(),
				'size': Tools.getSize(),
				'x': x,
				'y': y,
				'x2': x,// + 0.001,
				'y2': y,
				'index': index,
			});
			curUpdate.x = x;
			curUpdate.y = y;
			curUpdate.index = index;
		} else if(index === 7) {
			curUpdate.id = Tools.generateUID();
			Tools.drawAndSend({
				'type': 'hexagon',
				'id': curUpdate.id,
				'color': Tools.getColor(),
				'size': Tools.getSize(),
				'x': x,
				'y': y,
				'x2': x,// + 0.001,
				'y2': y,
				'index': index,
			});
			curUpdate.x = x;
			curUpdate.y = y;
			curUpdate.index = index;
		} else {
			curUpdate.id = Tools.generateUID("e"); //"e" for ellipse
			Tools.drawAndSend({
				'type': 'ellipse',
				'id': curUpdate.id,
				'color': Tools.getColor(),
				'size': Tools.getSize(),
				'opacity': Tools.getOpacity(),
				'x': x,
				'y': y,
				'x2': x,
				'y2': y,
				'index': index,
			});
			curUpdate.id = curUpdate.id;
			curUpdate.x = x;
			curUpdate.y = y;
			curUpdate.index = index;
		}
	}

	function move(x, y, evt) {
		if (!cancel) {
			if (evt) {
				shift = index === 1 || index === 3 || evt.shiftKey;
				evt.preventDefault();
				if (evt.touches && evt.touches.length > 1) {
					cancel = true;
					return;
				}
			}
			if (curUpdate.index === 0 || curUpdate.index === 1) {
				if (curId !== "") {
					if (index === 1 || shift) {
						var dx = x - curUpdate.x;
						var dy = y - curUpdate.y;
						var d = Math.max(Math.abs(dx), Math.abs(dy));
						x = curUpdate.x + (dx > 0 ? d : -d);
						y = curUpdate.y + (dy > 0 ? d : -d);
					}
					curUpdate['x2'] = x; curUpdate['y2'] = y;
					if (performance.now() - lastTime > 50 || end) {
						Tools.drawAndSend(curUpdate);
						lastTime = performance.now();
					} else {
						draw(curUpdate);
					}
				}
			} else if (curUpdate.index === 4) {
				if (!curUpdate.id) return;
				curUpdate.x2 = x;
				curUpdate.y2 = y;
				if (performance.now() - lastTime > 50 || end) {
					Tools.drawAndSend(curUpdate);
					lastTime = performance.now();
				} else {
					draw(curUpdate);
				}
			} else {
				if (!curUpdate.id) return; // Not currently drawing
				lastPos.x = x;
				lastPos.y = y;
				doUpdate();
			}
		}
	}

	function doUpdate(force) {
		if (!curUpdate.id) return; // Not currently drawing
		if (index === 3 || shift) {
			var x0 = curUpdate['x'], y0 = curUpdate['y'];
			var deltaX = lastPos.x - x0, deltaY = lastPos.y - y0;
			var diameter = Math.max(Math.abs(deltaX), Math.abs(deltaY));
			curUpdate['x2'] = x0 + (deltaX > 0 ? diameter : -diameter);
			curUpdate['y2'] = y0 + (deltaY > 0 ? diameter : -diameter);
		} else {
			curUpdate['x2'] = lastPos.x;
			curUpdate['y2'] = lastPos.y;
		}

		if (performance.now() - lastTime > 50 || force) {
			Tools.drawAndSend(curUpdate);
			lastTime = performance.now();
		} else {
			draw(curUpdate);
		}
	}

	function stop(x, y) {
		if (!cancel) {
			if (index === 0 || index === 1) {
				end = true;
				move(x, y);
				end = false;
				if (curId) {
					Tools.addActionToHistory({type: "delete", id: curId});
				}
				curId = "";
			} else {
				lastPos.x = x;
				lastPos.y = y;
				doUpdate(true);
				if (curUpdate.id) {
					Tools.addActionToHistory({type: "delete", id: curUpdate.id})
				}
				curUpdate.id = "";
			}
		}
	}

	function draw(data) {
		Tools.drawingEvent = true;
		if (data.index === 0 || data.index === 1) {
			switch (data.type) {
				case "rect":
					createShape(data);
					break;
				case "update":
					var shape = svg.getElementById(data['id']);
					if (!shape) {
						console.error("Straight shape: Hmmm... I received a point of a rect that has not been created (%s).", data['id']);
						createShape({ //create a new shape in order not to loose the points
							"id": data['id'],
							"x": data['x2'],
							"y": data['y2']
						});
					}
					updateShape(shape, data);
					break;
				default:
					console.error("Straight shape: Draw instruction with unknown type. ", data);
					break;
			}
		} else if (data.index === 4) {
			switch (data.type) {
				case "triangle":
					drawEquilateralTriangle(data);
					break;
				case "update":
					drawEquilateralTriangle(data);
			}
		} else if (data.index === 5) {
			switch (data.type) {
				case "triangle":
					drawRightTriangle(data);
					break;
				case "update":
					drawRightTriangle(data);
			}
		} else if(data.index === 7) {
			switch (data.type) {
				case "hexagon":
					drawHexagon(data)
					break;
				case "update":
					drawHexagon(data)
					break;
			}
		} else {
			switch (data.type) {
				case "ellipse":
					createShape(data);
					break;
				case "update":
					var shape = svg.getElementById(data['id']);
					if (!shape) {
						console.error("Ellipse: Hmmm... I received an update for a shape that has not been created (%s).", data['id']);
						createShape({ //create a new shape in order not to loose the points
							"id": data['id'],
							"x": data['x2'],
							"y": data['y2']
						});
					}
					updateShape(shape, data);
					break;
				default:
					console.error("Ellipse: Draw instruction with unknown type. ", data);
					break;
			}
		}
	}

	var svg = Tools.svg;
	function createShape(data) {
		if (data.index === 0 || data.index === 1) {
			//Creates a new shape on the canvas, or update a shape that already exists with new information
			var shape = svg.getElementById(data.id) || Tools.createSVGElement("rect");
			shape.id = data.id;
			updateShape(shape, data);
			//If some data is not provided, choose default value. The shape may be updated later
			shape.setAttribute("stroke", data.color || "black");
			shape.setAttribute("stroke-width", data.size || 10);
			shape.setAttribute("opacity", Math.max(0.1, Math.min(1, data.opacity)) || 1);
			Tools.drawingArea.appendChild(shape);
		}
		else {
			//Creates a new shape on the canvas, or update a shape that already exists with new information
			var shape = svg.getElementById(data.id) || Tools.createSVGElement("ellipse");
			updateShape(shape, data);
			shape.id = data.id;
			//If some data is not provided, choose default value. The shape may be updated later
			shape.setAttribute("stroke", data.color || "black");
			shape.setAttribute("stroke-width", data.size || 10);
			shape.setAttribute("opacity", Math.max(0.1, Math.min(1, data.opacity)) || 1);
			Tools.drawingArea.appendChild(shape);
		}
		// if (data.properties) {
		// 	for (var i = 0; i < data.properties.length; i++) {
		// 		shape.setAttribute(data.properties[i][0], data.properties[i][1]);
		// 	}
		// }
		if (data.transform) {
			shape.style.transform = data.transform;
			shape.style.transformOrigin = data.transformOrigin;
		}
		return shape;
	}

	function updateShape(shape, data) {
		if (data.index === 0 || data.index === 1) {
			shape.x.baseVal.value = Math.min(data['x2'], data['x']);
			shape.y.baseVal.value = Math.min(data['y2'], data['y']);
			shape.width.baseVal.value = Math.abs(data['x2'] - data['x']);
			shape.height.baseVal.value = Math.abs(data['y2'] - data['y']);
		} else {
			shape.cx.baseVal.value = Math.round((data['x2'] + data['x']) / 2);
			shape.cy.baseVal.value = Math.round((data['y2'] + data['y']) / 2);
			shape.rx.baseVal.value = Math.abs(data['x2'] - data['x']) / 2;
			shape.ry.baseVal.value = Math.abs(data['y2'] - data['y']) / 2;
		}

	}

	function drawRightTriangle(data) {
		var isNew = true
		if (svg.getElementById(data.id)) isNew = false
		var el = svg.getElementById(data.id) || Tools.createSVGElement("polygon");
		el.id = data.id;
		if (data.color) el.setAttribute("stroke", data.color);
		if (data.size) el.setAttribute("stroke-width", data.size);
		var x3 = data.x
		var y3 = data.y2
		if (y3 < data.y) {
			x3 = data.x2
			y3 = data.y
		}
		el.setAttribute("points", `${data.x} ${data.y}, ${x3} ${y3}, ${data.x2} ${data.y2}`);
		el.classList.add('triangle');
		if (data.transform) {
			el.style.transform = data.transform;
			el.style.transformOrigin = data.transformOrigin;
		}
		if (isNew) Tools.drawingArea.appendChild(el)
	}

	function drawEquilateralTriangle(data) {
		var isNew = true
		if (svg.getElementById(data.id)) isNew = false
		var el = svg.getElementById(data.id) || Tools.createSVGElement("polygon");
		el.id = data.id;
		if (data.color) el.setAttribute("stroke", data.color);
		if (data.size) el.setAttribute("stroke-width", data.size);
		//el.setAttribute("points", `${data.x} ${data.y}, ${data.x + ((data.x2 - data.x) / 2)} ${data.y2}, ${data.x2} ${data.y}`) - равнобедренный
		var x3 = (data.x2 + data.x) / 2 + Math.sqrt(3) / 2 * (data.y2 - data.y)
		var y3 = (data.y2 + data.y) / 2 + Math.sqrt(3) / 2 * (data.x - data.x2)
		el.setAttribute("points", `${data.x} ${data.y}, ${x3} ${y3}, ${data.x2} ${data.y2}`);
		el.classList.add('triangle');
		if (data.transform) {
			el.style.transform = data.transform;
			el.style.transformOrigin = data.transformOrigin;
		}
		if (isNew) Tools.drawingArea.appendChild(el)
	}

	function drawHexagon(data) {
		var isNew = true
		if (svg.getElementById(data.id)) isNew = false
		var el = svg.getElementById(data.id) || Tools.createSVGElement("polygon");
		el.id = data.id;
		if (data.color) el.setAttribute("stroke", data.color);
		if (data.size) el.setAttribute("stroke-width", data.size);
		const Bx = (3 * data.x + data.x2 + 2 * data.y - 2 * data.y2) / 4;
		const By = (3 * data.y + data.y2 + 2 * data.x2 - 2 * data.x) / 4;
		const Cx = (data.x + 3 * data.x2 + 2 * data.y - 2 * data.y2) / 4;
		const Cy = (data.y + 3 * data.y2 + 2 * data.x2 - 2 * data.x) / 4;
		const Ex = (3 * data.x2 + data.x - 2 * data.y + 2 * data.y2) / 4;
		const Ey = (3 * data.y2 + data.y - 2 * data.x2 + 2 * data.x) / 4;
		const Fx = (3 * data.x + data.x2 - 2 * data.y + 2 * data.y2) / 4;
		const Fy = (3 * data.y + data.y2 - 2 * data.x2 + 2 * data.x) / 4;
		//data.x data.y, Bx By, Cx Cy, data.x2 data.y2, Ex Ey, Fx Fy
		el.setAttribute("points", `${data.x} ${data.y}, ${Bx} ${By}, ${Cx} ${Cy}, ${data.x2} ${data.y2}, ${Ex} ${Ey}, ${Fx} ${Fy}`);
		el.classList.add('triangle');
		if (data.transform) {
			el.style.transform = data.transform;
			el.style.transformOrigin = data.transformOrigin;
		}
		if (isNew) Tools.drawingArea.appendChild(el)
	}

	function setIndex(newIndex) {
		index = +newIndex || 0;
	}

	var rectangleTool = {
		"name": "Shapes",
		"shortcut": "r",
		"listeners": {
			"press": start,
			"move": move,
			"release": stop,
		},
		"onstart": onstart,
		"draw": draw,
		"mouseCursor": "crosshair",
		"setIndex": setIndex,
		"stylesheet": "tools/shapes/shapes.css"
	};
	Tools.add(rectangleTool);
})(); //End of code isolation
