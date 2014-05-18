
// Double-byte codec. In this scheme, a character is represented by 1-2 bytes.
// Our codec supports surrogates, extensions for GB18030 and unicode sequences.
// To save memory and loading time, we read table files only when requested.

exports._dbcs = function(options) {
    return new DBCSCodec(options);
}

// Class DBCSCodec reads and initializes mapping tables.
function DBCSCodec(options) {
    this.options = options;
    if (!options)
        throw new Error("DBCS codec is called without the data.")
    if (!options.table)
        throw new Error("Encoding '" + options.encodingName + "' has no data.");

    // Decode tables: DBCS -> Unicode.

    // decodeLead is for single-byte DBCS sequences, decodeTable - for double-byte.
    // We store only top half of decodeTable (offset 0x8000) because no DBCS encoding has
    // double-byte sequences with first byte < 0x80.
    // Values: >= 0  -> unicode char. can be astral char (> 0xFFFF)
    //         == -1 -> unassigned.
    //         == -2 -> lead byte of a two-byte sequence (used only in decodeLead table)
    //         <= -3 -> start of a sequence, negated index in decodeTableSeq.
    this.decodeLead = [];
    for (var i = 0; i < 0x100; i++)
        this.decodeLead[i] = -1; // Unassigned.

    this.decodeTable = [];
    for (var i = 0; i < 0x8000; i++)
        this.decodeTable[i] = -1; // Unassigned.

    // Sometimes a DBCS char corresponds to a sequence of unicode chars. We store them as arrays of integers here,
    // allocating indexes starting from 3. Then, a negated index is used as a value in decodeTable.
    this.decodeTableSeq = [null, null, null];


    // Actual mapping tables consist of chunks. Use them to fill up decode tables.
    var mappingTable = options.table();
    for (var i = 0; i < mappingTable.length; i++)
        this._addDecodeChunk(mappingTable[i]);

    this.defaultCharUnicode = options.iconv.defaultCharUnicode;



    // Encode tables: Unicode -> DBCS.

    // `encodeTable` is array mapping from unicode char to encoded char. All its values are integers for performance.
    // Because it can be sparse, it is represented as array of buckets by 256 chars each. Bucket can be null.
    // When the value >= 0 -> it is a normal char. Write the value (if <=256 then 1 byte, if <=65536 then 2 bytes).
    // When value is -1    -> no conversion found. Output a default char.
    // When value < -1     -> it's a negated index in encodeTableSeq, see below. The character starts a sequence.
    this.encodeTable = [];
    
    // `encodeTableSeq` is used when a sequence of unicode characters is encoded as a single code. We use a tree of
    // objects where keys correspond to characters in sequence and leafs are the encoded dbcs values. A special '-1' key
    // means end of sequence (needed when one sequence is a strict subsequence of another).
    // Objects are kept separately from encodeTable to increase performance.
    // Table is initialized with 2 nulls so that the negative sequence ids started with -2.
    this.encodeTableSeq = [null, null];

    // Some chars can be decoded, but need not be encoded.
    var skipEncodeChars = {};
    if (options.encodeSkipVals)
        for (var i = 0; i < options.encodeSkipVals.length; i++) {
            var range = options.encodeSkipVals[i];
            for (var j = range.from; j <= range.to; j++)
                skipEncodeChars[j] = true;
        }
        

    // Use decode tables to fill out encode tables.
    for (var i = 0; i < this.decodeLead.length; i++)
        this._setEncodeChar(this.decodeLead[i], i);
    
    for (var i = 0; i < this.decodeTable.length; i++) {
        if (skipEncodeChars[i + 0x8000])
            continue;

        var uChar = this.decodeTable[i];
        if (uChar >= 0)
            this._setEncodeChar(uChar, i + 0x8000);
        else if (uChar < -2)
            this._setEncodeSequence(this.decodeTableSeq[-uChar], i + 0x8000)
    }

    // Add more encoding pairs when needed.
    for (var uChar in options.encodeAdd || {})
        this._setEncodeChar(uChar.charCodeAt(0), options.encodeAdd[uChar]);


    // Load GB18030 tables if needed.
    if (typeof options.gb18030 === 'function') {
        this.gb18030 = options.gb18030(); // Load GB18030 ranges.
        for (var i = 0; i < 0x100; i++)
            if ((0x81 <= i && i <= 0xFE) != (this.decodeLead[i] == -2))
                throw new Error("Invalid GB18030 double-byte table; leading byte is not in range 0x81-0xFE: ", i.toString(16));
    }
        

    this.defCharSB  = this.encodeTable[0][options.iconv.defaultCharSingleByte.charCodeAt(0)];
    if (this.defCharSB === -1) this.defCharSB = this.encodeTable[0]['?'];
    if (this.defCharSB === -1) this.defCharSB = "?".charCodeAt(0);
}

