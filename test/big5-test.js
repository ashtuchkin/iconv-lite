'use strict';
var vows    = require('vows');
var assert  = require('assert');
var iconv   = require(__dirname+'/../');

vows.describe('Big5 test').addBatch({
    'Big5 correctly encoded/decoded': function () {
        var testString = '測試abc';
        var testStringBig5Buffer = new Buffer([0xb4, 0xfa, 0xb8, 0xd5, 0x61, 0x62, 0x63]);

        assert.strictEqual(iconv.toEncoding(testString, 'big5').toString('binary'), testStringBig5Buffer.toString('binary'));
        assert.strictEqual(iconv.fromEncoding(testStringBig5Buffer, 'big5'), testString);
    }
}).export(module);
