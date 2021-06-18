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

var Tools = {};

Tools.params = {};

Tools.i18n = (function i18n() {
	var translations = JSON.parse(document.getElementById("translations").text);
	return {
		"t": function translate(s) {
			var key = s.toLowerCase().replace(/ /g, '_');
			return translations[key] || s;
		}
	};
})();
Tools.server_config = JSON.parse(document.getElementById("configuration").text);

document.getElementById('cabinetURL').setAttribute('href', Tools.server_config.CABINET_URL);
document.getElementById('cabinetURL').addEventListener('click', function () {
		Tools.sendAnalytic('Cabinet', 0);
});

Tools.board = document.getElementById("board");
Tools.svg = document.getElementById("canvas");
Tools.svgWb = document.getElementById("wb");
Tools.drawingArea = Tools.svg.getElementById("drawingArea");
Tools.modalWindows = {
	premiumFunctionForOwner: `<h2 class="modal-title">Функция недоступна!</h2>
                <div class="modal-description">
                    Эта функция не доступна на Вашем тарифе.
                </div>
                <a href="${Tools.server_config.LANDING_URL}cabinet/tariff" class="btn btn-green">
                Управлять тарифом
            </a>`,
	premiumFunctionForDefaultUser: `<h2 class="modal-title">Функция недоступна!</h2>
                <div class="modal-description">
                    Эта функция не доступна, обратитесь к владельцу доски.
                </div>`,
	functionInDevelopment: `<h2 class="modal-title">Функция недоступна!</h2>
                <div class="modal-description">
                    Функция в разработке. Ждите в ближайшем обновлении.
                </div>`,
	clearBoard: `<h2 class="modal-title">Очистка доски!</h2>
                    <div class="modal-description">
                       Вы уверены, что хотите очистить всю доску? Это действие нельзя отменить.
                     </div>
                    <div class="modal-buttons">
                      <div data-action="cancel" class="btn btn-gray">Отмена</div>
                      <div data-action="clearBoard" class="btn btn-green">Принять</div>
                    </div>`,
	wrongImageFormat: `<h2 class="modal-title">Не удалось загрузить изображение!</h2>
                    <div class="modal-description">
                       Неподдерживаемый тип изображения! Поддерживаются: jpeg, jpg, webp, png, svg, ico.
                     </div>`,
	errorOnPasteFromClipboard: `<h2 class="modal-title">Не удалось вставить текст/изображение</h2>
                    <div class="modal-description">
                       Произошла ошибка при вставке текста или изображения. Возможно, вы не дали разрешение на чтение данных из буфера обмена.
                     </div>`,
	renameBoard: `<h2 class="modal-title">Переименование доски</h2>
                <input maxlength="128" id="newBoardName" class="modal-input" type="text" value="">
                <div data-asyncaction="ChangeBoardName" id="buttonRenameBoard" class="btn btn-green">
                  Переименовать
                </div>`,
	errorOnRenameBoard: `<h2 class="modal-title">Не удалось переименовать доску!</h2>
                    <div class="modal-description">
                       Произошла ошибка при обновлении названия доски.
                       Пожалуйста попробуйте еще раз.
                     </div>`,
	upgradeBoard: `<h2 class="modal-title">Активируйте пробный период</h2>
					<div class="modal-description">
						<div class="upgradeTitle">Получите доступ ко всем функциям sBoard!</div>
						Вы и Ваши ученики получите:
						<ol class="upgradeDesc">
							<li>Возможность добавлять изображения на доску</li>
							<li>Возможность сохранять доску в формате pdf</li>
							<li>Видеть курсоры учеников на доске и возможность использовать свой курсор в качестве указки</li>
							<li>Возможность менять фон доски на чёрный или тёмно-зеленый</li>
							<li>Возможность заниматься на доске без рекламы</li>
						</ol>
						Пробный период любого тарифа Вы можете активировать бесплатно прямо сейчас!
					</div>
					<div class="upgrade-button">
						Выбрать тариф
					</div>`
};

//Initialization
Tools.curTool = null;
Tools.drawingEvent = true;
Tools.showMarker = false;
Tools.showOtherCursors = true;
Tools.showMyCursor = false;
Tools.boardBackgroundColor = null;

Tools.isIE = /MSIE|Trident/.test(window.navigator.userAgent);

Tools.socket = null;
Tools.connect = function () {
	var self = this;

	// Destroy socket if one already exists
	if (self.socket) {
		self.socket.destroy();
		delete self.socket;
		self.socket = null;
	}


	this.socket = io.connect('', {
		"path": window.location.pathname.split("/boards/")[0] + "/socket.io",
		"reconnection": true,
		"reconnectionDelay": 100, //Make the xhr connections as fast as possible
		"timeout": 1000 * 60 * 20 // Timeout after 20 minutes
	});

	const preloaderEl = document.getElementById("preloader");
	//Receive draw instructions from the server
	this.socket.on("broadcast", function (msg) {
		handleMessage(msg).finally(function afterload() {
			if (!preloaderEl.classList.contains('hide')) {
				preloaderEl.classList.add("hide");
				setTimeout(Tools.setScrollFromHash, 1000);
				setTimeout(function () {
					Tools.socket.emit('getSelectedElements', Tools.boardName);
				}, 300);
			}
		});
	});

	this.socket.on("addActionToHistory", function (msg) {
		Tools.addActionToHistory(msg, true);
	});

	this.socket.on("addActionToHistoryRedo", function (msg) {
		Tools.historyRedo.push(msg);
		Tools.enableToolsEl('redo');
	});

	this.socket.on("dublicateObjects", function (msg) {
		msg.events.forEach(function (event) {
			if (event.tool === 'Pencil') {
				if (!event.properties) {
					event.properties = [['d', document.getElementById(event.id).getAttribute('d')]];
					event._children = [];
				}
			}
			event.id = Tools.generateUID();
			Tools.drawAndSend(event, Tools.list[event.tool]);
		});
	});

	this.socket.on("reconnect", function onReconnection() {
		Tools.socket.emit('joinboard', Tools.boardName);
	});
};

Tools.connect();

Tools.boardName = (function () {
	var path = window.location.pathname.split("/");
	return decodeURIComponent(path[path.length - 1]);
})();

//Get the board as soon as the page is loaded
Tools.socket.emit("getboard", Tools.boardName);

Tools.HTML = {
	addTool: function (toolName) {
		var toolOpenedFromClick = false;
		const toolEl = document.getElementById('Tool-' + toolName);
		const toolParentEl = document.getElementById('Tool-' + toolName).parentElement;
		const subTools = toolParentEl.getElementsByClassName('sub-tool-item');

		const onClick = function (e) {
			Tools.change(toolName, toolEl.dataset.index);
			toolOpenedFromClick = true;
			toolParentEl.classList.add('opened');
			e.stopPropagation();
			document.addEventListener('touchstart', closeFromClick, {once: true});
		};

		const closeFromClick = function (e) {
			for (var el of e.composedPath()) {
				if (el && el.classList && el.classList.contains('sub-tool-item')) return;
				if (el && el.id === 'Tool-' + toolName) return;
			}
			toolOpenedFromClick = false;
			setTimeout(function () {
				toolParentEl.classList.remove('opened')
			}, 100);
		}

		const onMouseEnter = function (e) {
			toolParentEl.classList.add('opened');
		}

		const onMouseLeave = function (e) {
			if (!toolOpenedFromClick) toolParentEl.classList.remove('opened');
		}

		const subToolClick = function (e) {
			const subTool = e.composedPath().find(function (item) {
				return item.classList.contains('sub-tool-item');
			});
			Tools.change(toolName, subTool.dataset.index);
			toolParentEl.classList.remove('opened');
		}

		for (var subTool of subTools) {
			subTool.addEventListener('click', subToolClick);
		}


		toolEl.addEventListener('click', function () {
			if (!Tools.isMobile()) Tools.change(toolName, toolEl.dataset.index);
		});
		toolEl.addEventListener("touchend", onClick);
		toolParentEl.addEventListener('mouseenter', onMouseEnter);
		toolParentEl.addEventListener('mouseleave', onMouseLeave);
	},
	changeTool: function (oldToolName, newToolName) {
		var oldTool = document.getElementById("Tool-" + oldToolName);
		var newTool = document.getElementById("Tool-" + newToolName);
		if (oldTool) oldTool.classList.remove("selected-tool");
		if (newTool) newTool.classList.add("selected-tool");
	},
	toggle: function (toolName) {
		var elem = document.getElementById("Tool-" + toolName);
		elem.classList.add('selected-tool');
	},
	addStylesheet: function (href) {
		//Adds a css stylesheet to the html or svg document
		var link = document.createElement("link");
		link.href = href;
		link.rel = "stylesheet";
		link.type = "text/css";
		document.head.appendChild(link);
	}
};

