const path = require("path");
const app_root = path.dirname(__dirname); // Parent of the directory where this file is

const envFie = path.resolve(__dirname, '../.env');
require('dotenv').config({path: envFie});

module.exports = {
    /** Port on which the application will listen */
    PORT: parseInt(process.env['PORT']) || 8080,

    /** Секретный путь для хендлера создания доски */
    CREATE_KEY: process.env['CREATE_KEY'] || 's7Jvva3mleIV',

    /** For development */
    DEV_MODE: parseInt(process.env['DEV_MODE']) || 0,

    /** URL for PDF */
    PDF_URL: process.env['PDF_URL'],

    /** URL for API */
    API_URL: process.env['API_URL'],

    /** URL for API */
    LANDING_URL: process.env['LANDING_URL'] || '#',

    /** URL for cabinet */
    CABINET_URL: process.env['CABINET_URL'] || '#',

    /** Path to the directory where boards will be saved by default */
    HISTORY_DIR: process.env['WBO_HISTORY_DIR'] || path.join(app_root, "server-data"),

    /** Folder from which static files will be served */
    WEBROOT: process.env['WBO_WEBROOT'] || path.join(app_root, "client-data"),

    /** Number of milliseconds of inactivity after which the board should be saved to a file */
    SAVE_INTERVAL: parseInt(process.env['WBO_SAVE_INTERVAL']) || 1000 * 2, // Save after 2 seconds of inactivity

    /** Periodicity at which the board should be saved when it is being actively used (milliseconds)  */
    MAX_SAVE_DELAY: parseInt(process.env['WBO_MAX_SAVE_DELAY']) || 1000 * 60, // Save after 60 seconds even if there is still activity

    /** Maximal number of items to keep in the board. When there are more items, the oldest ones are deleted */
    MAX_ITEM_COUNT: parseInt(process.env['WBO_MAX_ITEM_COUNT']) || 32768,

    /** Max number of sub-items in an item. This prevents flooding */
    MAX_CHILDREN: parseInt(process.env['WBO_MAX_CHILDREN']) || 512,

    /** Maximum value for x on the board */
    MAX_BOARD_SIZE_X: parseInt(process.env['WBO_MAX_BOARD_SIZE_X']) || 2048,

    /** Maximum value for y on the board */
    MAX_BOARD_SIZE_Y: parseInt(process.env['WBO_MAX_BOARD_SIZE_Y']) || 65536,

    /** Maximum messages per user over the given time period before banning them  */
    MAX_EMIT_COUNT: parseInt(process.env['WBO_MAX_EMIT_COUNT']) || 256,

    /** Duration after which the emit count is reset in miliseconds */
    MAX_EMIT_COUNT_PERIOD: parseInt(process.env['WBO_MAX_EMIT_COUNT_PERIOD']) || 1000,

    /** Blocked Tools. A comma-separated list of tools that should not appear on boards. */
    BLOCKED_TOOLS: (process.env['WBO_BLOCKED_TOOLS'] || "").split(','),

    /** Minimal line width on selector size for draw*/
    MINIMAL_LINE_WIDTH: 5,

    /** Maximum line width on selector size for draw*/
    MAX_LINE_WIDTH: 50,

    STATIC_VERSION: parseInt(process.env['STATIC_VERSION']) || 1,

    /** Maximum size of uploaded documents default 5MB */
    MAX_DOCUMENT_SIZE: parseInt(process.env['WBO_MAX_DOCUMENT_SIZE']) || 1048576 * 5,

    TIME_BEFORE_CLOSE: parseInt(process.env['TIME_BEFORE_CLOSE'] || 120),

    FEATURES_CURSORS: parseInt(process.env['WBO_FEATURES_CURSORS'] || 1),

};
