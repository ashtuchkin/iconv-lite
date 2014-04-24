var vows = require('vows'),
    assert = require('assert'),
    iconv = require(__dirname+'/../');

if (!iconv.supportsStreams())
    return;

var Readable = require('stream').Readable,
    Writable = require('stream').Writable;

// Create a source stream that feeds given array of chunks.
function feeder(chunks) {
    if (!Array.isArray(chunks))
        chunks = [chunks];
    var opts = {};
    if (chunks.every(function(chunk) {return typeof chunk == 'string'}))
        opts.encoding = 'utf8';

    var stream = new Readable(opts);
    function writeChunk() {
        try {
            if (chunks.length > 0) {
                var chunk = chunks.shift();
                if (Array.isArray(chunk))
                    chunk = new Buffer(chunk);
                stream.push(chunk, opts.encoding);
            } else {
                stream.push(null);
                return;
            }
        } catch(e) {
            stream.emit('error', e);
        }
        process.nextTick(writeChunk);
    }
    stream._read = function() {
        writeChunk();
    }
    
    return stream;
}

function checkStreamOutput(options) {
    return {
        topic: function() {
            try {
                var stream = options.createStream();
            }
            catch (e) {
                this.callback(e);
                return;
            }
            var res = [];
            stream.on('readable', function() {
                var chunk;
                try {
                    while ((chunk = stream.read()) != null) {
                        if (options.outputType)
                            if (/^buffer/.test(options.outputType))
                                assert.instanceOf(chunk, Buffer);
                            else
                                assert.strictEqual(typeof chunk, options.outputType);
                        res.push(chunk);
                    }
                }
                catch (e) {
                    stream.emit('error', e);
                }
            });
            stream.on('error', this.callback);
            stream.on('end', this.callback.bind(this, null, res));
        },
        check: function(err, res) {
            if (options.checkError) {
                assert.isNotNull(err, "Expected error, but got success");
                if (Object.prototype.toString.call(options.checkError) == '[object RegExp]')
                    assert.match(err.message, options.checkError);
                else if (typeof options.checkError == 'function')
                    options.checkError(err);
                else
                    assert.fail(null, null, "Invalid type of options.checkError: "+typeof options.checkError);
            }
            else {
                assert.ifError(err);

                if (options.checkOutput) {
                    if (options.outputType)
                        if (r = /^buffer-?(.*)/.exec(options.outputType)) {
                            res = Buffer.concat(res);
                            if (r[1])
                                res = res.toString(r[1]); // Convert to string to make comparing buffers easier.
                        }                        
                        else if (options.outputType == 'string')
                            res = res.join('');

                    options.checkOutput(res);
                }
            }
        },
    };
}

function checkEncodeStream(opts) {
    opts.createStream = function() {
        return feeder(opts.input)
            .pipe(iconv.encodeStream(opts.encoding, opts.encodingOptions));
    };
    opts.outputType = opts.outputType || 'buffer-hex';
    if (Buffer.isBuffer(opts.output) && opts.outputType == 'buffer-hex')
        opts.output = opts.output.toString('hex');
    
    opts.checkOutput = opts.checkOutput || function(res) {
        assert.equal(res, opts.output);
    };

    return checkStreamOutput(opts);
}

function checkDecodeStream(opts) {
    opts.createStream = function() {
        return feeder(opts.input)
            .pipe(iconv.decodeStream(opts.encoding, opts.encodingOptions));
    };
    opts.outputType = opts.outputType || 'string';    
    opts.checkOutput = opts.checkOutput || function(res) {
        assert.equal(res, opts.output);
    };

    return checkStreamOutput(opts);
}

vows.describe("Streaming mode").addBatch({
    "Feeder outputs strings": checkStreamOutput({
        createStream: function() { return feeder(["abc", "def"]); },
        outputType: 'string',
        checkOutput: function(res) { assert.equal(res, "abcdef"); },
    }),
    "Feeder outputs buffers": checkStreamOutput({
        createStream: function() { return feeder([[0x61], [0x62]]); },
        outputType: 'buffer',
        checkOutput: function(res) { assert.equal(res.toString('hex'), "6162"); },
    }),
    "Feeder outputs buffers with encoding": checkStreamOutput({
        createStream: function() { return feeder([[0x61], [0x62, 0x63]]); },
        outputType: 'buffer-hex',
        checkOutput: function(res) { assert.equal(res, "616263"); },
    }),

    "Simple stream encoding": checkEncodeStream({
        encoding: "us-ascii",
        input: ["hello ", "world!"],
        output: new Buffer("hello world!"),
    }),

    "Simple stream decoding": checkDecodeStream({
        encoding: "us-ascii",
        input: [new Buffer("hello "), new Buffer("world!")],
        output: "hello world!",
    }),

    "Stream encoder should error when fed with buffers": checkEncodeStream({
        encoding: "us-ascii",
        input: [new Buffer("hello "), new Buffer("world!")],
        checkError: /Iconv encoding stream needs strings as its input/,
    }),

    "Stream decoder should be ok when fed with strings": checkDecodeStream({
        encoding: "us-ascii",
        input: ["hello ", "world!"],
        output: new Buffer("hello world!"),
    }),

    "Stream decoder should be error when fed with strings and 'decodeStrings: false' option is given": checkDecodeStream({
        encoding: "us-ascii",
        encodingOptions: {decodeStrings: false},
        input: ["hello ", "world!"],
        checkError: /Iconv decoding stream needs buffers as its input/,
    }),

    "Round-trip encoding and decoding": checkStreamOutput({
        createStream: function() {
            return feeder(["абв", "где"])
                .pipe(iconv.encodeStream("windows-1251"))
                .pipe(iconv.decodeStream("windows-1251"))
                .pipe(iconv.encodeStream("windows-1251"))
                .pipe(iconv.decodeStream("windows-1251"));
        },
        outputType: 'string',
        checkOutput: function(res) { assert.equal(res, "абвгде"); },
    }),


}).export(module);