Tools.list = {}; // An array of all known tools. {"toolName" : {toolObject}}

Tools.isBlocked = function toolIsBanned(tool) {
	if (tool.name.includes(",")) throw new Error("Tool Names must not contain a comma");
	return Tools.server_config.BLOCKED_TOOLS.includes(tool.name);
};

/**
 * Register a new tool, without touching the User Interface
 */
Tools.register = function registerTool(newTool) {
	if (Tools.isBlocked(newTool)) return;

	if (newTool.name in Tools.list) {
		console.log("Tools.add: The tool '" + newTool.name + "' is already" +
			"in the list. Updating it...");
	}

	//Format the new tool correctly
	Tools.applyHooks(Tools.toolHooks, newTool);

	//Add the tool to the list
	Tools.list[newTool.name] = newTool;

	// Register the change handlers
	if (newTool.onSizeChange) Tools.sizeChangeHandlers.push(newTool.onSizeChange);

	//There may be pending messages for the tool
	var pending = Tools.pendingMessages[newTool.name];
	if (pending) {
		console.log("Drawing pending messages for '%s'.", newTool.name);
		var msg;
		while (msg = pending.shift()) {
			//Transmit the message to the tool (precising that it comes from the network)
			newTool.draw(msg, false);
		}
	}
};

Tools.isMobile = function () {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

Tools.sendAnalytic = function (toolName, index) {
	const CODE = 68060329;
	const Intruments = {
		"Pencil": {
			"0": "pencil",
			"1": "dash_pencil",
			"2": "marker"
		},
		"Transform": {
			"0": "choose",
			"100": "delete_obj",
			"101": "double_obj"
		},
		"Hand": {
			"0": "mover"
		},
		"Eraser": {
			"0": "eraser",
			"1": "corrector",
			"100": "delete_all"
		},
		"Line": {
			"0": "line",
			"1": "line_fix",
			"2": "arrow",
			"3": "arrow_fix",
			"4": "dash_line",
			"5": "dash_line_fix"
		},
		"Shapes": {
			"0": "rectangle",
			"1": "square",
			"2": "ellipse",
			"3": "circle",
			"4": "regular_triangle",
			"5": "right_triangle",
			"6": "random_triangle",
			"7": "regular_hexagon"
		},
		"Formula": {
			"0": "formula"
		},
		"Text": {
			"0": "text"
		},
		"Grid": {
			"0": "back_cells",
			"1": "back_dots",
			"2": "back_empty",
			"3": "white_background",
			"4": "black_background",
			"5": "green_background",
		},
		"Document": {
			"0": "add_img",
		},
		"Size": {
			"0": "size_choice"
		},
		"Color": {
			"0": "color_choice"
		},
		"Zoom": {
			"0": "fit",
			"1": "scale_100",
			"2": "zoom_in",
			"3": "zoom_out"
		},
		"Help": {
			"0": "help"
		},
		"History": {
			"0": "undo",
			"1": "redo"
		},
		"Export": {
			"0": "export_pdf",
			"1": "cut_lines",
		},
		"Cabinet": {
			"0": "back_to_LK",
			"1": "change_title",
		},
		"Cursors": {
			"0": "show_cursor",
		},
	};
	//console.log(CODE,'reachGoal', Intruments[toolName][index])
	ym(CODE, 'reachGoal', Intruments[toolName][index]);
};

(function hotkeys() {
	const presetsList = document.getElementsByClassName('color-preset-box');
	const sizes = [1, 3, 5, 9, 15];
	if (!Tools.isMobile()) {
		document.addEventListener('keydown', function (e) {
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
			if (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) { //v
				navigator.clipboard.read().then(function (data) {
					for (var i = 0; data[0].types.length > i; i++) {
						if (data[0].types[i] === 'text/plain') {//paste text
							data[0].getType("text/plain").then(function (dataBuffer) {
								Tools.change('Text');
								const reader = new FileReader();
								reader.onload = function (progressEvent) {
									Tools.list.Text.createTextForPaste(progressEvent.target.result);
								};
								reader.readAsText(dataBuffer);
								return;
							});
						} else if (data[0].types[i] === 'image/png') {
							if (Tools.params.permissions.image) {
								data[0].getType("image/png").then(function (dataBuffer) {
									const reader = new FileReader();
									reader.readAsDataURL(dataBuffer);
									reader.onload = Tools.list.Document.workWithImage;
								});
							} else {
								if (Tools.params.permissions.edit) {
									createModal(Tools.modalWindows.premiumFunctionForOwner);
								} else {
									createModal(Tools.modalWindows.premiumFunctionForDefaultUser);
								}
							}
							return;
						}
					}

				}).catch(function () {
					createModal(Tools.modalWindows.errorOnPasteFromClipboard);
				});
			}
		});
		document.addEventListener('keyup', function (e) {
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
			if (e.keyCode === 86 && !e.ctrlKey && !e.metaKey) { //v
				Tools.change('Transform');
			} else if (e.keyCode === 70) { //f
				Tools.change('Formula');
			} else if (e.keyCode === 81) {//q
				if (Tools.curTool.name === 'Shapes') {
					var newIndex = 0;
					if (getToolIndex('Shapes') === 0) {
						newIndex = 2;
					} else if (getToolIndex('Shapes') === 1) {
						newIndex = 3;
					} else if (getToolIndex('Shapes') === 2) {
						newIndex = 1;
					} else if (getToolIndex('Shapes') === 3) {
						newIndex = 0;
					}
					Tools.change('Shapes', newIndex);
				} else {
					Tools.change('Shapes', getToolIndex('Shapes'));
				}
			} else if (e.keyCode === 87) { //w
				if (sizes.includes(Tools.getSize())) {
					const newIndex = sizes.findIndex(function (size) {
						return size == Tools.getSize();
					}) + 1;
					Tools.setSize(sizes[newIndex % sizes.length]);
				} else {
					Tools.setSize(sizes[0]);
				}
			} else if (e.keyCode === 67) { //c
				var indexForChange = 0;
				for (var node of presetsList) {
					if (node.classList.contains('selected-color')) {
						node.classList.remove('selected-color');
						indexForChange++;
						break;
					}
					indexForChange++;
				}
				if (indexForChange === 8) {
					indexForChange = 1;
				}
				Tools.setColor(presetsList[indexForChange].getElementsByTagName('div')[0].getAttribute('style').replace('background-color: ', '').replace(';', ''));
				presetsList[indexForChange].classList.add('selected-color');
			} else if (e.keyCode === 72) { //h
				Tools.change('Hand');
			} else if (e.keyCode === 69) { //e
				if (Tools.curTool.name === 'Eraser') {
					return Tools.change('Eraser', getToolIndex('Eraser') === 1 ? 0 : 1);
				}
				Tools.change('Eraser', getToolIndex('Eraser'));
			} else if (e.keyCode === 76) { //l
				if (Tools.curTool.name === 'Line') {
					Tools.change('Line', getToolIndex('Line') === 5 ? 0 : getToolIndex('Line') + 1);
				} else {
					Tools.change('Line', getToolIndex('Line'));
				}
			} else if (e.keyCode === 84) { //t
				Tools.change('Text');
			} else if (e.keyCode === 73) { //i
				Tools.change('Document');
			} else if (e.keyCode === 80) { //p
				if (Tools.curTool.name === 'Pencil') {
					const index = (getToolIndex('Pencil') + 1) % 3;
					Tools.change('Pencil', index);
				} else {
					Tools.change('Pencil', getToolIndex('Pencil'));
				}
			} else if (e.keyCode === 89 && e.ctrlKey) {
				Tools.redo();
			} else if (e.keyCode === 90 && e.ctrlKey) {
				Tools.undo();
			}
		}, false);
	}

	function getToolIndex(toolName) {
		return +document.getElementById('Tool-' + toolName).dataset.index;
	}
})();
/**
 * Add a new tool to the user interface
 */
Tools.add = function (newTool) {
	if (Tools.isBlocked(newTool)) return;

	Tools.register(newTool);

	if (newTool.stylesheet) {
		Tools.HTML.addStylesheet(newTool.stylesheet);
	}

	//Add the tool to the GUI
	Tools.HTML.addTool(newTool.name);
};

Tools.change = function (toolName, subToolIndex) {
	var newTool = Tools.list[toolName];
	var oldTool = Tools.curTool;
	if (oldTool && oldTool !== newTool) {
		document.getElementById('Tool-' + oldTool.name).parentElement.classList.remove('opened');
	}
	const toolEl = document.getElementById('Tool-' + toolName);
	if (toolEl.classList) {
		toolEl.classList.remove('fix');
		toolEl.classList.remove('dash');
		toolEl.classList.remove('shape');
	}
	toolElParent = toolEl.parentElement;
	for (var item of toolElParent.getElementsByClassName('sub-tool-item')) {
		if (item.dataset.index == subToolIndex) {
			toolEl.innerHTML = item.innerHTML;
			if (item.classList.contains('fix')) toolEl.classList.add('fix');
			if (item.classList.contains('dash')) toolEl.classList.add('dash');
			if (item.classList.contains('shape')) toolEl.classList.add('shape');
			item.classList.add('selected-tool');
		} else {
			item.classList.remove('selected-tool');
		}
	}
	if (newTool.setIndex) {
		toolEl.dataset.index = +subToolIndex || 0;
		newTool.setIndex(subToolIndex);
	}

	if (!newTool) throw new Error("Trying to select a tool that has never been added!");
	if (newTool === oldTool) {
		if (newTool.secondary) {
			newTool.secondary.active = !newTool.secondary.active;
			var props = newTool.secondary.active ? newTool.secondary : newTool;
			Tools.HTML.toggle(newTool.name, props.name, props.icon);
			if (newTool.secondary.switch) newTool.secondary.switch();
		}
		Tools.sendAnalytic(newTool.name, +subToolIndex || 0)
		return;
	}
	if (!newTool.oneTouch) {
		//Update the GUI
		var curToolName = (Tools.curTool) ? Tools.curTool.name : "";
		try {
			Tools.HTML.changeTool(curToolName, toolName);
		} catch (e) {
			console.error("Unable to update the GUI with the new tool. " + e);
		}
		Tools.svg.style.cursor = newTool.mouseCursor || "auto";
		Tools.board.title = Tools.i18n.t(newTool.helpText || "");

		//There is not necessarily already a curTool
		if (Tools.curTool !== null) {
			//It's useless to do anything if the new tool is already selected
			if (newTool === Tools.curTool) return;

			//Remove the old event listeners
			Tools.removeToolListeners(Tools.curTool);

			//Call the callbacks of the old tool
			Tools.curTool.onquit(newTool);
		}

		//Add the new event listeners
		Tools.addToolListeners(newTool);
		Tools.curTool = newTool;
		Tools.sendAnalytic(Tools.curTool.name, +subToolIndex || 0)
	} else {
		Tools.sendAnalytic(newTool.name, +subToolIndex || 0)
	}

	//Call the start callback of the new tool
	newTool.onstart(oldTool);
};

Tools.addToolListeners = function addToolListeners(tool) {
	for (var event in tool.compiledListeners) {
		var listener = tool.compiledListeners[event];
		var target = listener.target || Tools.board;
		target.addEventListener(event, listener, {'passive': false});
	}
};

Tools.removeToolListeners = function removeToolListeners(tool) {
	for (var event in tool.compiledListeners) {
		var listener = tool.compiledListeners[event];
		var target = listener.target || Tools.board;
		target.removeEventListener(event, listener);
		// also attempt to remove with capture = true in IE
		if (Tools.isIE) target.removeEventListener(event, listener, true);
	}
};

Tools.send = function (data, toolName) {
	toolName = toolName || Tools.curTool.name;
	var d = data;
	d.tool = toolName;
	Tools.applyHooks(Tools.messageHooks, d);
	var message = {
		"board": Tools.boardName,
		"user": Tools.params.user,
		"data": d
	};
	Tools.socket.emit('broadcast', message);
};

Tools.drawAndSend = function (data, tool) {
	if (tool == null) tool = Tools.curTool;
	tool.draw(data, true);
	Tools.send(data, tool.name);
};

//Object containing the messages that have been received before the corresponding tool
//is loaded. keys : the name of the tool, values : array of messages for this tool
Tools.pendingMessages = {};

// Send a message to the corresponding tool
function messageForTool(message) {
	var name = message.tool,
		tool = Tools.list[name];

	if (tool) {
		Tools.applyHooks(Tools.messageHooks, message);
		tool.draw(message, false);
	} else {
		///We received a message destinated to a tool that we don't have
		//So we add it to the pending messages
		if (!Tools.pendingMessages[name]) Tools.pendingMessages[name] = [message];
		else Tools.pendingMessages[name].push(message);
	}

	if (message.tool !== 'Hand' && message.deltax != null && message.deltay != null) {
		//this message has special info for the mover
		messageForTool({
			tool: 'Hand',
			type: 'update',
			deltax: message.deltax || 0,
			deltay: message.deltay || 0,
			id: message.id
		});
	}
}

// Apply the function to all arguments by batches
function batchCall(fn, args) {
	var BATCH_SIZE = 1024;
	if (args.length === 0) {
		return Promise.resolve();
	} else {
		var batch = args.slice(0, BATCH_SIZE);
		var rest = args.slice(BATCH_SIZE);
		return Promise.all(batch.map(fn))
			.then(function () {
				return new Promise(requestAnimationFrame);
			}).then(batchCall.bind(null, fn, rest));
	}
}

// Call messageForTool recursively on the message and its children
function handleMessage(message) {
	//Check if the message is in the expected format
	if (!message.tool && !message._children) {
		console.error("Received a badly formatted message (no tool). ", message);
	}
	if (message.tool) messageForTool(message);
	if (message._children) return batchCall(handleMessage, message._children);
	else return Promise.resolve();
}

Tools.unreadMessagesCount = 0;
Tools.newUnreadMessage = function () {
	Tools.unreadMessagesCount++;
	updateDocumentTitle();
};

window.addEventListener("focus", function () {
	Tools.unreadMessagesCount = 0;
	updateDocumentTitle();
});

function updateDocumentTitle() {
	document.title =
		(Tools.unreadMessagesCount ? '(' + Tools.unreadMessagesCount + ') ' : '') +
		Tools.boardTitle +
		" | sBoard";
}

// Function for creating Modal Window
function createModal(htmlContent, functionAfterCreate, functionAfterClose) {
	picoModal({
		content: htmlContent,
		closeHtml: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6M6 6L11 1M6 6L1 11M6 6L11 11" stroke="#828282" stroke-linecap="round" stroke-linejoin="round"/></svg>',
		closeClass: 'close',
		modalClass: 'modal',
	}).afterCreate(modal => {
		if (functionAfterCreate) functionAfterCreate();
		modal.modalElem().addEventListener("click", evt => {
			if (evt.target && evt.target.dataset.action) {
				modal.close(evt.target.dataset.action);
			} else if (evt.target && evt.target.dataset.asyncaction) {
				const newName = document.getElementById('newBoardName').value;
				Tools.sendAnalytic('Cabinet', 1)
				fetch(Tools.server_config.API_URL + 'boards/' + Tools.boardName + '?name=' + newName,
					{
						method: 'GET',
						credentials: 'include',
						mode: 'no-cors',
						headers: {
							'Content-Type': 'application/json'
						},
					}).then(function () {
					document.getElementById('board-name-span').innerText = newName;
					Tools.boardTitle = newName;
					updateDocumentTitle();
					modal.close();
				}).catch(function () {
					modal.close();
					setTimeout(function () {
						createModal(Tools.modalWindows.errorOnRenameBoard);
					}, 50);
				});
			}
		});
	}).afterClose((modal, event) => {
		if (functionAfterClose) functionAfterClose();
		if (event.detail === 'clearBoard') {
			Tools.drawAndSend({
				'type': 'clearBoard',
			}, Tools.list.Eraser);
			Tools.sendAnalytic('Eraser', 100)
		}
		modal.destroy();
	}).show();
}

(function () {
    // Scroll and hash handling
    // events for button scaling
    // button events in this function
    var scrollTimeout, lastStateUpdate = Date.now();

    window.addEventListener("scroll", function onScroll() {
        var x = document.documentElement.scrollLeft / Tools.getScale(),
            y = document.documentElement.scrollTop / Tools.getScale();
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function updateHistory() {
            var hash = '#' + (x | 0) + ',' + (y | 0) + ',' + Tools.getScale().toFixed(2);
            if (Date.now() - lastStateUpdate > 5000 && hash !== window.location.hash) {
                window.history.pushState({}, "", hash);
                lastStateUpdate = Date.now();
            } else {
                window.history.replaceState({}, "", hash);
            }
        }, 100);
    });

    function setScrollFromHash() {
        var coords = window.location.hash.slice(1).split(',');
        var x = coords[0] | 0;
        var y = coords[1] | 0;
        var scale = parseFloat(coords[2]);
        resizeCanvas({x: x, y: y});
        Tools.setScale(scale);
        window.scrollTo(x * scale, y * scale);
        resizeBoard();
    }

    Tools.setScrollFromHash = setScrollFromHash;

    function scaleToFull() {
	    Tools.sendAnalytic('Zoom', 1);
	    scaleToCenter(1 - Tools.getScale());
    }

    function scaleToWidth() {
    	Tools.sendAnalytic('Zoom', 0);
	    scaleToCenter(document.body.clientWidth / Tools.server_config.MAX_BOARD_SIZE_X - Tools.getScale());
    }

    function minusScale() {
	    Tools.sendAnalytic('Zoom', 3);
	    scaleToCenter(-0.1);
    }

    function goToHelp() {
	    Tools.sendAnalytic('Help', 0);
	    window.open(Tools.server_config.LANDING_URL + 'help');
    }

    function scaleToCenter(deltaScale) {
	    var oldScale = Tools.getScale();
	    var newScale = Tools.setScale(oldScale + deltaScale);
	    var originX = (window.scrollX + document.documentElement.clientWidth / 2 - (Tools.board.getBoundingClientRect().left < 0 ? 0 : Tools.board.getBoundingClientRect().left)) / Tools.getScale();
	    var originY = (window.scrollY + document.documentElement.clientHeight / 2) / Tools.getScale();
	    resizeBoard();
	    window.scrollTo(
		    window.scrollX + originX * (newScale - oldScale),
		    window.scrollY + originY * (newScale - oldScale),
	    );
    }

	function plusScale() {
		Tools.sendAnalytic('Zoom', 2);
		scaleToCenter(0.1);
	}

	function sendClearBoard() {
		createModal(Tools.modalWindows.clearBoard);
	}

	function createModalRename() {
		createModal(Tools.modalWindows.renameBoard, function () {
			document.getElementById('newBoardName').value = Tools.boardTitle;
		});
	}

	function toggleCursors() {
		const cursor = document.querySelector('.js-cursor-g');
		if (Tools.params.permissions.cursors) {
			Tools.sendAnalytic("Cursors", 0);
			Tools.showMarker = !Tools.showMarker;
			if (Tools.showMarker === false) {
				Tools.list.Cursor.clearAll();
			}
			if (Tools.showMarker && cursor && cursor.classList.contains('d-none')) {
				cursor.classList.remove('d-none');
			}
			let btnCursorTitle = (Tools.showMarker)
				? 'Скрыть курсоры участников'
				: 'Показать курсоры участников';
			document.getElementById('btnCursors').setAttribute('data-tooltip', btnCursorTitle);
		} else {
			if (Tools.params.permissions.edit) {
				createModal(Tools.modalWindows.premiumFunctionForOwner);
			} else {
				createModal(Tools.modalWindows.premiumFunctionForDefaultUser);
			}
		}
	}

	function createPdf() {
		if (Tools.params.permissions.pdf) {
			Tools.sendAnalytic("Export", 0)
			window.open(Tools.server_config.PDF_URL + 'generate/' + Tools.boardName + '?name=' + Tools.boardTitle);
		} else {
			if (Tools.params.permissions.edit) {
				createModal(Tools.modalWindows.premiumFunctionForOwner);
			} else {
				createModal(Tools.modalWindows.premiumFunctionForDefaultUser);
            }
        }
    }

    function exportPDFWithoutMobile(e) {
	    if (document.getElementsByClassName('pdf-menu')[0].contains(e.target)) return;
	    if (!Tools.isMobile()) createPdf();
    }

    function togglePDFLines() {
			document.getElementById('pdfLines').classList.toggle('hide');
			Tools.sendAnalytic('Export', 1)
    }

    function showBoard() {
		const userData = Tools.params.user;

        Tools.boardTitle = Tools.params.board.name;
        updateDocumentTitle();

		document.getElementById('board-name-span').innerText = Tools.boardTitle;

		if (Tools.params.permissions.edit) {
			document.getElementById('boardName').addEventListener('click', createModalRename, false);
		} else {
			document.getElementById('boardName')
				.removeAttribute('data-tooltip');
		}

		// var boardBackgroundColor = Tools.params.board.settings?.background?.color;
		if (Tools.params.permissions.background && Tools.boardBackgroundColor) {
			Tools.svg.style.backgroundColor = Tools.boardBackgroundColor;
			if (Tools.boardBackgroundColor.toUpperCase !== '#FFFFFF') {
				Tools.setColor('#FFFFFF');
			}
			else {
				Tools.svg.style.backgroundColor = '#FFFFFF';
			}
		}
		if (Tools.params.permissions.invite) {
			document.querySelector('.js-link-text').innerText = Tools.params.invite_link;
		} else {
			document.querySelector('.js-link-panel').remove();
			document.querySelector('.js-join-link').remove();
		}

		if (Tools.server_config.FEATURES_CURSORS && Tools.params.permissions.cursors) {
			Tools.showMarker = true;
		}
		if (Tools.server_config.FEATURES_CURSORS === false) {
			document.getElementById('btnCursors').remove();
		} else {
			let btnCursorTitle = (Tools.showMarker)
				? 'Скрыть курсоры участников'
				: 'Показать курсоры участников';

			document.getElementById('btnCursors').setAttribute('data-tooltip', btnCursorTitle);
		}

		if (!Tools.params.permissions.image) {
			document.getElementById('Tool-Document').classList.add('disabled-icon');
		}

		if (!Tools.params.permissions.cursors) {
			document.querySelector('.js-cursors').classList.add('disabled-icon');
		}

		if (userData.role === 'tutor' && userData.tariffId === 1 && !userData.hasTrial) {
			document.getElementById('upgrade-board-btn').classList.remove('hide');
		}

		if (!Tools.params.permissions.background) {
			const bgBtns = document.querySelectorAll('.js-change-bgcolor');
			bgBtns.forEach((el) => {
				el.classList.add('disabled-icon');
			});
		}

		let b = document.querySelectorAll('.js-elements');
		b.forEach((el) => {
			el.classList.toggle('sjx-hidden');
		});
		//interval for send activity board
		setInterval((function () {
			var lastPosX = Tools.mousePosition.x;
			var lastPosY = Tools.mousePosition.y;
			return function () {
				if (lastPosX !== Tools.mousePosition.x || lastPosY !== Tools.mousePosition.y) {
					fetch(Tools.server_config.API_URL + `boards/${Tools.boardName}/activity`, {
						credentials: "include",
						mode: 'no-cors',
					});
				}
				lastPosX = Tools.mousePosition.x;
				lastPosY = Tools.mousePosition.y;
			}
		})(), 30000);

		document.getElementById("preloader").classList.remove('dont-hide');
	}

    function checkBoard() {
        const urlParams = new URLSearchParams(window.location.search);
        const PASS = urlParams.get('pass');
        var localStorageData = localStorage.getItem(Tools.boardName);
        if (localStorageData) {
            if (window.location.hash.slice(1).split(',').length !== 3) {
                localStorageData = JSON.parse(localStorageData);
                window.location.hash = `${localStorageData.x},${localStorageData.y},${localStorageData.scale}`;
            }
        }
        if (Tools.server_config.DEV_MODE === 1 || PASS === 'dlTmsXCPwaMfTosmtDpsdf') {
            Tools.params = {
				"status": true,
				"board": {"name": "Dev Board"},
				"user": {
					"id": "187999",
					"name": "John",
					"surname": "Smith",
					"full_name": "John Smith",
					"role": "tutor",
					"hasTrial": false,
					"tariffId": 1,
				},
				"permissions": {"edit": true, "invite": true, "image": true, "pdf": true, "cursors": true, "background": true},
				"invite_link": "https:\/\/sboard.su\/cabinet\/boards\/join\/56dfgdfbh67="
			};
            showBoard();
            return;
        }
        fetch(
            Tools.server_config.API_URL + 'boards/' + Tools.boardName + '/info',
            {
                headers: new Headers({
                    'Accept': 'application/json',
                }),
                method: 'GET',
                credentials: 'include',
            }
        )
            .then(response => {
                if (response.status === 401) {
                    throw new Error('Unauthenticated user')
                } else if (response.status === 403) {
                    throw new Error('Forbidden');
                } else if (response.status !== 200) {
                    throw new Error('Unknown error');
                }
                return response.json();
            })
            .then(data => {
                Tools.params = data;
                showBoard();
            })
            .catch(function (error) {
				console.error(error)
				if (error.message === 'Unauthenticated user') {
					window.location.href = Tools.server_config.CABINET_URL + 'boards/' + Tools.boardName + '/reopen';
				} else if (error.message === 'Forbidden') {
					window.location.href = Tools.server_config.CABINET_URL + 'boards/' + Tools.boardName + '/forbidden';
				} else {
					//window.location.href = Tools.server_config.CABINET_URL + 'boards/' + Tools.boardName + '/unknown';
				}
			})
    }

	document.getElementById('scalingWidth').addEventListener('click', scaleToWidth, false);
	document.getElementById('scalingFull').addEventListener('click', scaleToFull, false);
	document.getElementById('minusScale').addEventListener('click', minusScale, false);
	document.getElementById('plusScale').addEventListener('click', plusScale, false);
	document.getElementById("help").addEventListener('click', goToHelp, false);
	document.getElementById('clearBoard').addEventListener('click', sendClearBoard, false);
	document.getElementById('exportToPDF').addEventListener('click', createPdf, false);
	document.getElementById('exportToPDFButton').addEventListener('click', createPdf, false);
	document.getElementById('btnCursors').addEventListener('click', toggleCursors, false);
	document.getElementById('showPDFLines').addEventListener('click', togglePDFLines, false);
	document.getElementById('pdfWithoutMobile').addEventListener('click', exportPDFWithoutMobile, false);
	document.addEventListener('mouseleave', function(event) {
		if (event.clientY <= 0 || event.clientX <= 0 || (event.clientX >= window.innerWidth || event.clientY >= window.innerHeight)) {
			Tools.send({
				showCursor: false
			}, "Cursor")
		}
	});
	document.addEventListener('visibilitychange', function() {
		if (document.visibilityState === 'hidden') {
			Tools.send({
				showCursor: false
			}, "Cursor")
		}
	});

	window.addEventListener("hashchange", setScrollFromHash, false);
	window.addEventListener("popstate", setScrollFromHash, false);
	window.addEventListener("DOMContentLoaded", setScrollFromHash, false);
	window.addEventListener("load", setScrollFromHash, false);
	window.addEventListener("DOMContentLoaded", checkBoard, false);
	window.addEventListener('orientationchange', function () {
		setTimeout(function () {
			Tools.setScale(Tools.getScale());
			resizeBoard();
        }, 650);
    });
    window.addEventListener('unload', function () {
        const coords = window.location.hash.slice(1).split(',');
        const x = coords[0] | 0;
        const y = coords[1] | 0;
        const scale = parseFloat(coords[2]);
        localStorage.setItem(Tools.boardName, JSON.stringify({
            x: x,
            y: y,
            scale: scale,
        }));
    });
    var timeoutRedirect = null;
    window.addEventListener('mousemove', function () {
    	clearTimeout(timeoutRedirect);
	    timeoutRedirect = setTimeout(function () {
			if (!Tools.isMobile()) {
				window.location.replace(Tools.server_config.CABINET_URL + 'boards/' + Tools.boardName + '/inactive');
			}
		}, Tools.server_config.TIME_BEFORE_CLOSE * 60 * 1000 || 2*60*60*1000);
    });

})();

