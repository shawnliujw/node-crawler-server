var numbers = /one|two|three|four|five|six|seven|eight|nine|ten/;
var integer = new RegExp('(\\d+|' + numbers.source + ')', 'gim');
var price =  /\d+(\.\d*)?/gim;
var priceWithUnit = new RegExp('(£' + price.source + '|' + price.source + 'p)', 'gim');
var wasPrice = new RegExp('was ' + priceWithUnit.source, 'gim');
var addSave = new RegExp('Add ' + integer.source + ' you save ' + priceWithUnit.source, 'gim');
var oneForTwo = new RegExp(integer.source + ' for ' + priceWithUnit.source, 'gim');
var qforq = new RegExp(integer.source + ' for( the price of)? ' + integer.source, 'gim');
var buyAdd = new RegExp(qforq.source + '|Buy ' + integer.source + ' ((and )?add|get) ' + integer.source, 'gim');

var betterThanHalf = new RegExp('Better than half.*' + wasPrice.source,'gim');
var halfPrice = new RegExp('Half Price.*' + wasPrice.source, 'gim');
var saveProportional = new RegExp('save \\d\\/\\d.*' + wasPrice.source, 'gim');
var MBP = new RegExp(addSave.source + '|' + oneForTwo.source, 'gim');
var MBB = new RegExp(qforq.source + '|' + buyAdd.source,'gim');

module.exports = {
	offerTypes: {
		'1.3': betterThanHalf,
		'1.1': halfPrice,
		'1.2': saveProportional,
		'2.0': MBP,
		'3.0': MBB,
		'1.0': wasPrice,
	},
	integer: integer,
	wasPrice: wasPrice,
	priceWithUnit: priceWithUnit,
	price: price,
	qforq: qforq,
	addSave: addSave
};
