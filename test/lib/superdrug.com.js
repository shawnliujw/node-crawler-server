describe("/lib/sites/en_gb/superdrug.co.uk.js", function() {
	this.timeout(30000);
	var loader = require("../../../../lib/loader");
	it("Load product details,should return stock unless this is invalid product url", function(done) {
		var url = "http://www.superdrug.com/haircare-oils/argania-hair-oil-giftset/invt/845458&bklist=";
		loader.details([url], "en_gb").then(function(data) {
			assert.equal(true, data.status && data.results[0] && data.results[0].status);
			done();
		});
	});
	it("Load search results,should return links length > 0", function(done) {
		var url = "http://www.superdrug.com/search?q=oil&searchsubmit=Search&setpagenum=1&perpage=24";
		loader.links([url], "en_gb").then(function(data) {
			assert.equal(true, data.status && data.results[0] && data.results[0].status);
			done();
		});
	});
});