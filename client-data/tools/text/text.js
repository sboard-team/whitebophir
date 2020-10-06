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
	const textSettingsPanel = document.getElementById('text-settings-panel');

	function onQuit() {
    stopEdit();
	}

	function clickHandler(x, y, evt, isTouchEvent) {
		if (evt.target === input) return;
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

	function editOldText(elem) {
		curText.id = elem.id;
		var r = elem.getBoundingClientRect();
		var x = (r.left + document.documentElement.scrollLeft) / Tools.scale;
		var y = (r.top + r.height + document.documentElement.scrollTop) / Tools.scale;
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
		input.value = elem.textContent;
	}

	function startEdit() {
    textSettingsPanel.classList.add('text-settings-panel-opened');
		active = true;
		if (!input.parentNode) board.appendChild(input);
    var x = curText.x * Tools.scale - Tools.board.scrollLeft;
    input.style.left = x + 'px';
    input.style.top = curText.y * Tools.scale + Tools.getFontSize() + 'px';
		input.focus();
    input.addEventListener("keyup", changeHandler);
	}

	function changeHandler(evt) {
    if (evt) {
      if (evt.key === 'Enter' && evt.shiftKey) {
        input.style.top = curText.y * Tools.scale + document.getElementById(curText.id).clientHeight + Tools.getFontSize() + 'px';
      }
      else if (evt.key === 'Enter') { // enter
        stopEdit();
        return;
      } else if (evt.which === 27) { // escape
        stopEdit();
        return;
      }
    }
    curText.fontName = document.getElementById('text-settings-value').innerText;
    curText.fontSize = Tools.getFontSize();
    curText.text = input.value;
    curText.type = isEdit ? 'update' : 'new';
    isEdit = true;
    Tools.drawAndSend(curText);
  }

	function stopEdit() {
    active = false;
		try { input.blur(); } catch (e) { /* Internet Explorer */ }
		isEdit = false;
		blur();
		if (curText.id) {
			Tools.addActionToHistory({ type: "delete", id: curText.id });
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
				var textField = document.getElementById(data.id);
				if (textField === null) {
					console.error("Text: Hmmm... I received text that belongs to an unknown text field");
					return false;
				}
				updateText(textField, data.text, data.id);
        textField.setAttribute("style", `font-family: ${data.fontName}; color: ${data.color}; font-size: ${data.fontSize}px;`);
				break;
			default:
				console.error("Text: Draw instruction with unknown type. ", data);
				break;
		}
	}

	function updateText(textField, text) {
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
		textEl.id = fieldData.id;
    textEl.setAttribute("style", `font-family: ${fieldData.fontName}; color: ${fieldData.color}; font-size: ${fieldData.fontSize}px;`);
    if (fieldData.text) updateText(textEl, fieldData.text);
    elem.appendChild(textEl);
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
		"draw": draw,
		"mouseCursor": "text"
	});

})(); //End of code isolation
