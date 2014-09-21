var path = require("path");
process.env.NODE_CONFIG_DIR = path.join(__dirname, "../config");
var expect = require("chai").expect;
var casperServer = require("../main");
var config = require("config");
var Promise = require('bluebird');
var db = require('mongo-bluebird').create(config.scrapecache.db);
describe('clearCache', function() {
	var stubs;
	var detailsCol = db.collection('test1');
	var linksCol = db.collection('test2');

	beforeEach(function() {
		detailsCol.remove({});
		linksCol.remove({});
	});

	afterEach(function() {
		detailsCol.remove({});
		linksCol.remove({});
	});

	it('removes matched test1 from db', function(done) {
		detailsCol.insert([{
				url: 'url1',
				script: 'script1',
			}, {
				url: 'url2',
				script: 'script2'
			}, {
				url: 'url3',
				script: 'script3'
			}])
				.then(function() {
					return casperServer.clearCache('test1', ['url1']);
				}).then(function() {
			return detailsCol.find({})
					.then(function(details) {
						expect(details).to.have.length(2);
						expect(details[0].url).to.equal('url2');
					});
		}).then(done, done);
	});

	it('removes matched test2 from db', function(done) {
		linksCol.insert([{
				url: 'url1',
				script: 'script1',
			}, {
				url: 'url2',
				script: 'script2'
			}, {
				url: 'url3',
				script: 'script3'
			}])
				.then(function() {
					return casperServer.clearCache('test2', ['url1']);
				}).then(function() {
			return linksCol.find()
					.then(function(details) {
						expect(details).to.have.length(2);
						expect(details[0].url).to.equal('url2');
					});
		}).then(done, done);
	});
});

describe("scrape information", function() {
	var productUrl = "http://www.superdrug.com/haircare-oils/argania-hair-oil-giftset/invt/845458&bklist=";
	var searchUrl = "http://www.superdrug.com/search?q=oil&searchsubmit=Search&setpagenum=1&perpage=24";
	var scriptFile = path.join(__dirname, "./superdrug.com.js");

	var detailsCol = db.collection('details');
	var linksCol = db.collection('links');

	after(function() {
		casperServer.clearCache('details', [productUrl]);
		casperServer.clearCache('search', [searchUrl]);
		casperServer.release();
	});
	it.only("scrape product details", function(done) {
		var page = {
			"url": productUrl,
			"script": scriptFile
		};
		casperServer.scrape(page, "details", 0)
				.then(function(res) {
					console.log(res);
					expect(res).to.have.property("results");
					expect(res.results).to.have.length(1);
				}).then(function() {
					return detailsCol.find({url: {$in: [productUrl]}});
				}).then(function(res) {
					expect(res).to.have.length(1);
				}).then(done, done);
	});
});
