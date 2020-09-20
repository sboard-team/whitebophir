(function () {
    const mobileWindowEl = document.getElementById('mobileWindowRect');
    var resetTimeoutID = null;
    if (Tools.isMobile()) {
        const message = {
            type: "update",
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };

        setInterval(function () {
            const windowWidth = window.innerWidth / Tools.getScale();
            message.x = Math.max(document.documentElement.scrollLeft / Tools.getScale() >> 0, 5);
            message.y = Math.max(document.documentElement.scrollTop / Tools.getScale() >> 0, 5);
            message.width = (windowWidth > Tools.server_config.MAX_BOARD_SIZE_X ? Tools.server_config.MAX_BOARD_SIZE_X - 10 : windowWidth) >> 0;
            message.height = window.innerHeight / Tools.getScale() >> 0;
            // console.log(message);
            Tools.send(message, 'tabletMode');
        }, 500);
    }

    function resetMobileWindowEl() {
        mobileWindowEl.setAttribute('x', 0);
        mobileWindowEl.setAttribute('y', 0);
        mobileWindowEl.setAttribute('width', 0);
        mobileWindowEl.setAttribute('height', 0);
    }

    function draw(data) {
        mobileWindowEl.setAttribute('x', data.x);
        mobileWindowEl.setAttribute('y', data.y);
        mobileWindowEl.setAttribute('width', data.width);
        mobileWindowEl.setAttribute('height', data.height);
        clearTimeout(resetTimeoutID);
        resetTimeoutID = setTimeout(resetMobileWindowEl, 3000);
    }

    var cursorTool = {
        "name": "tabletMode",
        "draw": draw,
    };
    Tools.register(cursorTool);
})();