// Public interface: create encoder and decoder objects. 
// The methods (write, end) are simple functions to not inhibit optimizations.
DBCSCodec.prototype.encoder = function encoderDBCS(options) {
    return {
        // Methods
        write: encoderDBCSWrite,
        end: encoderDBCSEnd,

        // Decoder state
        leadSurrogate: -1,
        seqObj: undefined,
        
        // Static data
        encodeTable: this.encodeTable,
        encodeTableSeq: this.encodeTableSeq,
        defaultCharSingleByte: this.defCharSB,
        gb18030: this.gb18030,

        // Export for testing
        findIdx: findIdx,
    }
}

DBCSCodec.prototype.decoder = function decoderDBCS(options) {
    return {
        // Methods
        write: decoderDBCSWrite,
        end: decoderDBCSEnd,

        // Decoder state
        leadBytes: -1,

        // Static data
        decodeLead: this.decodeLead,
        decodeTable: this.decodeTable,
        decodeTableSeq: this.decodeTableSeq,
        defaultCharUnicode: this.defaultCharUnicode,
        gb18030: this.gb18030,
    }
}



// Decoder helpers
DBCSCodec.prototype._addDecodeChunk = function(chunk) {
    // First element of chunk is the hex dbcs code where we start.
    var curAddr = parseInt(chunk[0], 16);

    // Choose the decoding table where we'll write our chars.
    var writeTable;
    if (curAddr < 0x100) {
        writeTable = this.decodeLead;
    }
    else if (curAddr < 0x10000) {
        if (this.decodeLead[curAddr >> 8] >= 0)
            throw new Error("Overwrite lead byte in " + this.options.encodingName + " at chunk " + chunk[0]);
        
        this.decodeLead[curAddr >> 8] = -2; // DBCS lead byte.
        writeTable = this.decodeTable;
        curAddr -= 0x8000;
        if (curAddr < 0)
            throw new Error("DB address < 0x8000 in "  + this.options.encodingName + " at chunk " + chunk[0]);
    }
    else
        throw new Error("Unsupported address in "  + this.options.encodingName + " at chunk " + chunk[0]);

    // Write all other elements of the chunk to the table.
    for (var k = 1; k < chunk.length; k++) {
        var part = chunk[k];
        if (typeof part === "string") { // String, write as-is.
            for (var l = 0; l < part.length;) {
                var code = part.charCodeAt(l++);
                if (0xD800 <= code && code < 0xDC00) { // Decode surrogate
                    var codeTrail = part.charCodeAt(l++);
                    if (0xDC00 <= codeTrail && codeTrail < 0xE000)
                        writeTable[curAddr++] = 0x10000 + (code - 0xD800) * 0x400 + (codeTrail - 0xDC00);
                    else
                        throw new Error("Incorrect surrogate pair in "  + this.options.encodingName + " at chunk " + chunk[0]);
                }
                else if (0x0FF0 < code && code <= 0x0FFF) { // Character sequence (our own encoding used)
                    var len = 0xFFF - code + 2;
                    var seq = [];
                    for (var m = 0; m < len; m++)
                        seq.push(part.charCodeAt(l++)); // Simple variation: don't support surrogates or subsequences in seq.

                    this.decodeTableSeq.push(seq);
                    writeTable[curAddr++] = -(this.decodeTableSeq.length-1); // negative char code -> sequence idx.
                }
                else
                    writeTable[curAddr++] = code; // Basic char
            }
        } 
        else if (typeof part === "number") { // Integer, meaning increasing sequence starting with prev character.
            var charCode = writeTable[curAddr - 1] + 1;
            for (var l = 0; l < part; l++)
                writeTable[curAddr++] = charCode++;
        }
        else
            throw new Error("Incorrect type '" + typeof part + "' given in "  + this.options.encodingName + " at chunk " + chunk[0]);
    }
}

