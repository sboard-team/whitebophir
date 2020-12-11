var log = require("../log.js").log;

const MongoClient = require('mongodb').MongoClient;

var db;

MongoClient.connect(process.env.DB_CONN, {
	connectTimeoutMS: 30000,
	//autoReconnect: true,
	//reconnectTries: 30,
	//reconnectInterval: 1000,
	keepAlive: true,
	keepAliveInitialDelay: 30000,
	minPoolSize: 1,
	maxPoolSize: 30,
	minSize: 1,
	poolSize: 20,
	useUnifiedTopology: true,
	raw: false,
	socketTimeoutMS: 360000
}, function (err, database) {
	if (err) throw err;

	db = database.db("boardsdb");

	console.log("DB activated");
});

/** Обновляет доску **/
async function updateBoard(boardName, board) {
    const collection = db.collection('boards');
    await collection.updateOne({ name: boardName }, {$set: { board: board }}, {upsert: false});
    log('db.board updated', { 'boardName': boardName });
}

async function createBoard(boardName) {
    const collection = db.collection('boards');
    await collection.updateOne({ name: boardName }, {$set: { board: {} }}, {upsert: true});
    log('db.board created', { 'boardName': boardName });
}

/** Удаляет доску по имени **/
async function deleteBoard(boardName) {
    const collection = db.collection('boards');
    await collection.deleteOne({ name: boardName }, true);
    log('db.board deleted', { 'boardName': boardName });
}

async function clearBoard(boardName) {
    const collection = db.collection('boards');
    await collection.deleteOne({ name: boardName }, true);
    await collection.updateOne({ name: boardName }, {$set: { board: {} }}, {upsert: true});
    log('db.board cleared', { 'boardName': boardName });
}

async function boardExists(boardName) {
    const collection = db.collection('boards');
    const result = await collection.findOne({ name: boardName });
    log('db.board check', { 'boardName': boardName, 'exists': result !== null });
    return result !== null;
}

/** Получает доску по имени, если такой доски не существует возвращает null **/
async function getBoard(boardName) {
    const collection = db.collection('boards');
    const result = await collection.findOne({ name: boardName });
    if (result) {
        delete result._id;
    }
    return result;
}

module.exports = {
    updateBoard,
    createBoard,
    deleteBoard,
    clearBoard,
    boardExists,
    getBoard
};