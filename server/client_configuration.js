const config = require("./configuration");

/** Settings that should be handed through to the clients  */
module.exports = {
    "MAX_BOARD_SIZE_X": config.MAX_BOARD_SIZE_X,
    "MAX_BOARD_SIZE_Y": config.MAX_BOARD_SIZE_Y,
    "MAX_EMIT_COUNT": config.MAX_EMIT_COUNT,
    "MAX_EMIT_COUNT_PERIOD": config.MAX_EMIT_COUNT_PERIOD,
    "BLOCKED_TOOLS": config.BLOCKED_TOOLS,
    "DEV_MODE": config.DEV_MODE,
    "API_URL": config.API_URL,
    "CABINET_URL": config.CABINET_URL,
    "PDF_URL": config.PDF_URL,
    "LANDING_URL": config.LANDING_URL,
    "MINIMAL_LINE_WIDTH": config.MINIMAL_LINE_WIDTH,
    "MAX_LINE_WIDTH": config.MAX_LINE_WIDTH,
    "MAX_DOCUMENT_SIZE": config.MAX_DOCUMENT_SIZE,
    "TIME_BEFORE_CLOSE": config.TIME_BEFORE_CLOSE,
    "FEATURES_CURSORS": config.FEATURES_CURSORS === 1,
};