var logger = require("log4js").getLogger("util/mongo.js");
var settings = require("config").scrapecache.db;
var db = require("mongo-bluebird").create({
	db: settings.db,
	host: settings.host,
	port: settings.port
});

exports.remove = function(collectionName, query) {
	return db.collection(collectionName).remove(query);
};

exports.insert = function(collectionName, data) {
	return db.collection(collectionName).insert(data);
};

exports.update = function(collectionName, query, data) {
	return db.collection(collectionName).update(query, data);
};

exports.find = function(collectionName, query) {
	query = query || {};
	return db.collection(collectionName).find(query);
};