// Encoder helpers
DBCSCodec.prototype._getEncodeBucket = function(uCode) {
    var high = uCode >> 8; // This could be > 0xFF because of astral characters.
    var bucket = this.encodeTable[high];
    if (bucket === undefined) {
        this.encodeTable[high] = bucket = []; // Create bucket on demand.
        for (var j = 0; j < 0x100; j++)
            bucket[j] = -1;
    }
    return bucket;
}

DBCSCodec.prototype._setEncodeChar = function(uCode, dbcsCode) {
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 0xFF;
    if (bucket[low] < -1)
        this.encodeTableSeq[-bucket[low]][-1] = dbcsCode; // There's already a sequence, set a single-char subsequence of it.
    else
        bucket[low] = dbcsCode;
}

DBCSCodec.prototype._setEncodeSequence = function(seq, dbcsCode) {
    
    // Get the root of character tree according to first character of the sequence.
    var uCode = seq[0];
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 0xFF;

    var node;
    if (bucket[low] < -1) {
        // There's already a sequence with  - use it.
        node = this.encodeTableSeq[-bucket[low]]; 
    }
    else {
        // There was no sequence object - allocate a new one.
        this.encodeTableSeq.push(node = {});
        if (bucket[low] !== -1) node[-1] = bucket[low]; // If a char was set before - make it a single-char subsequence.
        bucket[low] = -(this.encodeTableSeq.length - 1); 
    }

    // Traverse the character tree, allocating new nodes as needed.
    for (var j = 1; j < seq.length-1; j++) {
        var oldVal = node[uCode];
        if (typeof oldVal === 'object')
            node = oldVal;
        else {
            node = node[uCode] = {}
            if (oldVal !== undefined)
                node[-1] = oldVal
        }
    }

    // Set the leaf to given dbcsCode.
    uCode = seq[seq.length-1];
    node[uCode] = dbcsCode;
}



// == Actual Encoding ==========================================================


function encoderDBCSWrite(str) {
    var newBuf = new Buffer(str.length * (this.gb18030 ? 4 : 2)), 
        leadSurrogate = this.leadSurrogate,
        seqObj = this.seqObj, nextChar = -1,
        i = 0, j = 0;

    while (true) {
        // 0. Get next character.
        if (nextChar === -1) {
            if (i == str.length) break;
            var uCode = str.charCodeAt(i++);
        }
        else {
            var uCode = nextChar;
            nextChar = -1;    
        }

        // 1. Handle surrogates.
        if (0xD800 <= uCode && uCode < 0xE000) { // Char is one of surrogates.
            if (uCode < 0xDC00) { // We've got lead surrogate.
                if (leadSurrogate === -1) {
                    leadSurrogate = uCode;
                    continue;
                } else {
                    leadSurrogate = uCode;
                    // Double lead surrogate found.
                    uCode = -1;
                }
            } else { // We've got trail surrogate.
                if (leadSurrogate !== -1) {
                    uCode = 0x10000 + (leadSurrogate - 0xD800) * 0x400 + (uCode - 0xDC00);
                    leadSurrogate = -1;
                } else {
                    // Incomplete surrogate pair - only trail surrogate found.
                    uCode = -1;
                }
                
            }
        }
        else if (leadSurrogate !== -1) {
            // Incomplete surrogate pair - only lead surrogate found.
            nextChar = uCode; uCode = -1; // Write an error, then current char.
            leadSurrogate = -1;
        }

        // 2. Convert uCode character.
        var dbcsCode = -1;
        if (seqObj !== undefined && uCode != -1) { // We are in the middle of the sequence
            var resCode = seqObj[uCode];
            if (typeof resCode === 'object') { // Sequence continues.
                seqObj = resCode;
                continue;

            } else if (typeof resCode == 'number') { // Sequence finished. Write it.
                dbcsCode = resCode;

            } else if (resCode == undefined) { // Current character is not part of the sequence.

                // Try default character for this sequence
                resCode = seqObj[-1];
                if (resCode !== undefined) {
                    dbcsCode = resCode; // Found. Write it.
                    nextChar = uCode; // Current character will be written too in the next iteration.

                } else {
                    // TODO: What if we have no default? (resCode == undefined)
                    // Then, we should write first char of the sequence as-is and try the rest recursively.
                    // Didn't do it for now because no encoding has this situation yet.
                    // Currently, just skip the sequence and write current char.
                }
            }
            seqObj = undefined;
        }
        else if (uCode >= 0) {  // Regular character
            var subtable = this.encodeTable[uCode >> 8];
            if (subtable !== undefined)
                dbcsCode = subtable[uCode & 0xFF];
            
            if (dbcsCode < -1) { // Sequence start
                seqObj = this.encodeTableSeq[-dbcsCode];
                continue;
            }

            if (dbcsCode == -1 && this.gb18030) {
                // Use GB18030 algorithm to find character(s) to write.
                var idx = findIdx(this.gb18030.uChars, uCode);
                if (idx != -1) {
                    var dbcsCode = this.gb18030.gbChars[idx] + (uCode - this.gb18030.uChars[idx]);
                    newBuf[j++] = 0x81 + Math.floor(dbcsCode / 12600); dbcsCode = dbcsCode % 12600;
                    newBuf[j++] = 0x30 + Math.floor(dbcsCode / 1260); dbcsCode = dbcsCode % 1260;
                    newBuf[j++] = 0x81 + Math.floor(dbcsCode / 10); dbcsCode = dbcsCode % 10;
                    newBuf[j++] = 0x30 + dbcsCode;
                    continue;
                }
            }
        }

        // 3. Write dbcsCode character.
        if (dbcsCode === -1)
            dbcsCode = this.defaultCharSingleByte;
        
        if (dbcsCode < 0x100) {
            newBuf[j++] = dbcsCode;
        }
        else {
            newBuf[j++] = dbcsCode >> 8;   // high byte
            newBuf[j++] = dbcsCode & 0xFF; // low byte
        }
    }

    this.seqObj = seqObj;
    this.leadSurrogate = leadSurrogate;
    return newBuf.slice(0, j);
}

