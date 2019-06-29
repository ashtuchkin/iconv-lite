var assert = require('assert'),
    iconv = require(__dirname + '/../'),
    Iconv = require('iconv').Iconv;

var sample1 = '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
字符编码 文字コード Κωδικοποίηση χαρακτήρων Кодировка символов';

describe('Direct transliteration', function() {
    it('should transliterate for ISO-8859-1 (as latin1)', function() {
        assert.equal(iconv.transliterate(sample1, 'latin1'), '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for ASCII', function() {
        assert.equal(iconv.transliterate(sample1, 'ascii'), '!C/PS$?Y=|SS"(c)a<<!(r)-deg+-23\'uP*,1o>>1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOOxOUUUUUThssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for EUC-JP', function() {
        assert.equal(iconv.transliterate(sample1, 'EUC-JP'), '¡C/PS¤¥¦§¨©ª<<!®¯°±23´u¶*¸1º>>1/41/23/4¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏDÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi コード Κωδικοποίηση χαρακτήρων Кодировка символов');
    });

    it('should transliterate for Windows-1251', function() {
        assert.equal(iconv.transliterate(sample1, 'windows1251'), '!C/PS¤Y=¦§"©a«¬­®-°±23\'µ¶·,1o»1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOOxOUUUUUThssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Кодировка символов');
    });

    it('should transliterate for MacGreek', function() {
        assert.equal(iconv.transliterate(sample1, 'MacGreek'), '!C/£$?¥¦§¨©a«¬­®-°±²³\'uP*,¹o»1/4½3/4?AAAAÄAAECEÉEEIIIIDNOOOOÖxOUUUÜUThßàaâaäaaeçèéêëiiîïdnooôoö÷oùuûüythy\n\
Zi Fu Bian Ma  Wen Zi kodo Κωδικοποίηση χαρακτήρων Kodirovka simvolov');
    });
});

describe('Transliteration via encoder', function() {
    it('should transliterate for ISO-8859-1 (as latin1)', function() {
        var buf = iconv.encode(sample1, 'latin1//translit');
        assert.equal(iconv.decode(buf, 'latin1'), '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for ASCII', function() {
        var buf = iconv.encode(sample1, 'ascii', { transliterate: true });
        assert.equal(iconv.decode(buf, 'ascii'), '!C/PS$?Y=|SS"(c)a<<!(r)-deg+-23\'uP*,1o>>1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOOxOUUUUUThssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    // TODO: Put this test back when `¥` and `‾` are handled correctly.
//     it('should transliterate for EUC-JP', function() {
//         var buf = iconv.encode(sample1, 'EUC-JP', { transliterate: true });
//         assert.equal(iconv.decode(buf, 'EUC-JP'), '¡C/PS¤¥¦§¨©ª<<!®¯°±23´u¶*¸1º>>1/41/23/4¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏDÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
// Zi Fu Bian Ma  Wen Zi コード Κωδικοποίηση χαρακτήρων Кодировка символов');
//     });

    it('should transliterate for Windows-1251', function() {
        var buf = iconv.encode(sample1, 'windows1251', { transliterate: true });
        assert.equal(iconv.decode(buf, 'windows1251'), '!C/PS¤Y=¦§"©a«¬­®-°±23\'µ¶·,1o»1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOOxOUUUUUThssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Кодировка символов');
    });

    it('should transliterate for MacGreek', function() {
        var buf = iconv.encode(sample1, 'MacGreek', { transliterate: true });
        assert.equal(iconv.decode(buf, 'MacGreek'), '!C/£$?¥¦§¨©a«¬­®-°±²³\'uP*,¹o»1/4½3/4?AAAAÄAAECEÉEEIIIIDNOOOOÖxOUUUÜUThßàaâaäaaeçèéêëiiîïdnooôoö÷oùuûüythy\n\
Zi Fu Bian Ma  Wen Zi kodo Κωδικοποίηση χαρακτήρων Kodirovka simvolov');
    });
});
