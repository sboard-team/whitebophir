/**
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
	var cancel = false,
		shift = false,
		index = 0,
		step = 0,
		curUpdate = {
			'type': 'update',
			'id': "",
			'x': 0,
			'y': 0,
			'x2': 0,
			'y2': 0,
			'index': index,
		},
		types = ['rect', 'rect', 'ellipse', 'ellipse', 'triangle', 'triangle', 'triangle', 'hexagon'],
		lastTime = performance.now();

	function start(x, y, evt) {
		evt.preventDefault();
		if (Tools.deleteForTouches(evt, curUpdate.id)) {
			cancel = true;
			step = 0;
			curUpdate.id = "";
			return;
		}
		cancel = false;
		const id = Tools.generateUID("r");
		const data = {
			'type': types[index], //type 0, 1 - rect; 2, 3 - ellipse, 4, 5, 6 - triangle; 7 - hexagon
			'id': id,
			'color': Tools.getColor(),
			'size': Tools.getSize(),
			'opacity': Tools.getOpacity(),
			'x': x,
			'y': y,
			'x2': x,
			'y2': y,
			'index': index,
		};
		curUpdate.index = index;
		if (index === 6) {
			if (step === 0) {
				curUpdate.x = x;
				curUpdate.y = y;
				curUpdate.id = id;
			} else if (step === 1) {
				curUpdate.x2 = x;
				curUpdate.y2 = y;
				curUpdate.x3 = x;
				curUpdate.y3 = y;
				Tools.drawAndSend(curUpdate);
				step++;
				return;
			} else if (step === 2) {
				curUpdate.x3 = x;
				curUpdate.y3 = y;
				Tools.drawAndSend(curUpdate);
				step++;
				return;
			}
			data.x3 = x;
			data.y3 = y;
			step++;
		} else {
			curUpdate.id = id;
			curUpdate.x = x;
			curUpdate.y = y;
		}
		Tools.drawAndSend(data);
	}

	function move(x, y, evt, isEnd) {
		if (cancel) return;
		if (!curUpdate.id) return;
		if (evt) {
			shift = index === 1 || index === 3 || evt.shiftKey;
			evt.preventDefault();
			if (evt.touches && evt.touches.length > 1) {
				cancel = true;
				return;
			}
		}

		if (curUpdate.index === 1 || (curUpdate.index === 0 && shift)) { //вычисление координат квадрата
			var dx = x - curUpdate.x;
			var dy = y - curUpdate.y;
			var d = Math.max(Math.abs(dx), Math.abs(dy));
			x = curUpdate.x + (dx > 0 ? d : -d);
			y = curUpdate.y + (dy > 0 ? d : -d);
		}

		if (curUpdate.index === 3 || (curUpdate.index === 2 && shift)) { //вычисление координат круга
			var x0 = curUpdate.x;
			var y0 = curUpdate.y;
			var deltaX = x - x0, deltaY = y - y0;
			var diameter = Math.max(Math.abs(deltaX), Math.abs(deltaY));
			x = x0 + (deltaX > 0 ? diameter : -diameter);
			y = y0 + (deltaY > 0 ? diameter : -diameter);
		}

		if (index === 6) {
			if (step === 1) {
				curUpdate.x2 = x;
				curUpdate.y2 = y;
				curUpdate.x3 = x;
				curUpdate.y3 = y;
			} else if (step === 2) {
				curUpdate.x3 = x;
				curUpdate.y3 = y;
			}
		} else {
			curUpdate.x2 = x;
			curUpdate.y2 = y;
		}
		if (performance.now() - lastTime > 50 || isEnd) {
			Tools.drawAndSend(curUpdate);
			lastTime = performance.now();
		} else {
			draw(curUpdate);
		}
	}

	function stop(x, y) {
		if (cancel) return;
		if (!curUpdate.id) return;
		move(x, y, null, true);
		Tools.addActionToHistory({type: "delete", id: curUpdate.id});
		if (index !== 6 || step === 3) curUpdate.id = "";
		if (step === 3) step = 0;
	}

	function draw(data) {
		const selectorType = data.type === 'update' ? types[data.index] : data.type;
		switch (selectorType) {
			case "rect":
				renderRect(data);
				break;
			case "ellipse":
				renderEllipse(data);
				break;
			case "triangle":
				drawTriangle(data);
				break;
			case "hexagon":
				drawHexagon(data)
				break;
			default:
				console.error("Draw instruction shape with unknown type. ", data);
				break;
		}
	}

	function drawTriangle(data) {
		var dataForRender = null;
		if (data.index === 4) {
			dataForRender = calculateEquilateralTriangle(data);
		} else if (data.index === 5) {
			dataForRender = calculateRightTriangle(data);
		} else if (data.index === 6) {
			dataForRender = data;
		}
		renderTriangle(dataForRender);
	}

	function renderTriangle(data) {
		const el = Tools.svg.getElementById(data.id) || Tools.createSVGElement('polygon');
		el.setAttribute("points", `${data.x} ${data.y}, ${data.x3} ${data.y3}, ${data.x2} ${data.y2}`);
		el.classList.add('triangle');
		renderShape(data, el);
	}

	function calculateRightTriangle(data) {
		var x3 = data.x
		var y3 = data.y2
		if (y3 < data.y) {
			x3 = data.x2
			y3 = data.y
		}
		data.x3 = x3;
		data.y3 = y3;
		return data;
	}

	function calculateEquilateralTriangle(data) {
		data.x3 = (data.x2 + data.x) / 2 + Math.sqrt(3) / 2 * (data.y2 - data.y)
		data.y3 = (data.y2 + data.y) / 2 + Math.sqrt(3) / 2 * (data.x - data.x2)
		return data;
	}

	function renderRect(data) {
		const el = Tools.svg.getElementById(data.id) || Tools.createSVGElement('rect');
		el.setAttribute('x', Math.min(data['x2'], data['x']));
		el.setAttribute('y', Math.min(data['y2'], data['y']));
		el.setAttribute('width', Math.abs(data['x2'] - data['x']));
		el.setAttribute('height', Math.abs(data['y2'] - data['y']));
		renderShape(data, el);
	}

	function renderEllipse(data) {
		const el = Tools.svg.getElementById(data.id) || Tools.createSVGElement('ellipse');
		el.cx.baseVal.value = data.x;
		el.cy.baseVal.value = data.y;
		el.rx.baseVal.value = Math.abs(data['x2'] - data['x']);
		el.ry.baseVal.value = Math.abs(data['y2'] - data['y']);
		// el.rx.baseVal.value = Math.abs(data['x2'] - data['x']) / 2;
		// el.ry.baseVal.value = Math.abs(data['y2'] - data['y']) / 2;
		// el.cx.baseVal.value = Math.round((data['x2'] + data['x']) / 2);
		// el.cy.baseVal.value = Math.round((data['y2'] + data['y']) / 2);
		renderShape(data, el);
	}

	function drawHexagon(data) {
		const el = Tools.svg.getElementById(data.id) || Tools.createSVGElement("polygon");
		const Bx = (3 * data.x + data.x2 + Math.sqrt(3) * data.y - Math.sqrt(3) * data.y2) / 4;
		const By = (3 * data.y + data.y2 + Math.sqrt(3) * data.x2 - Math.sqrt(3) * data.x) / 4;
		const Cx = (3 * data.x2 + data.x + Math.sqrt(3) * data.y - Math.sqrt(3) * data.y2) / 4;
		const Cy = (3 * data.y2 + data.y + Math.sqrt(3) * data.x2 - Math.sqrt(3) * data.x) / 4;
		const Ex = (3 * data.x2 + data.x - Math.sqrt(3) * data.y + Math.sqrt(3) * data.y2) / 4;
		const Ey = (3 * data.y2 + data.y - Math.sqrt(3) * data.x2 + Math.sqrt(3) * data.x) / 4;
		const Fx = (3 * data.x + data.x2 - Math.sqrt(3) * data.y + Math.sqrt(3) * data.y2) / 4;
		const Fy = (3 * data.y + data.y2 - Math.sqrt(3) * data.x2 + Math.sqrt(3) * data.x) / 4;
		el.setAttribute("points", `${data.x} ${data.y}, ${Bx} ${By}, ${Cx} ${Cy}, ${data.x2} ${data.y2}, ${Ex} ${Ey}, ${Fx} ${Fy}`);
		el.classList.add('triangle');
		renderShape(data, el);
	}

	function renderShape(data, el) {
		el.id = data.id;
		if (data.color) el.setAttribute("stroke", data.color);
		if (data.size) el.setAttribute("stroke-width", data.size);
		if (data.transform) {
			el.style.transform = data.transform;
			el.style.transformOrigin = data.transformOrigin;
		}
		if (!Tools.svg.getElementById(data.id)) Tools.drawingArea.appendChild(el);
	}

	function onQuit() {
		if (curUpdate.id) {
			const msg = {
				"type": "delete",
				"id": curUpdate.id,
				"sendBack": false,
			};
			Tools.drawAndSend(msg, Tools.list.Eraser);
		}
		step = 0;
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
		"onquit": onQuit,
		"draw": draw,
		"mouseCursor": "crosshair",
		"setIndex": setIndex,
		"stylesheet": "tools/shapes/shapes.css"
	};
	Tools.add(rectangleTool);
})();
