var assert = require('assert'),
    iconv = require(__dirname + '/../'),
    Iconv = require('iconv').Iconv;

var sample1 = '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ_ØÙÚÛÜ_Þßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
字符编码 文字コード Κωδικοποίηση χαρακτήρων Кодировка символов';

describe('Direct transliteration', function() {
    it('should transliterate for ISO-8859-1 (as latin1)', function() {
        assert.equal(iconv.transliterate(sample1, 'latin1'), '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ_ØÙÚÛÜ_Þßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for ASCII', function() {
        assert.equal(iconv.transliterate(sample1, 'ascii'), '!C/PS$?Y=|SS"(c)a<<!(r)-deg+-23\'uP*,1o>>1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOO_OUUUU_Thssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for EUC-JP', function() {
        assert.equal(iconv.transliterate(sample1, 'EUC-JP'), '¡C/PS¤¥¦§¨©ª<<!®¯°±23´u¶*¸1º>>1/41/23/4¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏDÑÒÓÔÕÖ_ØÙÚÛÜ_Þßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi コード Κωδικοποίηση χαρακτήρων Кодировка символов');
    });

    it('should transliterate for Windows-1251', function() {
        assert.equal(iconv.transliterate(sample1, 'windows1251'), '!C/PS¤Y=¦§"©a«¬­®-°±23\'µ¶·,1o»1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOO_OUUUU_Thssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Кодировка символов');
    });

    it('should transliterate for MacGreek', function() {
        assert.equal(iconv.transliterate(sample1, 'MacGreek'), '!C/£$?¥¦§¨©a«¬­®-°±²³\'uP*,¹o»1/4½3/4?AAAAÄAAECEÉEEIIIIDNOOOOÖ_OUUUÜ_Thßàaâaäaaeçèéêëiiîïdnooôoö÷oùuûüythy\n\
Zi Fu Bian Ma  Wen Zi kodo Κωδικοποίηση χαρακτήρων Kodirovka simvolov');
    });
});

describe('Transliteration via encoder', function() {
    it('should transliterate for ISO-8859-1 (as latin1)', function() {
        var buf = iconv.encode(sample1, 'latin1//translit');
        assert.equal(iconv.decode(buf, 'latin1'), '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ_ØÙÚÛÜ_Þßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    it('should transliterate for ASCII', function() {
        var buf = iconv.encode(sample1, 'ascii', { transliterate: true });
        assert.equal(iconv.decode(buf, 'ascii'), '!C/PS$?Y=|SS"(c)a<<!(r)-deg+-23\'uP*,1o>>1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOO_OUUUU_Thssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Kodirovka simvolov');
    });

    // TODO: Put this test back when `¥` and `‾` are handled correctly.
//     it('should transliterate for EUC-JP', function() {
//         var buf = iconv.encode(sample1, 'EUC-JP', { transliterate: true });
//         assert.equal(iconv.decode(buf, 'EUC-JP'), '¡C/PS¤¥¦§¨©ª<<!®¯°±23´u¶*¸1º>>1/41/23/4¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏDÑÒÓÔÕÖ_ØÙÚÛÜ_Þßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\n\
// Zi Fu Bian Ma  Wen Zi コード Κωδικοποίηση χαρακτήρων Кодировка символов');
//     });

    it('should transliterate for Windows-1251', function() {
        var buf = iconv.encode(sample1, 'windows1251', { transliterate: true });
        assert.equal(iconv.decode(buf, 'windows1251'), '!C/PS¤Y=¦§"©a«¬­®-°±23\'µ¶·,1o»1/41/23/4?AAAAAAAECEEEEIIIIDNOOOOO_OUUUU_Thssaaaaaaaeceeeeiiiidnooooo/ouuuuythy\n\
Zi Fu Bian Ma  Wen Zi kodo Kodikopoiese kharakteron Кодировка символов');
    });

    it('should transliterate for MacGreek', function() {
        var buf = iconv.encode(sample1, 'MacGreek', { transliterate: true });
        assert.equal(iconv.decode(buf, 'MacGreek'), '!C/£$?¥¦§¨©a«¬­®-°±²³\'uP*,¹o»1/4½3/4?AAAAÄAAECEÉEEIIIIDNOOOOÖ_OUUUÜ_Thßàaâaäaaeçèéêëiiîïdnooôoö÷oùuûüythy\n\
Zi Fu Bian Ma  Wen Zi kodo Κωδικοποίηση χαρακτήρων Kodirovka simvolov');
    });

    if (iconv.hasUnidecodePlus()) {
        it('should transliterate for ASCII with smart spacing', function() {
            var buf = iconv.encode('Café 北京, 鞋 size 10½, 33⅓ RPM', 'ascii', { transliterate: true, smartSpacing: true });
            assert.equal(iconv.decode(buf, 'ascii'), 'Cafe Bei Jing, Xie size 10 1/2, 33 1/3 RPM');
        });

        it('should transliterate for ISO-8859-1 with smart spacing', function() {
            var buf = iconv.encode('Café 北京, 鞋 size 10½, 33⅓ RPM', 'ISO-8859-1', { transliterate: true, smartSpacing: true });
            assert.equal(iconv.decode(buf, 'ISO-8859-1'), 'Café Bei Jing, Xie size 10½, 33 1/3 RPM');
        });

        it('should transliterate for ASCII with German option', function() {
            var buf = iconv.encode('ÄäÖöÜü, Schrödinger', 'ascii', { transliterate: true, german: true });
            assert.equal(iconv.decode(buf, 'ascii'), 'AEaeOEoeUEue, Schroedinger');
        });
    }
});
