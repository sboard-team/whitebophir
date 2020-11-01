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
	var board = Tools.board;

	var input = document.createElement("textarea");
	input.id = "textToolInput";

	var curText = {
		"type": 'new',
		"x": 0,
		"y": 0,
		"color": '#000',
		"fontName": '',
		"fontSize": 17,
		"text": '',
		"id": null,
	};

	var active = false;
	var isEdit = false;
	const oldViewportContent = document.querySelector('meta[name="viewport"]').content;
	const textSettingsPanel = document.getElementById('text-settings-panel');
	let heightForViewport = window.innerHeight;

	function onStart() {
		document.querySelector('meta[name="viewport"]').content = oldViewportContent;
		heightForViewport = window.innerHeight;
		window.addEventListener('orientationchange', onOrientationChange);
	}

	function onQuit() {
		document.querySelector('meta[name="viewport"]').content = oldViewportContent;
		window.removeEventListener('orientationchange', onOrientationChange)
		stopEdit();
	}

	function onOrientationChange() {
		heightForViewport = window.innerHeight;
	}

	function clickHandler(x, y, evt, isTouchEvent) {
		if (evt.target === input) return;
		document.querySelector('meta[name="viewport"]').content = oldViewportContent;
		if (evt.target.tagName === "PRE") {
			stopEdit();
			editOldText(evt.target);
			evt.preventDefault();
			isEdit = true;
			return;
		}
		stopEdit();
		isEdit = false;
		curText.x = x;
		curText.y = y + Tools.getFontSize() / 2;
		curText.id = Tools.generateUID();
		curText.color = Tools.getColor();
		startEdit();
		evt.preventDefault();
	}

	function createTextForPaste(text) {
		stopEdit();
		isEdit = false;
		curText.x = Tools.mousePosition.x;
		curText.y = Tools.mousePosition.y + Tools.getFontSize() / 2;
		curText.id = Tools.generateUID();
		curText.color = Tools.getColor();
		curText.sentText = text;
		startEdit();
		input.value = text;
		setTimeout(function () {
			input.style.top = (curText.y + document.getElementById(curText.id).childNodes[0].clientHeight + Tools.getFontSize() + 5) * Tools.getScale() + 'px';
		}, 200);
	}

	function editOldText(elem) {
		curText.id = elem.parentElement.id;
		var r = elem.getBoundingClientRect();
		var x = (r.left + document.documentElement.scrollLeft) / Tools.scale;
		var y = (r.top + document.documentElement.scrollTop) / Tools.scale;
		curText.x = x;
		curText.y = y;
		curText.sentText = elem.innerText;
		curText.size = parseInt(elem.style['font-size']);
		curText.color = elem.style['color'];
		const fontFamily = elem.style['font-family'].replace(/"/g, '');
		curText.fontName = fontFamily;
		Tools.setFontSize(curText.size);
		const fontValueEl = document.getElementById('text-settings-value');
		fontValueEl.setAttribute('style', `font-family: ${fontFamily};`);
		fontValueEl.innerText = fontFamily;
		startEdit();
		input.style.top = (curText.y + document.getElementById(curText.id).childNodes[0].clientHeight + Tools.getFontSize() + 5) * Tools.getScale() + 'px';
		input.value = elem.textContent;
	}

	function startEdit() {
		textSettingsPanel.classList.add('text-settings-panel-opened');
		active = true;
		if (!input.parentNode) board.appendChild(input);
		var x = curText.x * Tools.scale - Tools.board.scrollLeft;
		input.style.left = x + 'px';
		input.style.top = (curText.y + Tools.getFontSize() + 5) * Tools.scale + 'px';
		if (Tools.isMobile()) document.querySelector('meta[name="viewport"]').content = `width=device-width, height=${heightForViewport}, user-scalable=no, initial-scale=1.0 maximum-scale=1`;
		input.focus();
		document.querySelector('meta[name="viewport"]').content = `width=device-width, height=${heightForViewport}, user-scalable=no, initial-scale=1.0 maximum-scale=1`;
		input.addEventListener("keyup", changeHandler);
	}

	function changeHandler(evt) {
		if (evt) {
			if (evt.key === 'Enter' && (evt.shiftKey || Tools.isMobile())) {
				input.style.top = (curText.y + document.getElementById(curText.id).childNodes[0].clientHeight + Tools.getFontSize() + 5) * Tools.getScale() + 'px';
			} else if (evt.key === 'Enter') { // enter
				stopEdit();
				return;
			} else if (evt.which === 27) { // escape
				stopEdit();
				return;
			}
		}
		setTimeout(function () {
			const curTextEl = document.getElementById(curText.id);
			var parentHeight = 0;
			var parentWidth = 0;
			if (curTextEl) {
				parentHeight = curTextEl.childNodes[0].clientHeight;
				parentWidth = curTextEl.childNodes[0].clientWidth;
				input.style.top = (curText.y + curTextEl.childNodes[0].clientHeight + Tools.getFontSize()) * Tools.getScale() + 'px';
			}
			curText.parentWidth = parentWidth;
			curText.parentHeight = parentHeight;
			curText.fontName = document.getElementById('text-settings-value').innerText;
			curText.fontSize = Tools.getFontSize();
			curText.text = input.value;
			curText.type = isEdit ? 'update' : 'new';
			isEdit = true;

			Tools.drawAndSend(curText);
		}, 30);
	}

	function stopEdit() {
		active = false;
		try {
			input.blur();
		} catch (e) { /* Internet Explorer */
		}
		isEdit = false;
		blur();
		if (curText.id) {
			Tools.addActionToHistory({type: "delete", id: curText.id});
		}
		curText.id = null;
		curText.text = "";
		input.value = "";
	}

	function blur() {
		if (active) return;
		input.style.top = '-1000px';
		textSettingsPanel.classList.remove('text-settings-panel-opened');
	}

	function draw(data, isLocal) {
		Tools.drawingEvent = true;
		switch (data.type) {
			case "new":
				createTextField(data);
				break;
			case "update":
				var textField = document.getElementById(data.id).childNodes[0];
				if (textField === null) {
					console.error("Text: Hmmm... I received text that belongs to an unknown text field");
					return false;
				}
				updateText(textField, data.text, document.getElementById(data.id));
				document.getElementById(data.id).setAttribute('height', data.parentHeight || 0);
				document.getElementById(data.id).setAttribute('width', data.parentWidth || 0);
				textField.setAttribute("style", `font-family: ${data.fontName}; color: ${data.color}; font-size: ${data.fontSize}px;`);
				break;
			default:
				console.error("Text: Draw instruction with unknown type. ", data);
				break;
		}
	}

	function updateText(textField, text, parent) {
		textField.textContent = text;
	}

	function createTextField(fieldData) {
		var elem = Tools.createSVGElement("foreignObject");

		elem.setAttribute("x", fieldData.x);
		elem.setAttribute("y", fieldData.y);
		if (fieldData.properties) {
			for (var i = 0; i < fieldData.properties.length; i++) {
				elem.setAttribute(fieldData.properties[i][0], fieldData.properties[i][1]);
			}
		}
		const textEl = document.createElement("pre");
		elem.id = fieldData.id;
		textEl.setAttribute("style", `font-family: ${fieldData.fontName}; color: ${fieldData.color}; font-size: ${fieldData.fontSize}px;`);
		if (fieldData.text) updateText(textEl, fieldData.text, elem);
		elem.appendChild(textEl);
		console.log(fieldData);
		elem.setAttribute('height', fieldData.parentHeight || 0);
		elem.setAttribute('width', fieldData.parentWidth || 0);
		if (fieldData.transform) {
			elem.style.transform = fieldData.transform;
			elem.style.transformOrigin = fieldData.transformOrigin;
		}
		Tools.drawingArea.appendChild(elem);
		return elem;
	}

	Tools.add({
		"name": "Text",
		"shortcut": "t",
		"listeners": {
			"press": clickHandler,
		},
		"changeHandler": changeHandler,
		"onquit": onQuit,
		"onstart": onStart,
		"draw": draw,
		"mouseCursor": "text",
		"createTextForPaste": createTextForPaste,
	});

})(); //End of code isolation
