import mongoose = require('mongoose');
const Schema = mongoose.Schema;

/** @class SyncLogItem */
let SyncLogItemSchema = new Schema({
    name: { type: String },
    localPath: { type: String },
    remotePath: { type: String },
    date: { type: Date, default: Date.now }
});


let SyncLogItem = mongoose.model('SyncLogItem', SyncLogItemSchema);

module.exports = SyncLogItem;