//List of hook functions that will be applied to messages before sending or drawing them
function resizeCanvas(m) {
	//Enlarge the canvas whenever something is drawn near its border
	var x = m.x | 0, y = m.y | 0
	if (x > Tools.svg.width.baseVal.value - 2048) {
		Tools.svg.width.baseVal.value = Math.min(x + 2048, Tools.server_config.MAX_BOARD_SIZE_X);
	}
	if (y > Tools.svg.height.baseVal.value - 5000) {
		Tools.svg.height.baseVal.value = Math.min(y + 5000, Tools.server_config.MAX_BOARD_SIZE_Y);
	}
	resizeBoard();
}

(function createTooltips() {
	if (!Tools.isMobile()) {
		const styles = document.createElement('style');
		styles.innerHTML = `*[data-tooltip] {
    position: relative;
}

*[data-tooltip]::after {
    white-space: nowrap;
    font-family: 'Montserrat', sans-serif;
    content: attr(data-tooltip);
    font-size: 12px;
    line-height: 15px;
    text-align: center;
    position: absolute;
    top: 10px;
    left: 50px;
    pointer-events: none;
    opacity: 0;
    -webkit-transition: opacity .15s ease-in-out;
    -moz-transition: opacity .15s ease-in-out;
    -ms-transition: opacity .15s ease-in-out;
    -o-transition: opacity .15s ease-in-out;
    transition: opacity .15s ease-in-out;
    display: block;
    background: #fff;
    padding: 5px 10px;
    box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    color: #000 !important;
}

.tooltip-bottom[data-tooltip]::after {
    bottom: -40px;
    left: 0;
    right: initial;
    top: initial;
}

.tooltip-top[data-tooltip]::after {
    top: -40px;
    bottom: initial;
    left: 0;
}

.tooltip-toLeft[data-tooltip]::after {
    right: 0;
    left: initial;
}


*[data-tooltip]:hover::after {
    opacity: 1;
}`;
		document.getElementsByTagName('body')[0].append(styles);
	}
})();

