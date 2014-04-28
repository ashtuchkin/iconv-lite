
// Double-byte codec. This scheme is widespread and consists of 2 tables:
//  1. Single-byte: mostly just ASCII, but can be more complex.
//  2. Double-byte with leading byte not assigned in single-byte.

// To save memory, we read table files only when requested.

exports._dbcs = function(options) {
    if (!options)
        throw new Error("DBCS codec is called without the data.")
    if (!options.table)
        throw new Error("Encoding '" + options.type + "' has no data.");
    
    // Fill out DBCS -> Unicode decoding tables
    var decodeLead = [];
    for (var i = 0; i < 0x100; i++)
        decodeLead[i] = -1; // Unassigned.

    var decodeTable = [];
    for (var i = 0; i < 0x8000; i++)
        decodeTable[i] = -1; // Unassigned.

    var decodeTableSeq = [null, null, null]; // Sequences, start with 3. (they are designated by negative indexes and -1 is reserved for undefined, -2: leading byte)

    if (!options.table.map) options.table = [options.table];
    for (var i = 0; i < options.table.length; i++) {
        var table = require(options.table[i]);
        for (var j = 0; j < table.length; j++) { // Chunks.
            var chunk = table[j];
            var curAddr = parseInt(chunk[0], 16), writeTable;
            
            if (curAddr < 0x100) {
                writeTable = decodeLead;
            }
            else if (curAddr < 0x10000) {
                if (decodeLead[curAddr >> 8] >= 0)
                    throw new Error("Overwrite lead byte in table " + options.table + ": " + chunk[0]);
                
                decodeLead[curAddr >> 8] = -2; // DBCS lead byte.
                writeTable = decodeTable;
                curAddr -= 0x8000;
                if (curAddr < 0)
                    throw new Error("DB address < 0x8000 in table " + options.table + ": " + chunk[0]);
            }
            else
                throw new Error("Unsupported address in table " + options.table + ": " + chunk[0]);

            for (var k = 1; k < chunk.length; k++) {
                var part = chunk[k];
                if (typeof part === "string") { // String, write as-is.
                    for (var l = 0; l < part.length;) {
                        var code = part.charCodeAt(l++);
                        if (0xD800 <= code && code < 0xDC00) { // Surrogate
                            var codeTrail = part.charCodeAt(l++);
                            if (0xDC00 <= codeTrail && codeTrail < 0xE000)
                                writeTable[curAddr++] = 0x10000 + (code - 0xD800) * 0x400 + (codeTrail - 0xDC00);
                            else
                                throw new Error("Incorrect surrogate pair in table " + options.table + ": " + chunk[0]);
                        }
                        else if (0x0FF0 < code && code <= 0x0FFF) { // Character sequence (our own encoding)
                            var len = 0xFFF - code + 2;
                            var seq = [];
                            for (var m = 0; m < len; m++)
                                seq.push(part.charCodeAt(l++)); // Simple variation: don't support surrogates or subsequences in seq.

                            decodeTableSeq.push(seq);
                            writeTable[curAddr++] = -(decodeTableSeq.length-1); // negative char code -> sequence idx.
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
                    throw new Error("Incorrect value type '" + typeof part + "' in table " + options.table + ": " + chunk[0]);
            }
        }
    }

    // Unicode -> DBCS. Split table in smaller tables by 256 chars each.
    var encodeTable = [];
    var encodeTableSeq = [null, null, null];
    // for (var i = 0; i < 0x1100; i++) // Handle all 17 Unicode planes.
    //     encodeTable[i] = null; // Unassigned

    var tables = [[decodeTable, 0x8000], [decodeLead, 0]];
    for (var t = 0; t < tables.length; t++) {
        var table = tables[t][0], offset = tables[t][1];
        for (var i = 0; i < table.length; i++) {
            var uCode = table[i];
            if (uCode >= 0) {
                var high = uCode >> 8; // This could be > 0xFF because of astral characters.
                var low = uCode & 0xFF;
                var subtable = encodeTable[high];
                if (subtable === undefined) {
                    encodeTable[high] = subtable = [];
                    for (var j = 0; j < 0x100; j++)
                        subtable[j] = -1;
                }
                if (subtable[low] < -2)
                    encodeTableSeq[-subtable[low]][-1] = i + offset;
                else
                    subtable[low] = i + offset;
            }
            else if (uCode < -2) { // Sequence.
                var seq = decodeTableSeq[-uCode];
                //console.log((i+offset).toString(16), uCode, seq.map(function(uCode) {return uCode.toString(16)}));
                uCode = seq[0];

                var high = uCode >> 8;
                var low = uCode & 0xFF;
                var subtable = encodeTable[high];
                if (subtable === undefined) {
                    encodeTable[high] = subtable = [];
                    for (var j = 0; j < 0x100; j++)
                        subtable[j] = -1;
                }

                var seqObj;
                if (subtable[low] < -1)
                    seqObj = encodeTableSeq[-subtable[low]];
                else {
                    seqObj = {};
                    if (subtable[low] !== -1) seqObj[-1] = subtable[low];
                    encodeTableSeq.push(seqObj);
                    subtable[low] = -(encodeTableSeq.length - 1);
                }

                for (var j = 1; j < seq.length; j++) {
                    uCode = seq[j];
                    if (j === seq.length-1) {
                        seqObj[uCode] = i + offset;
                    } else {
                        var oldVal = seqObj[uCode];
                        if (typeof oldVal === 'object')
                            seqObj = oldVal;
                        else {
                            seqObj = seqObj[uCode] = {}
                            if (oldVal !== undefined)
                                seqObj[-1] = oldVal
                        }
                    }
                }
            }
        }
    }

    var defCharSB  = encodeTable[0][options.iconv.defaultCharSingleByte.charCodeAt(0)];
    if (defCharSB === -1) defCharSB = encodeTable[0]['?'];
    if (defCharSB === -1) defCharSB = "?".charCodeAt(0);

    return {
        encoder: encoderDBCS,
        decoder: decoderDBCS,

        decodeLead: decodeLead,
        decodeTable: decodeTable,
        decodeTableSeq: decodeTableSeq,
        defaultCharUnicode: options.iconv.defaultCharUnicode,

        encodeTable: encodeTable,
        encodeTableSeq: encodeTableSeq,
        defaultCharSingleByte: defCharSB,
    };
}

function encoderDBCS(options) {
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
        defaultCharSingleByte: this.defaultCharSingleByte,
    }
}

function encoderDBCSWrite(str) {
    var newBuf = new Buffer(str.length*2), 
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
            
            if (dbcsCode < -2) { // Sequence start
                seqObj = this.encodeTableSeq[-dbcsCode];
                continue;
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



function decoderDBCS(options) {
    return {
        // Methods
        write: decoderDBCSWrite,
        end: decoderDBCSEnd,

        // Decoder state
        leadByte: -1,

        // Static data
        decodeLead: this.decodeLead,
        decodeTable: this.decodeTable,
        decodeTableSeq: this.decodeTableSeq,
        defaultCharUnicode: this.defaultCharUnicode,
    }
}

function decoderDBCSWrite(buf) {
    var newBuf = new Buffer(buf.length*2),
        leadByte = this.leadByte, uCode;
    
    for (var i = 0, j = 0; i < buf.length; i++) {
        var curByte = buf[i];
        if (leadByte === -1) { // We have no leading byte in buffer.
            uCode = this.decodeLead[curByte];
            if (uCode === -2) { // Check if this is a leading byte of a double-byte char sequence.
                leadByte = curByte; 
                continue;
            }
        } else { // curByte is a trailing byte in double-byte char sequence.
            uCode = this.decodeTable[(leadByte << 8) + curByte - 0x8000];
            leadByte = -1;
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

    this.leadByte = leadByte;
    return newBuf.slice(0, j).toString('ucs2');
}

function decoderDBCSEnd() {
    if (this.leadByte !== -1) {
        this.leadByte = -1;
        return this.defaultCharUnicode; // Incomplete character at the end. TODO: Callback.
    }
}

