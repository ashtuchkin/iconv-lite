var assert = require('assert'),
    iconv = require(__dirname+'/../');

describe("CESU-8 codec", function() {
    it("encodes correctly", function() {
        assert.equal(iconv.encode("E", "cesu8").toString('hex'), "45");
        assert.equal(iconv.encode("¢", "cesu8").toString('hex'), "c2a2");
        assert.equal(iconv.encode("ȅ", "cesu8").toString('hex'), "c885");
        assert.equal(iconv.encode("€", "cesu8").toString('hex'), "e282ac");
        assert.equal(iconv.encode("𐐀", "cesu8").toString('hex'), "eda081edb080");
        assert.equal(iconv.encode("😱", "cesu8").toString('hex'), "eda0bdedb8b1");
        assert.equal(iconv.encode("a😱a", "cesu8").toString('hex'), "61eda0bdedb8b161");
        assert.equal(iconv.encode("😱😱", "cesu8").toString('hex'), "eda0bdedb8b1eda0bdedb8b1");
    });
    it("decodes correctly", function() {
        assert.equal(iconv.decode(new Buffer("45", 'hex'), "cesu8"), "E");
        assert.equal(iconv.decode(new Buffer("c2a2", 'hex'), "cesu8"), "¢");
        assert.equal(iconv.decode(new Buffer("c885", 'hex'), "cesu8"), "ȅ");
        assert.equal(iconv.decode(new Buffer("e282ac", 'hex'), "cesu8"), "€");
        assert.equal(iconv.decode(new Buffer("eda081edb080", 'hex'), "cesu8"), "𐐀");
        assert.equal(iconv.decode(new Buffer("eda0bdedb8b1", 'hex'), "cesu8"), "😱");
    });
    it('has correct length in bytes', function() {
        assert.equal(iconv.byteLength("😱", "cesu8"), Buffer.byteLength('eda0bdedb8b1', 'hex'));
    });
});
