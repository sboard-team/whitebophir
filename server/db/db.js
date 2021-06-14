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
    // log('updateBoard')
    // log('updateBoard', board, boardName)
    const collection = db.collection('boards');
    await collection.updateOne({ name: boardName }, {$set: { board: board }}, {upsert: false});
    //log('db.board updated', { 'boardName': boardName });
}

/** Обновляет доску **/
async function addDataToBoard(boardName, id, data) {
    console.log('addDataToBoard', id, data)
    const collection = db.collection('boardData');
    await collection.updateOne({ name: boardName, 'id': id }, {$set: { data: data }}, {upsert: true});
    console.log('addDataToBoard added')
}

/** Обновляет доску **/
async function updateBoardData(boardName, id, data) {
    console.log('updateBoardData', id, data)
    const collection = db.collection('boardData');
    await collection.updateOne({ name: boardName, 'id': id }, {$set: { data: data }}, {upsert: false});
    console.log('updateBoardData updated')
}

async function createBoard(boardName) {
    log('createBoard', boardName)

    const collection = db.collection('boards');
    await collection.updateOne({ name: boardName }, {$set: { board: {} }}, {upsert: true});
    log('db.board created', { 'boardName': boardName });
}

/** Удаляет доску по имени **/
async function deleteBoard(boardName) {
    log('deleteBoard', boardName)

    const collection = db.collection('boards');
    await collection.deleteOne({ name: boardName }, true);
    log('db.board deleted', { 'boardName': boardName });
}
//todo delete
async function clearBoard(boardName) {
    log('clearBoard', boardName)

    const collection = db.collection('boards');
    log('clearBoard collection', collection)

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

/** Получает доску по имени, если такой доски не существует возвращает null **/
async function getBoardData(boardName) {
    const collection = db.collection('boardData');

    let result = await collection.find({name: boardName}).toArray();

    for(id in result) {
        delete result[id]._id;
    }

    return result
}

/** Получает доску по имени, если такой доски не существует возвращает null **/
async function deleteBoardData(id) {
    const collection = db.collection('boardData');

    collection.remove({id: id});
}

async function deleteAllBoardData(boardName) {
    const collection = db.collection('boardData');

    collection.remove({name: boardName});
}

module.exports = {
    updateBoard,
    createBoard,
    deleteBoard,
    clearBoard,
    boardExists,
    getBoard,
    addDataToBoard,
    updateBoardData,
    getBoardData,
    deleteBoardData,
    deleteAllBoardData,
};