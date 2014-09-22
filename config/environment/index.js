'use strict';

var path = require('path');
var config = require("config");
var _ = require('lodash');
var fs = require("fs");

function requiredProcessEnv(name) {
    if (!process.env[name]) {
        throw new Error('You must set the ' + name + ' environment variable');
    }
    return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
    "env": process.env.NODE_ENV || "development"
};

// Export the config object based on the NODE_ENV
// ==============================================
function merge() {
    var res = _.merge(all,config);
    res = _.merge(res,require("./development"));
    if(all.evn === "production" && fs.existsSync('./' + all.env + '.js')) {
        res = _.merge(res,require('./' + all.env + '.js'));
    }
    return res;
}
module.exports = merge();
