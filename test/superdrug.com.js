
exports.details = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible(".prod-details .pricing .now", function() {
		try {
			var price = this.fetchText("#content-wrapper .prod-details .pricing .now");
			if (price) {
				json.price_now = price;
				json.stock = 'in-stock';
				json.status = true;
				json.image = "http://www.superdrug.com" + this.getElementAttribute("#content-wrapper .main-thumb img", "src");
				json.title = this.fetchText("#content-wrapper .prod-details .left > h2");
				json.description = this.getHTML("#producttabs .desc");
				price = this.fetchText("#content-wrapper .prod-details .pricing .was");
				if (price) {
					json.price_was = price;
				}

				var offerText = this.fetchText("#content-wrapper .prod-details .promotion .offer2 ");
				if (offerText) {
					json.offer = offerText;
				} else {
					offerText = this.fetchText("#content #productdetail .desc .promotion .promotext a");
					if (offerText) {
						json.offer = offerText;
					}
				}
			} else {
				json.message = "price error";
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function onTimeout() {
		var selector = '#content-wrapper .page-title';
		if (casper.exists(selector) && casper.fetchText(selector).indexOf("No Results") !== -1) {
			json.status = true;
			json.stock = "notfound";
		} else {
			json.message = "Wait timeout for selector '.prod-details .pricing .now'";
		}
		callback(json);
	}, timeout);
};


exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		var currentUrl = casper.getCurrentUrl();
		if (currentUrl.indexOf("singleResultSearchPage=true") !== -1) {
			fetchSingleResult(casper, json, timeout, callback);
		} else {
			fetchMultiplyResults(casper, json, timeout, callback);
		}

	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};

function fetchMultiplyResults(casper, json, timeout, callback) {
	casper.waitUntilVisible("#product-tiles", function() {
		json.products = casper.evaluate(function() {
			var nodes = document.querySelectorAll("#product-tiles .productgroup .details a");
			var temp = [];
			for (var i = 0; i < nodes.length; i++) {
				temp.push({
					"name": nodes[i].innerText,
					"url": nodes[i].href
				});
			}
			return temp;
		});
		json.status = true;
		callback(json);
	}, function() {
		var noResult = false;
		try {
			var titles = casper.getElementsInfo("#right-col h1");
			for (var i = 0; i < titles.length; i++) {
				if (titles.text && title.text.toLowerCase().indexOf("no result") >= 0) {
					noResult = true;
					break;
				}
			}
		} catch(e) {
			// fall through
		}

		if (noResult) {
			json.products = [];
			json.status = true;
		} else {
			json.status = false;
			json.message = "no elements could be used to derive data from the page.";
		}

		callback(json);

	}, timeout);
}

function fetchSingleResult(casper, json, timeout, callback) {
	casper.waitUntilVisible(".prod-details .preSep h2", function() {
		json.products = [{
				"name": casper.fetchText(".prod-details .preSep h2"),
				"url": casper.getCurrentUrl().replace("?singleResultSearchPage=true", "")
			}];
		json.status = true;
		callback(json);
	}, function() {
		json.message = "This is single search result page, wait timeout for selector '.prod-details .preSep h2'";
		callback(json);
	}, timeout);
}