function encoderDBCSEnd() {
    if (this.leadSurrogate === -1 && this.seqObj === undefined)
        return; // All clean. Most often case.

    var newBuf = new Buffer(10), j = 0;

    if (this.seqObj) { // We're in the sequence.
        var dbcsCode = this.seqObj[-1];
        if (dbcsCode !== undefined) { // Write beginning of the sequence.
            if (dbcsCode < 0x100) {
                newBuf[j++] = dbcsCode;
            }
            else {
                newBuf[j++] = dbcsCode >> 8;   // high byte
                newBuf[j++] = dbcsCode & 0xFF; // low byte
            }
        } else {
            // See todo above.
        }
        this.seqObj = undefined;
    }

    if (this.leadSurrogate !== -1) {
        // Incomplete surrogate pair - only lead surrogate found.
        newBuf[j++] = this.defaultCharSingleByte;
        this.leadSurrogate = -1;
    }
    
    return newBuf.slice(0, j);
}


// == Actual Decoding ==========================================================


function decoderDBCSWrite(buf) {
    var newBuf = new Buffer(buf.length*2),
        leadBytes = this.leadBytes, uCode;
    
    for (var i = 0, j = 0; i < buf.length; i++) {
        var curByte = buf[i];
        if (leadBytes === -1) { // We have no leading byte in buffer.
            uCode = this.decodeLead[curByte];
            if (uCode === -2) { // Check if this is a leading byte of a double-byte char sequence.
                leadBytes = curByte; 
                continue;
            }
        } else { // curByte is a trailing byte in double-byte char sequence.

            if (this.gb18030) {
                if (leadBytes < 0x100) { // Single byte lead
                    if (0x30 <= curByte && curByte <= 0x39) {
                        leadBytes = leadBytes * 0x100 + curByte; // Move on.
                        continue;
                    }
                    else // Usual decode table. 
                        uCode = this.decodeTable[(leadBytes << 8) + curByte - 0x8000];
                        
                } else if (leadBytes < 0x10000) { // Double byte lead
                    if (0x81 <= curByte && curByte <= 0xFE) {
                        leadBytes = leadBytes * 0x100 + curByte; // Move on.
                        continue;

                    } else { // Incorrect byte.
                        uCode = this.defaultCharUnicode.charCodeAt(0); 
                        newBuf[j++] = uCode & 0xFF;    // Emit 'incorrect sequence' char.
                        newBuf[j++] = uCode >> 8;
                        newBuf[j++] = leadBytes & 0xFF; // Throw out first char, emit second char (it'll be '0'-'9').
                        newBuf[j++] = 0;
                        leadBytes = -1; i--; // Cur char will be processed once again, without leading.
                        continue;
                    }

                } else { // Triple byte lead: we're ready.
                    if (0x30 <= curByte && curByte <= 0x39) { // Complete sequence. Decode it.
                        var ptr = ((((leadBytes >> 16)-0x81)*10 + ((leadBytes >> 8) & 0xFF)-0x30)*126 + (leadBytes & 0xFF)-0x81)*10 + curByte-0x30;
                        var idx = findIdx(this.gb18030.gbChars, ptr);
                        uCode = this.gb18030.uChars[idx] + ptr - this.gb18030.gbChars[idx];

                    } else { // Incorrect 4-th byte.
                        uCode = this.defaultCharUnicode.charCodeAt(0); 
                        newBuf[j++] = uCode & 0xFF;    // Emit 'incorrect sequence' char.
                        newBuf[j++] = uCode >> 8;
                        newBuf[j++] = (leadBytes >> 8) & 0xFF; // Throw out first char, emit second char (it'll be '0'-'9').
                        newBuf[j++] = 0;
                        leadBytes = leadBytes & 0xFF; // Make third char a leading byte - it was in 0x81-0xFE range.
                        i--; // Cur char will be processed once again.
                        continue;
                    }
                }
            } else
                uCode = this.decodeTable[(leadBytes << 8) + curByte - 0x8000];

            leadBytes = -1;
            if (uCode == -1) i--; // Try curByte one more time in the next iteration without the lead byte.
        }
        
        // Decide what to do with character.
        if (uCode === -1) { // Undefined char.
            // TODO: Callback.
            uCode = this.defaultCharUnicode.charCodeAt(0);
        }
        else if (uCode < 0) { // Sequence
            var seq = this.decodeTableSeq[-uCode];
            if (!seq) throw new Error("Incorrect sequence table");
            for (var k = 0; k < seq.length; k++) {
                uCode = seq[k];
                newBuf[j++] = uCode & 0xFF;
                newBuf[j++] = uCode >> 8;
            }
            continue;
        }
        else if (uCode > 0xFFFF) { // Surrogates
            uCode -= 0x10000;
            var uCodeLead = 0xD800 + Math.floor(uCode / 0x400);
            newBuf[j++] = uCodeLead & 0xFF;
            newBuf[j++] = uCodeLead >> 8;

            uCode = 0xDC00 + uCode % 0x400;
        }

        // Write the character to buffer.
        newBuf[j++] = uCode & 0xFF;
        newBuf[j++] = uCode >> 8;
    }

    this.leadBytes = leadBytes;
    return newBuf.slice(0, j).toString('ucs2');
}

function decoderDBCSEnd() {
    if (this.leadBytes === -1)
        return;

    var ret = this.defaultCharUnicode;

    if (this.gb18030 && this.leadBytes >= 0x100) {
        if (this.leadBytes < 0x10000) 
            // Double byte lead: throw out first char, emit second char (it'll be '0'-'9').
            ret += String.fromCharCode(this.leadBytes & 0xFF); 
        else
            // Triple byte lead: throw out first char, emit second char (it'll be '0'-'9'), emit default for third char (its 0x81-0xFE).
            ret += String.fromCharCode((this.leadBytes >> 8) & 0xFF) + this.defaultCharUnicode; 
    }

    this.leadBytes = -1;
    return ret;
}

// Binary search for GB18030. Returns largest i such that table[i] <= val.
function findIdx(table, val) {
    if (table[0] > val)
        return -1;

    var l = 0, r = table.length;
    while (l < r-1) { // always table[l] <= val < table[r]
        var mid = l + Math.floor((r-l+1)/2);
        if (table[mid] <= val)
            l = mid;
        else
            r = mid;
    }
    return l;
}
