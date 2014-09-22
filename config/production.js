'use strict';

// Production specific configuration
// =================================
module.exports = {
    "casper": {
        "ports": [8581,8582,8583],
        "logLevel": "debug",
        "logFile": "./casper.log",
        "timeout":120000
    },
    "scrapecache": {
        "enabled": true,
        "validity": 36,
        "db": {
            "db": "scrapecache",
            "host": "127.0.0.1",
            "port": 27017
        }
    },
    "jobQueue":{
        "chunkSize":5
    },
    "healthCheck":{
        "pingTimeout":5000,
        "pingCron":"0 */10 * * * *",
        "memoryCron":"0 */10 * * * *"
    }
};