function resizeBoard() {
	// Update board container size
	Tools.board.style.width = Tools.svg.width.baseVal.value * Tools.getScale() + "px";
	Tools.board.style.height = Tools.svg.height.baseVal.value * Tools.getScale() + "px";
}

function updateUnreadCount(m) {
	if (document.hidden && ["child", "update"].indexOf(m.type) === -1) {
		Tools.newUnreadMessage();
	}
}

Tools.messageHooks = [resizeCanvas, updateUnreadCount];
var scaleTimeout = null;
const scaleValueEl = document.getElementById('scaleValue');
const htmlBodyEl = document.getElementsByTagName('body')[0];
Tools.setScale = function setScale(scale) {
	if (isNaN(scale)) {
		scale = document.body.clientWidth / Tools.server_config.MAX_BOARD_SIZE_X;
	}
	scale = Math.max(0.1, Math.min(10, scale));
	Tools.svgWb.style.willChange = 'transform';
	Tools.svgWb.style.transform = 'scale(' + scale + ')';
	clearTimeout(scaleTimeout);
	scaleTimeout = setTimeout(function () {
		Tools.svgWb.style.willChange = 'auto';
	}, 1000);
	Tools.scale = scale;
	scaleValueEl.innerText = Math.round(scale * 100) + '%';
	if (scale < document.body.clientWidth / Tools.server_config.MAX_BOARD_SIZE_X) {
		htmlBodyEl.style = 'display: flex; justify-content: center;';
	} else {
		htmlBodyEl.style = '';
	}
	if (Tools.curTool.name === 'Transform') {
		Tools.list.Transform.updateRect();
	}
	return scale;
}
Tools.getScale = function getScale() {
	return Tools.scale;
}

