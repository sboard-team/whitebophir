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

(function eraser() { //Code isolation
	var targetID = '';
	var index = 0;
	var erasing = false;
	var colorForUpdate = '#fff';

	function press(x, y, evt) {
		if (index === 0) return startErasing(x, y, evt);
		Tools.list.Pencil.listeners.press(x, y, evt);
	}

	function move(x, y, evt) {
		if (index === 0) return erase(x, y, evt);
		Tools.list.Pencil.listeners.move(x, y, evt);
	}

	function release(x, y) {
		if (index === 0) stopErasing();
		Tools.list.Pencil.listeners.release(x, y);
	}

	function startErasing(x, y, evt) {
		evt.preventDefault();
		erasing = true;
		erase(x, y, evt);
	}

	function generateCoordinates(x, y, r) {
		const array = [];
		for (var i = x - r; i <= x + r; i++) {
			for (var k = y - r; k <= y + r; k++) {
				array.push([i, k]);
			}
		}
		return array;
	}

	var msg = {
		"type": "delete",
		"id": "",
		"sendBack": true,
	};

	function inDrawingArea(elem) {
		return Tools.drawingArea.contains(elem);
	}

	function checkElementIsDraw(element) {
		return (element.id !== 'gridContainer' && element !== Tools.svg && element !== Tools.drawingArea && inDrawingArea(element));
	}

	function erase(x, y, evt) {
		erasing = erasing || evt.which === 1;
		var target = evt.target;
		if (target.tagName === 'PRE') target = target.parentElement;
		if (evt.type === "touchmove") {
			// ... the target of touchmove events is the element that was initially touched,
			// not the one **currently** being touched
			var touch = evt.touches[0];
			target = document.elementFromPoint(touch.clientX, touch.clientY);
		}
		if (targetID) {
			document.getElementById(targetID).classList.remove('forErasing');
		}
		if (checkElementIsDraw(target)) {
      targetID = target.id;
			msg.id = targetID;
			if (erasing && target.tagName !== 'image' && !target.classList.contains('selectedEl')) {
				if (msg.id) Tools.drawAndSend(msg);
			} else if (target.tagName !== 'image' && !target.classList.contains('selectedEl')) {
				target.classList.add('forErasing');
			}
		} else {
			if (erasing) {
				const coordinates = generateCoordinates(evt.x, evt.y, 11);
				for (let i of coordinates) {
					const el = document.elementFromPoint(i[0], i[1]);
					if (el && checkElementIsDraw(el) && el.tagName !== 'image' && !el.classList.contains('selectedEl')) {
						msg.id = el.id;
						if (msg.id) Tools.drawAndSend(msg);
					}
				}
			}
			targetID = '';
		}
	}

	function stopErasing() {
		erasing = false;
	}

	function draw(data) {
		var elem;
		switch (data.type) {
			case "array":
				data.events.forEach(function (event) {
					elem = svg.getElementById(event.id);
					if (elem === null) console.error("Eraser: Tried to delete an element that does not exist.");
					else {
						Tools.drawingArea.removeChild(elem);
					}
				});
				break;
			case "delete":
				elem = svg.getElementById(data.id);
				targetID = '';
				if (elem === null) console.error("Eraser: Tried to delete an element that does not exist.");
				else {
					Tools.drawingArea.removeChild(elem);
				}
				break;
			case "clearBoard":
				Tools.historyRedo.splice(0, Tools.historyRedo.length);
				Tools.history.splice(0, Tools.history.length);
				Tools.disableToolsEl('undo');
				Tools.disableToolsEl('redo');
				Tools.change("Hand");
				Tools.drawingArea.innerHTML = '<path stroke="#000000" stroke-width="3" opacity="1" d="M 13.866666666666667 51.2 L 13.866666666666667 51.2 C 13.866666666666667 51.2 13.866666666666667 51.2 13.866666666666667 51.2" style="visibility: hidden"></path>';
				break;
			default:
				console.error("Eraser: 'delete' instruction with unknown type. ", data);
				break;
		}
		if (Tools.curTool.name === 'Transform') {
			Tools.change('Hand');
			Tools.change('Transform');
		}
	}

	function setIndex(newIndex) {
		index = +newIndex || 0;
	}

	var svg = Tools.svg;

	Tools.add({ //The new tool
		"name": "Eraser",
		"shortcut": "e",
		"listeners": {
			"press": press,
			"move": move,
			"release": release,
		},
		"draw": draw,
		"mouseCursor": "crosshair",
		"showMarker": true,
		"setIndex": setIndex,
	});

})(); //End of code isolation
