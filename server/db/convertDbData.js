// var log = require("../log.js").log;
//
// const MongoClient = require('mongodb').MongoClient;
//
// var db;
//
// MongoClient.connect(process.env.OLDDB_CONN, {
//     connectTimeoutMS: 30000,
//     keepAlive: true,
//     keepAliveInitialDelay: 30000,
//     minPoolSize: 1,
//     maxPoolSize: 30,
//     minSize: 1,
//     poolSize: 20,
//     useUnifiedTopology: true,
//     raw: false,
//     socketTimeoutMS: 360000
// }, function (err, database) {
//     if (err) throw err;
//
//     db = database.db("boardsdb");
//
//     console.log("DB activated");
// });
//
// var newDb;
//
// MongoClient.connect(process.env.NEWDB_CONN, {
//     connectTimeoutMS: 30000,
//     //autoReconnect: true,
//     //reconnectTries: 30,
//     //reconnectInterval: 1000,
//     keepAlive: true,
//     keepAliveInitialDelay: 30000,
//     minPoolSize: 1,
//     maxPoolSize: 30,
//     minSize: 1,
//     poolSize: 20,
//     useUnifiedTopology: true,
//     raw: false,
//     socketTimeoutMS: 360000
// }, function (err, database) {
//     if (err) throw err;
//
//     newDb = database.db("boardsdb");
//
//     console.log("new DB activated");
// });
//
// /** Обновляет доску **/
// async function updateBoard(boardName, board) {
//     const collection = db.collection('boards');
//     await collection.updateOne({ name: boardName }, {$set: { board: board }}, {upsert: false});
// }
//
// /** Обновляет доску **/
// async function updateBoardInNewDB(boardName, board) {
//     const collection = newDb.collection('boards');
//     await collection.updateOne({ name: boardName }, {$set: { board: board }}, {upsert: true});
// }
//
// /** Обновляет доску **/
// async function addDataToNewBoard(boardName, id, data) {
//     const collection = newDb.collection('boardData');
//     await collection.updateOne({ name: boardName, 'id': id }, {$set: { data: data }}, {upsert: true});
// }
//
// async function setIsConverted(boardName) {
//     const collection = db.collection('boards');
//     await collection.updateOne({ name: boardName }, {$set: { isConverted: true }}, {upsert: true});
// }
//
// async function convert() {
//     const boardsCollection = db.collection('boards');
//     let boards = await boardsCollection.find({isConverted: { $ne: true }}).toArray()
//
//     const newBoardsCollection = newDb.collection('boards');
//
//     for (id in boards) {
//         let board = boards[id];
//         await updateBoardInNewDB(board.name, {})
//         for (boardDataIndex in board.board) {
//             await addDataToNewBoard(board.name, board.board[boardDataIndex].id, board.board[boardDataIndex])
//         }
//
//         await setIsConverted(board.name)
//
//         console.log('converted', id)
//     }
//
//     console.log('end convert')
// }
//
//
//
// // setTimeout(function () {
// // 	convertDbData.convert()
// // }, 5000)
//
// module.exports = {
//     convert
// };