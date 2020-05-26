const mongo = require("mongodb");
let config = require('./config');

var db_instance = async function () {
    let client = await mongo.MongoClient.connect(config.db_path, { useNewUrlParser: true });

    return client;
}

module.exports = db_instance;