Tools.mousePosition = {x: 100, y: 100};
//List of hook functions that will be applied to tools before adding them
Tools.toolHooks = [
	function checkToolAttributes(tool) {
		if (typeof (tool.name) !== "string") throw "A tool must have a name";
		if (typeof (tool.listeners) !== "object") {
			tool.listeners = {};
		}
		if (typeof (tool.onstart) !== "function") {
			tool.onstart = function () {
			};
		}
		if (typeof (tool.onquit) !== "function") {
			tool.onquit = function () {
			};
		}
	},
	function compileListeners(tool) {
		//compile listeners into compiledListeners
		var listeners = tool.listeners;

		//A tool may provide precompiled listeners
		var compiled = tool.compiledListeners || {};
		tool.compiledListeners = compiled;

		function compile(listener) { //closure
			return (function listen(evt) {
				var x = (evt.pageX - (Tools.board.getBoundingClientRect().left < 0 ? 0 : Tools.board.getBoundingClientRect().left)) / Tools.getScale(),
					y = evt.pageY / Tools.getScale();
				Tools.mousePosition.x = x;
				Tools.mousePosition.y = y;
				return listener(x, y, evt, false);
			});
		}

		function compileTouch(listener) { //closure
			return (function touchListen(evt) {
				//Currently, we don't handle multitouch
				if (evt.changedTouches.length === 1) {
					//evt.preventDefault();
					var touch = evt.changedTouches[0];
					var x = (touch.pageX - (Tools.board.getBoundingClientRect().x < 0 ? 0 : Tools.board.getBoundingClientRect().x)) / Tools.getScale(),
						y = touch.pageY / Tools.getScale();
					Tools.mousePosition.x = x;
					Tools.mousePosition.y = y;
					return listener(x, y, evt, true);
				}
				return true;
			});
		}

		function wrapUnsetHover(f, toolName) {
			return (function unsetHover(evt) {
				document.activeElement && document.activeElement.blur && document.activeElement.blur();
				return f(evt);
			});
		}

		if (listeners.press) {
			compiled["mousedown"] = wrapUnsetHover(compile(listeners.press), tool.name);
			compiled["touchstart"] = wrapUnsetHover(compileTouch(listeners.press), tool.name);
		}
		if (listeners.move) {
			compiled["mousemove"] = compile(listeners.move);
			compiled["touchmove"] = compileTouch(listeners.move);
		}
		if (listeners.release) {
			var release = compile(listeners.release),
				releaseTouch = compileTouch(listeners.release);
			compiled["mouseup"] = release;
			if (!Tools.isIE) compiled["mouseleave"] = release;
			compiled["touchleave"] = releaseTouch;
			compiled["touchend"] = releaseTouch;
			compiled["touchcancel"] = releaseTouch;
		}
	}
];

