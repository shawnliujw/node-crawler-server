var jobqueue = require("./lib/jobqueue");
var logger = require("log4js").getLogger("app.js");
var Promise = require("bluebird");
var config = require("config");
var casper = require("./lib/server");
var db = require('mongo-bluebird').create(config.scrapecache.db);
var Server = function() {
	this.promise = casper.setUp();
};
Server.prototype.scrape = function(pages, type, expiration) {
	return this.promise.then(function() {
		if (!Array.isArray(pages)) {
			pages = [pages];
		}
		var urls = new Array();
		pages.forEach(function(page) {
			urls.push(page.url);
		});
		expiration = (typeof expiration !== 'number') ? config.scrapecache.validity : expiration;
		return new Promise(function(resolve, reject) {
			var cachedResults = [];
			var now = new Date();
			now.setHours(now.getHours() - expiration); // subtract expiration to current time to calculate validity
			// Drop outdated cache
			var cacheCollection = db.collection(type);
			return cacheCollection.remove({url: {$in: urls}, time: {$lt: now}})
					.then(function() {
						// Find cached results
						return cacheCollection.find({url: {$in: urls}, time: {$gt: now}}).then(function(items) {
							for (var i in items) {
								items[i].cached = true;
								cachedResults.push(items[i]);

								var inx = urls.indexOf(items[i].url);
								if (inx > -1) {
									urls.splice(inx, 1);
								}
							}
							// No URLs to process. All results are cached and up-to-date.
							if (!urls.length) {
								resolve({status: true, message: '', results: cachedResults});
							} else {
								return _scrape(_filterPages(pages, urls), type).then(function(result) {
									if (result && result.results) {
										for (var i in result.results) {
											result.results[i].time = new Date();
										}
										cacheCollection.insert(result.results).then(function() {
											var allResults = cachedResults.concat(result.results);
											result.results = allResults;
											resolve(result);
										});
									} else {
										resolve(result);
									}
								});
							}
						});
					});
		});
	});


};
Server.prototype.clearCache = function(type,urls) {
	return db.collection(type).remove({url: {$in: urls}});
};
module.exports = new Server();


function _scrape(pages, type) {
	try {
		pages.forEach(function(element) {
			element.method = type;
		});
		logger.info("");
		logger.info("processing " + pages.length + " URLs with method " + type);
		if (pages.length > 0) {
			return jobqueue.post(pages);
		} else {
			return Promise.resolve({
				status: false,
				"message": "Nothing to do"
			});
		}
	} catch (e) {
		logger.error(e);
		return Promise.resolve({
			"status": false,
			"message": e.message
		});
	}
}
function _filterPages(pages, urls) {
	return pages.filter(function(page) {
		var url = page.url;
		return urls.some(function(newUrl) {
			return url === newUrl;
		});
	});
}