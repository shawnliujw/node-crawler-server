/* jshint expr: true */
var sinon = require('sinon');
var expect = require("chai").expect;
var clearCache = require('../..//lib/server').clearCache;
var config = require("config");
var Promise = require('bluebird');
var db = require('mongo-bluebird').create(config.scrapecache.db);

describe('clearCache', function() {
	var stubs;
	var detailsCol = db.collection('details');
	var linksCol = db.collection('search');

	beforeEach(function () {
		detailsCol.remove({});
	});
	
	function getScript() {
		return Promise.resolve([
				{
					script: 'path/to/script1',
					url: 'url1',
					status: true
				},
				{
					script: 'path/to/script3',
					url: 'url3',
					status: true
				}
			]) 
	};

	afterEach(function () {
		stubs.forEach(function(stub) {
			stub.restore();
		});
	});

	after(function () {
		detailsCol.remove({});
		linksCol.remove({});
	});

	it('removes matched details from db', function (done) {
		detailsCol.insert([{
			url: 'url1',
			script: 'script1',
		},{
			url: 'url2',
			script: 'script2'
		},{
			url: 'url3',
			script: 'script3'
		}])
			.then (function () {
				return clearCache('details', ['url1', 'url2', 'url3'], 'en_gb', 'amazon.com');
			}).then(function () {
				return detailsCol.find()
					.then(function (details) {
						expect(details).to.have.length(1);
						expect(details[0].url).to.equal('url2');
					});
			}).then(done, done);
	});

	it('removes matched links from db', function (done) {
		linksCol.insert([{
			url: 'url1',
			script: 'script1',
		},{
			url: 'url2',
			script: 'script2'
		},{
			url: 'url3',
			script: 'script3'
		}])
			.then (function () {
				return clearCache('links', ['url1', 'url2', 'url3'], 'en_gb', 'amazon.com');
			}).then(function () {
				return linksCol.find()
					.then(function (details) {
						expect(details).to.have.length(1);
						expect(details[0].url).to.equal('url2');
					});
			}).then(done, done);
	});
});

describe("scrape information",function(){
	
});