Tools.applyHooks = function (hooks, object) {
	//Apply every hooks on the object
	hooks.forEach(function (hook) {
		hook(object);
	});
};


// Utility functions

Tools.generateUID = function (prefix, suffix) {
	var uid = Date.now().toString(36); //Create the uids in chronological order
	uid += (Math.round(Math.random() * 36)).toString(36); //Add a random character at the end
	if (prefix) uid = prefix + uid;
	if (suffix) uid = uid + suffix;
	return uid;
};

Tools.createSVGElement = function createSVGElement(name, attrs) {
	var elem = document.createElementNS(Tools.svg.namespaceURI, name);
	if (typeof (attrs) !== "object") return elem;
	Object.keys(attrs).forEach(function (key, i) {
		elem.setAttributeNS(null, key, attrs[key]);
	});
	return elem;
};

Tools.getMarkerBoundingRect = function (el, r, m) {
	var marker = el.getAttributeNS(null, "marker-end");
	if (marker && marker.split("_")[0] == "url(#arrw") {

		var x = el.x1.baseVal.value;
		var x2 = el.x2.baseVal.value;
		var y = el.y1.baseVal.value;
		var y2 = el.y2.baseVal.value;

		var strokeWidth = (el.getAttributeNS(null, "stroke-width") || 0);

		var rad = Math.atan2(y2 - y, x2 - x);

		var l = 6 * strokeWidth;
		var h = 2 * strokeWidth;

		var p1 = [[l * Math.cos(rad) + x2], [l * Math.sin(rad) + y2], [1]];
		var p2 = [[h * Math.sin(rad) + x2], [h * Math.cos(rad) + y2], [1]];
		var p3 = [[-h * Math.sin(rad) + x2], [-h * Math.cos(rad) + y2], [1]];
		p1 = Tools.multiplyMatrices(m, p1);
		p2 = Tools.multiplyMatrices(m, p2);
		p3 = Tools.multiplyMatrices(m, p3);
		r.x = Math.min(p1[0][0], p2[0][0], p3[0][0]);
		r.y = Math.min(p1[1][0], p2[1][0], p3[1][0]);
		r.width = Math.max(p1[0][0], p2[0][0], p3[0][0]) - r.x;
		r.height = Math.max(p1[1][0], p2[1][0], p3[1][0]) - r.y;
		return true;
	} else {
		return false;
	}
};

Tools.adjustBox = function (el, r, m) {
	var strokeWidth = (el.getAttributeNS(null, "stroke-width") || 0) - 0;
	var mat = {
		a: m[0][0],
		b: m[1][0],
		c: m[0][1],
		d: m[1][1],
		e: 0,
		f: 0,
	}
	var result = Tools.decomposeMatrix(mat);
	var rot = result.rotation * Math.PI / 180;
	var xstroke = Math.hypot(Math.cos(rot) * result.scale[0], Math.sin(rot) * result.scale[1]) * strokeWidth * .6;
	var ystroke = Math.hypot(Math.cos(rot) * result.scale[1], Math.sin(rot) * result.scale[0]) * strokeWidth * .6;
	r.x -= xstroke;
	r.y -= ystroke;
	r.width += 2 * xstroke;
	r.height += 2 * ystroke;
};

Tools.composeRects = function (r, r2) {
	var x1 = Math.min(r.x, r2.x);
	var y1 = Math.min(r.y, r2.y);
	var x2 = Math.max(r.x + r.width, r2.x + r2.width);
	var y2 = Math.max(r.y + r.height, r2.y + r2.height);
	r.x = x1;
	r.y = y1;
	r.width = x2 - r.x;
	r.height = y2 - r.y
};

Tools.multiplyMatrices = function (m1, m2) {
	var result = [];
	for (var i = 0; i < m1.length; i++) {
		result[i] = [];
		for (var j = 0; j < m2[0].length; j++) {
			var sum = 0;
			for (var k = 0; k < m1[0].length; k++) {
				sum += m1[i][k] * m2[k][j];
			}
			result[i][j] = sum;
		}
	}
	return result;
};

