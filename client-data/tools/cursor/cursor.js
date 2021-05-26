/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2020  Ophir LOJKINE
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

(function () { // Code isolation

	// Allocate half of the maximum server updates to cursor updates
	var MAX_CURSOR_UPDATES_INTERVAL_MS = 64;


	var lastCursorUpdate = 0;
	var sending = true;
	var actualSelected = [];
	var newSelected = [];
	var clearSelected = false;
	var timeoutClearing = null;

	var cursorTool = {
		"name": "Cursor",
		"listeners": {
			"press": function () {
				sending = true
			},
			"move": handleMarker,
			"release": function () {
				sending = true
			},
		},
		"onSizeChange": onSizeChange,
		"draw": draw,
		"mouseCursor": "crosshair",
		"clearAll": clearAll
	};
	Tools.register(cursorTool);
	Tools.addToolListeners(cursorTool);

	var message = {
		type: "update",
		x: 0,
		y: 0,
		color: Tools.getColor(),
		size: Tools.getSize(),	
	};

	function clearAll() {
		const gs = document.querySelector('.js-cursor-g');
		if (gs) {
			gs.classList.add('d-none');
		}
	}

	function handleMarker(x, y, evt) {
		if (evt && evt.touches && evt.touches.length > 1) return;
		// throttle local cursor updates
		message.x = x;
		message.y = y;
		message.color = Tools.getColor();
		message.size = Tools.getSize();
		updateMarker();
	}

	function onSizeChange(size) {
		message.size = size;
		updateMarker();
	}

	function updateMarker() {
		if (!Tools.params.permissions.cursors) return;
		var cur_time = performance.now();
		if (cur_time - lastCursorUpdate > MAX_CURSOR_UPDATES_INTERVAL_MS &&
			(sending || Tools.curTool.showMarker)) {

			Tools.send(message, "Cursor");

			lastCursorUpdate = cur_time;
		}
	}

	var cursorsElem = Tools.svg.getElementById("cursors");
	var d = 'M8.49205 20C8.50813 20 8.52425 19.9993 8.54045 19.998C8.79293 19.9771 9.00333 19.7961 9.06184 19.5493L11.0849 11.0216L19.5473 9.05008C19.7946 8.99244 19.9766 8.78176 19.9979 8.52837C20.0192 8.27502 19.8749 8.03679 19.6407 7.9386L0.811531 0.0454943C0.592304 -0.046445 0.339161 0.00356873 0.171181 0.171974C0.00316048 0.340419 -0.0463657 0.593848 0.0457802 0.813283L7.95263 19.641C8.04447 19.8598 8.25815 20 8.49205 20ZM17.5176 8.31941L10.4664 9.96212C10.2501 10.0125 10.0808 10.1812 10.0295 10.3976L8.33703 17.5319L1.68004 1.68036L17.5176 8.31941Z';

	function createCursor(id, userName) {
		var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g.setAttributeNS(null, "id", id);
		g.setAttributeNS(null, "class", 'js-cursor-g');

		var cursor = document.createElementNS("http://www.w3.org/2000/svg", "path");
		cursor.setAttributeNS(null, "class", "pretty-cursor opcursor");
		cursor.setAttributeNS(null, "id", "xxx-" + id);
		cursor.setAttributeNS(null, "d", d);
		cursor.setAttributeNS(null, "context-fill", "inherit");
		g.appendChild(cursor);

		var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttributeNS(null, "id", "full_name-" + id);
		text.setAttributeNS(null, "x", 23);
		text.setAttributeNS(null, "y", 12);
		text.setAttributeNS(null, "class", "x-pretty-name");
		var textNode = document.createTextNode(userName);
		text.appendChild(textNode);
		g.appendChild(text);

		cursorsElem.appendChild(g);

		return cursor;
	}

	function getCursor(id, userName) {
		return document.getElementById(id) || createCursor(id, userName);
	}

	setInterval(clear, 2000);

	function clear() {
		actualSelected.map(elId => {
			if (!newSelected.includes(elId)) document.getElementById(elId).classList.remove('selectedEl');
		});
		actualSelected = newSelected;
	}

	function draw(message) {
		if (message.selectElements) {
			newSelected = [];
			message.selectElements.forEach(function (elId) {
				newSelected.push(elId);
				document.getElementById(elId).classList.add('selectedEl');
			});
			timeoutClearing = clearTimeout(timeoutClearing);
			timeoutClearing = setTimeout(function () {
				newSelected = [];
			}, 2000);
		} else {
			if (Tools.showMarker) {
				var cursorGroup = getCursor("cursor-" + (message.user.id || 'me'), message.user.full_name);
				cursorGroup.style.transform = "translate(" + message.x * Tools.getScale() + "px, " + message.y * Tools.getScale() + "px)";
				var curImg = cursorGroup.getElementsByTagName('path')[0];
				if (curImg) {
					curImg.style.transform = "translate(" + 0 + "px, " + 0 + "px)";
				}
				if (Tools.isIE) cursorGroup.setAttributeNS(null, "transform", "translate(" + message.x * Tools.getScale() + " " + message.y * Tools.getScale()  + ")");
				if (Tools.isIE) curImg.setAttributeNS(null, "transform", "translate(0 0)");
				cursorGroup.setAttributeNS(null, "fill", message.color);
				curImg.setAttributeNS(null, "fill", message.color);
			}
			if ('showCursor' in message && !message.showCusror) {
				cursorGroup.remove();
			}
		}
	}
})();