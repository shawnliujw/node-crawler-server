var logger = require("log4js").getLogger("app/lib/jobqueue.js");
var Promise = require("bluebird");
var config = require("config");
var async = require("async");
var request = require("request");
var jobs = [];
var processing = false;
var jobChunkSize = config.jobQueue.chunkSize;
var _requestId = 1;
var _requests = {};
var casperServer = require("./server");

function Request(pages, resolve) {
	this.id = "r." + _requestId++;
	this.pages = pages;
	this.pages.forEach(function(el) {
		el.reqid = this.id;
	}.bind(this));

	this.response = {
		status: true,
		results: []
	};
	this.resolve = resolve;
}

Request.prototype.appendResults = function(data) {
	this.response.results = this.response.results.concat(data);
	if (this.response.results.length === this.pages.length) {
		this.resolve(this.response);
		delete _requests[this.id];
	}
};

Request.prototype.abort = function(err) {
	this.response.status = false;
	this.response.message = err;
	this.resolve(this.response);
	delete _requests[this.id];
};

function _getPostServer() {
	var port = casperPorts.shift();
	casperPorts.push(port);
	return "http://localhost:" + port + "/scrape";
}

exports.post = function(pages) {

	return casperServer.retrive()
			.then(function(port) {
				logger.info("Process request on port:"+port);
				var postUrl = "http://localhost:"+port+"/scrape";
				var ret = new Promise(function(resolve, reject) {
					var req = new Request(pages, resolve);
					logger.info("Request " + req.id + " created for " + pages.length + " urls");
					_requests[req.id] = req;
				});

				jobs.push.apply(jobs, pages);
				logger.info(pages.length + ' new job(s) added to job queue.  total=' + jobs.length);

				if (!processing) {
					processing = true;
					logger.info('Resuming job queue processing');

					async.until(
							function() {
								return jobs.length === 0;
							},
							function(callback) {
								var options = {
									"url": postUrl,
									method: 'POST',
									headers: {
										'Content-type': 'application/json',
										"charset": "utf-8"
									},
									timeout: config.casper.timeout // 2 minutes
								};

								// Splice urls into chunks of 5 links without mixing 2 requests
								var jobChunk = [];
								var first = jobs.shift();
								jobChunk.push(first);
								do {
									if (jobs.length && jobs[0].reqid === first.reqid) {
										jobChunk.push(jobs.shift());
									} else {
										break;
									}
								} while (jobChunk.length < jobChunkSize);

								options.json = jobChunk;
								options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.json));

								logger.info('Starting request ' + first.reqid + ' for ' + options.json.length + ' links...');
								request.post(options, function(err, res, data) {
									if (err) {
										logger.error("Failed to scrape pages with err - aborting request " + first.reqid + " - ", err);
										_requests[first.reqid].abort(err);

									} else {
										logger.info("scraped " + ((data.results && data.results.length) || 0) + " pages for request " + first.reqid);
										if (data.hasOwnProperty('results')) {
											_requests[first.reqid].appendResults(data.results);
										}

										callback();
									}
								}).on('error', function(e) {
									//notice, the request may has been aboured in line 93, need research.
									if (_requests[first.reqid]) {
										logger.error("Failed to scrape products on error - aborting request " + first.reqid + " - ", e);
										_requests[first.reqid].abort(e.message);
									} else {
										logger.info(first.reqid + " has been aborted.");
									}
								});
							},
							function() {
								processing = false;
								logger.info('Job queue is now empty');
							}
					);

				}

				return ret;
			})
			.catch(function(err){
				logger.error("Failed to get casper server instance");
				return Promise.reject();
			});


};