Tools.decomposeMatrix = function (mat) {
	var a = mat.a;
	var b = mat.b;
	var c = mat.c;
	var d = mat.d;
	var e = mat.e;
	var f = mat.f;

	var delta = a * d - b * c;

	let result = {
		translation: [e, f],
		rotation: 0,
		scale: [0, 0],
		skew: [0, 0],
	};

	// Apply the QR-like decomposition.
	if (a != 0 || b != 0) {
		var r = Math.sqrt(a * a + b * b);
		result.rotation = b > 0 ? Math.acos(a / r) : -Math.acos(a / r);
		result.scale = [r, delta / r];
		result.skew = [Math.atan((a * c + b * d) / (r * r)), 0];
	} else if (c != 0 || d != 0) {
		var s = Math.sqrt(c * c + d * d);
		result.rotation =
			Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s));
		result.scale = [delta / s, s];
		result.skew = [0, Math.atan((a * c + b * d) / (s * s))];
	} else {
		// a = b = c = d = 0
	}
	result.rotation = result.rotation * 180 / Math.PI;
	result.skew[0] = result.skew[0] * 180 / Math.PI
	result.skew[1] = result.skew[1] * 180 / Math.PI
	return result;
};

Tools.positionElement = function (elem, x, y) {
	elem.style.top = y + "px";
	elem.style.left = x + "px";
};

Tools.color_chooser = document.getElementById("color-picker");

document.getElementById('color-picker').addEventListener("change", watchColorPicker, false);

Tools.setColor = function (color) {
	Tools.color_chooser.value = color;
	const presetsList = document.getElementsByClassName('color-preset-box');
	for (var node of presetsList) {
		node.classList.remove('selected-color');
	}
	const colorEl = document.querySelector('.color' + color.substring(1));
	if (colorEl) {
		colorEl.parentNode.classList.add('selected-color');
	}
	Tools.sendAnalytic('Color', 0)
};

Tools.getColor = (function color() {
	return function () {
		return Tools.color_chooser.value;
	};
})();

Tools.getCorrectorColor = (function correctorColor() {
	return function () {
		return Tools.svg.style.backgroundColor || '#ffffff';
	};
})();

function watchColorPicker(e) {
	// e.target.value
	colorMouseLeaveClose = true;
	const presetsList = document.getElementsByClassName('color-preset-box');
	for (var node of presetsList) {
		node.classList.remove('selected-color');
	}
	presetsList[0].classList.add('selected-color');
}

document.getElementById('color-picker-btn').addEventListener('pointerdown', function (e) {
	colorMouseLeaveClose = false;
	colorMouseLeaveClose = false;
	e.stopPropagation();
	document.addEventListener('pointerdown', function () {
		toolColorEl.classList.remove('opened');
		Tools.sendAnalytic('Color', 0)
	}, {once: true});
});

var colorMouseLeaveClose = true;

const toolColorEl = document.getElementById('color-tool');

toolColorEl.addEventListener('mouseenter', function () {
	toolColorEl.classList.add('opened');
});
toolColorEl.addEventListener('mouseleave', function () {
	if (!colorMouseLeaveClose) return;
	toolColorEl.classList.remove('opened');
});
toolColorEl.addEventListener('touchstart', function (e) {
	e.stopPropagation();
	document.getElementById('Tool-' + Tools.curTool.name).parentElement.classList.remove('opened');
	document.addEventListener('touchstart', function (e) {
		toolColorEl.classList.remove('opened');
	}, {once: true});
	toolColorEl.classList.add('opened');
});

for (var colorPreset of document.getElementsByClassName('color-preset')) {
	colorPreset.addEventListener('click', function (e) {
		if (e.target.tagName === 'DIV') {
			const presetsList = document.getElementsByClassName('color-preset-box');
			Tools.setColor(e.target.getAttribute('style').replace('background-color: ', '').replace(';', ''));
			for (var node of presetsList) {
				node.classList.remove('selected-color');
			}
			e.composedPath()[1].classList.add('selected-color');
			document.getElementById('color-tool').classList.remove('opened');
		}
	});
}

document.getElementsByClassName('repost-block')[0].addEventListener('click', () => {
	const copyPanel = document.getElementsByClassName('copy-link-panel')[0];
	if (copyPanel.classList.contains('hide')) {
		copyPanel.classList.remove('hide');
		const hideCopyPanel = function (e) {
			if (!copyPanel.contains(e.target)) {
				copyPanel.classList.add('hide');
				document.removeEventListener('mousedown', hideCopyPanel);
				document.removeEventListener('touchstart', hideCopyPanel);
			}
		}
		document.addEventListener('mousedown', hideCopyPanel);
		document.addEventListener('touchstart', hideCopyPanel);
		setTimeout(selectLink, 25);
		ym(67204918, 'reachGoal', 'invite_student');
	} else {
		copyPanel.classList.add('hide');
	}
});

document.getElementsByClassName('copy-link-icon')[0].addEventListener('click', selectLink);

function selectLink() {
	const r = new Range();
	const linkEl = document.getElementsByClassName('copy-link-link')[0];
	r.selectNodeContents(linkEl);
	document.getSelection().removeAllRanges();
	document.getSelection().addRange(r);
	navigator.clipboard.writeText(linkEl.innerText);
}

Tools.disableToolsEl = function (elementId) {
	document.getElementById(elementId).classList.add('disabled-icon');
}

Tools.enableToolsEl = function (elementId) {
	document.getElementById(elementId).classList.remove('disabled-icon');
}

Tools.setFontSize = (function () {
	const fontSizeValueEl = document.getElementById('fontSize-value');
	var fontSize = 17;

	document.getElementById('fontSize-up').addEventListener('pointerdown', function () {
		Tools.setFontSize(Tools.getFontSize() + 1);
	});

	document.getElementById('fontSize-down').addEventListener('pointerdown', function () {
		Tools.setFontSize(Tools.getFontSize() - 1);
	});

	return function (newFontSize) {
		if (newFontSize) {
			fontSize = newFontSize;
			fontSizeValueEl.innerText = newFontSize;
			Tools.list.Text.changeHandler();
		}
		return fontSize;
	}
})();

Tools.getFontSize = function () {
	return Tools.setFontSize();
}

Tools.getFontStyles = (function () {
	const fontSelectEl = document.getElementById('text-settings-select');
	const fontValueEl = document.getElementById('text-settings-value');
	fontSelectEl.addEventListener('pointerdown', function () {
		fontSelectEl.classList.toggle('text-settings-select-opened');
	});

	for (var listItemEl of document.getElementsByClassName('text-settings-list-item')) {
		listItemEl.addEventListener('pointerdown', function (e) {
			fontValueEl.setAttribute('style', e.target.getAttribute('style'));
			fontValueEl.innerText = e.target.innerText;
			Tools.list.Text.changeHandler();
		});
	}

	return function () {
		return fontValueEl.getAttribute('style');
	}
})();

Tools.sizeChangeHandlers = [];
Tools.setSize = (function size() {
	const chooser = document.getElementById("width-range");
	const sizeListElement = document.getElementById('width-list');
	const listAllItems = document.getElementsByClassName('width-item');
	sizeListElement.addEventListener('click', function (evt) {
		evt.stopPropagation();
		if (evt.target.classList.contains('width-item')) {
			for (var item of listAllItems) {
				item.classList.remove('selected-width');
			}
			evt.composedPath()[0].classList.add('selected-width');
			Tools.setSize(+evt.target.innerText);
		}
	});
	var debounceTimeout = null;
	function update() {
		var size = Math.max(1, Math.min(60, chooser.value | 0));
		chooser.value = size;
		for (var item of listAllItems) {
			item.classList.remove('selected-width');
			if (item.innerText == size) {
				item.classList.add('selected-width');
			}
		}
		clearTimeout(debounceTimeout)
		debounceTimeout = setTimeout(function () {
			Tools.sendAnalytic('Size', 0);
		}, 300)
		Tools.sizeChangeHandlers.forEach(function (handler) {
			handler(size);
		});
	}

	update();
	chooser.onchange = chooser.oninput = update;
	return function (value) {
		if (value !== null && value !== undefined) {
			chooser.value = value;
			update();
		}
		return parseInt(chooser.value);
	};
})();

const toolWidthEl = document.getElementById('width-tool');

toolWidthEl.addEventListener('mouseenter', function () {
	toolWidthEl.classList.add('opened');
});

toolWidthEl.addEventListener('mouseleave', function () {
	toolWidthEl.classList.remove('opened');
});
toolWidthEl.addEventListener('touchstart', function (e) {
	e.stopPropagation();
	document.getElementById('Tool-' + Tools.curTool.name).parentElement.classList.remove('opened');
	document.addEventListener('touchstart', function (e) {
		toolWidthEl.classList.remove('opened');
	}, {once: true});
	toolWidthEl.classList.add('opened');
});

Tools.getSize = (function () {
	return Tools.setSize()
});

Tools.getOpacity = function () {
	return 1;
}

Tools.deleteForTouches = function (evt, id) {
	if (evt.touches && evt.touches.length > 1) {
		if (id) {
			const msg = {
				"type": "delete",
				"id": id,
				"sendBack": false,
			};
			Tools.drawAndSend(msg, Tools.list.Eraser);
		}
		return true;
	}
	return false;
}

// Undo/Redo tools

Tools.undo = (function () {
	const el = document.getElementById("undo");

	function update() {
		if (Tools.history.length) {
			Tools.sendAnalytic('History', 0);
			const action = Tools.history.pop();
			if (Tools.history.length === 0) {
				Tools.disableToolsEl('undo');
			}
			var instrument = null;
			switch (action.type) {
				case "array":
					if (action.events[0].type === 'delete') {
						instrument = Tools.list.Eraser;
						action.sendBack = true;
						action.sendToRedo = true;
						Tools.drawAndSend(action, instrument);
					} else if (action.events[0].type === 'update') {
						const dataForRedo = { type: 'array', events: [] };
						action.events.forEach(function (event) {
							const el = document.getElementById(event.id);
							dataForRedo.events.push({
								type: 'update',
								id: event.id,
								transform: el.style.transform,
								transformOrigin: el.style.transformOrigin
							});
						});
						Tools.historyRedo.push(dataForRedo);
						instrument = Tools.list.Transform;
						Tools.drawAndSend(action, instrument);
					} else {
						const dataForRedo = { type: 'array', events: [] };
						action.events.forEach(function (event) {
							event.sendBack = true;
							dataForRedo.events.push({ type: 'delete', id: event.id });
							if (event.tool === 'Pencil') {
								_drawLine(event);
							} else {
								Tools.drawAndSend(event, Tools.list[event.tool]);
							}
						});
						Tools.historyRedo.push(dataForRedo);
					}
					break;
				case "line":
					_drawLine(action);
					Tools.historyRedo.push({type: "delete", id: action.id});
					break;
				case "delete":
					instrument = Tools.list.Eraser;
					// Tools.list.Transform.checkAndDisable(action.id);
					action.sendBack = true;
					action.sendToRedo = true;
					break;
				case "update":
					const transformEl = document.getElementById(action.id)
					const propertiesForSend = ['style'];
					var msg = {type: "update", _children: [], id: transformEl.id, properties: []};
					for (var i = 0; i < propertiesForSend.length; i++) {
						if (transformEl.hasAttribute(propertiesForSend[i])) {
							msg.properties.push([propertiesForSend[i], transformEl.getAttribute(propertiesForSend[i])]);
						}
					}
					Tools.historyRedo.push(msg);
					instrument = Tools.list.Transform;
					break;
				default:
					instrument = Tools.list[action.tool];
					Tools.historyRedo.push({type: "delete", id: action.id});
					break;
			}
			if (action.type !== "line" && action.type !== "array") {
				Tools.drawAndSend(action, instrument);
			}
			Tools.enableToolsEl('redo');
		}
	}

	el.onclick = update;
	return function () {
		update();
	}
})();

Tools.redo = (function () {
	const el = document.getElementById("redo");

	function update() {
		if (Tools.historyRedo.length) {
			Tools.sendAnalytic('History', 1);
			const action = Tools.historyRedo.pop();
			if (Tools.historyRedo.length === 0) {
				Tools.disableToolsEl('redo');
			}
			var instrument = null;
			action.sendBack = true;
			switch (action.type) {
				case "array":
					if (action.events[0].type === 'delete') {
						instrument = Tools.list.Eraser;
						action.sendBack = true;
						Tools.drawAndSend(action, instrument);
					} else if (action.events[0].type === 'update') {
						const dataForUndo = { type: 'array', events: [] };
						action.events.forEach(function (event) {
							const el = document.getElementById(event.id);
							dataForUndo.events.push({
								type: 'update',
								id: event.id,
								transform: el.style.transform,
								transformOrigin: el.style.transformOrigin
							});
						});
						Tools.history.push(dataForUndo);
						instrument = Tools.list.Transform;
						Tools.drawAndSend(action, instrument);
					} else {
						const dataForUndo = { type: 'array', events: [] };
						action.events.forEach(function (event) {
							event.sendBack = true;
							dataForUndo.events.push({ type: 'delete', id: event.id });
							if (event.tool === 'Pencil') {
								_drawLine(event);
							} else {
								Tools.drawAndSend(event, Tools.list[event.tool]);
							}
						});
						Tools.history.push(dataForUndo);
					}
					break;
				case "line":
					_drawLine(action);
					Tools.history.push({type: "delete", id: action.id});
					break;
				case "delete":
					instrument = Tools.list.Eraser;
					// Tools.list.Transform.checkAndDisable(action.id);
					action.sendBack = true;
					break;
				case "update":
					const transformEl = document.getElementById(action.id)
					const propertiesForSend = ['style'];
					var msg = {type: "update", _children: [], id: transformEl.id, properties: []};
					for (var i = 0; i < propertiesForSend.length; i++) {
						if (transformEl.hasAttribute(propertiesForSend[i])) {
							msg.properties.push([propertiesForSend[i], transformEl.getAttribute(propertiesForSend[i])]);
						}
					}
					Tools.history.push(msg);
					instrument = Tools.list.Transform;
					break;
				default:
					instrument = Tools.list[action.tool];
					Tools.history.push({type: "delete", id: action.id});
					break;
			}
			if (action.type !== "line" && action.type !== "array") {
				Tools.drawAndSend(action, instrument);
			}
			Tools.enableToolsEl('undo');
		}
	}

	el.onclick = update;
	return function () {
		update();
	}
})();

function _drawLine(action) {
	Tools.drawAndSend({
		'type': 'line',
		'id': action.id,
		'color': action.color,
		'size': action.size,
		'opacity': action.opacity,
		'dotted': action.dotted,
		'properties': action.properties,
		'transform': action.transform,
		'transformOrigin': action.transformOrigin,
	}, Tools.list.Pencil);
	if (action.properties === undefined || action.properties.length === 0) {
		for (var child of action._children) {
			Tools.drawAndSend({
				'type': 'child',
				'parent': action.id,
				'tool': 'Pencil',
				'x': child.x,
				'y': child.y,
			}, Tools.list.Pencil);
		}
	}
}

Tools.history = [];
Tools.historyRedo = [];

Tools.addActionToHistory = function (data, dontClear) {
	Tools.enableToolsEl('undo');
	if (Tools.history.length === 20) {
		Tools.history.shift();
	}
	const clear = dontClear || false;
	if (!clear) {
		Tools.disableToolsEl('redo');
		Tools.historyRedo.splice(0, Tools.historyRedo.length);
	}
	Tools.history.push(data);
}

//Scale the canvas on load
Tools.svg.width.baseVal.value = document.body.clientWidth;
Tools.svg.height.baseVal.value = document.body.clientHeight;

/**
 What does a "tool" object look like?
 newtool = {
 	"name" : "SuperTool",
 	"listeners" : {
 		"press" : function(x,y,evt){...},
 		"move" : function(x,y,evt){...},
  		"release" : function(x,y,evt){...},
 	},
 	"draw" : function(data, isLocal){
 		//Print the data on Tools.svg
 	},
 	"onstart" : function(oldTool){...},
 	"onquit" : function(newTool){...},
 	"stylesheet" : "style.css",
}
 */
