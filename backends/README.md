# iconv-lite backends

To accomodate different environments (most notably Node.js and Browser) in an efficient manner, iconv-lite has a concept of 'backends'.
Backends convert internal data representations to what customers expect.

Here's the overview of the data types used in iconv-lite codecs:

| &nbsp;                         | encoder           | decoder                                    |
| ------------------------------ | ----------------- | ------------------------------------------ |
| input type                     | js string         | Uint8Array, Buffer or any array with bytes |
| input internal representation  | js string         | same as input                              |
| input data access              | str.charCodeAt(i) | bytes[i]                                   |
| output type                    | Backend Bytes     | js string                                  |
| output internal representation | Uint8Array        | Uint16Array                                |
| output data writing            | bytes[i]          | rawChars[i]                                |

The reasoning behind this choice is the following:

-   For inputs, we try to use passed-in objects directly and not convert them,
    to avoid perf hit. For decoder inputs that means that all codecs need to
    be able to work with both Uint8Array-s and Buffer-s at the same time.
-   For outputs, we standardize internal representation (what codecs works with)
    to Uint8Array and Uint16Array because that seems to be the lowest common denominator between the
    backends (Buffer can be interchanged with Uint8Array) that is not sacrificing performance.

## Backend interface

```typescript

BackendBytes = .. // Depends on the backend

interface IconvLiteBackend {
    // Encoder output: allocBytes() -> use Uint8Array -> bytesToResult().
    allocBytes(numBytes: int, fill: int): Uint8Array;
    bytesToResult(bytes: Uint8Array, finalLen: int): BackendBytes;
    concatByteResults(bufs: BackendBytes[]): BackendBytes;

    // Decoder output: allocRawChars -> use Uint16Array -> rawCharsToResult().
    allocRawChars(numChars: int): Uint16Array;
    rawCharsToResult(rawChars: Uint16Array, finalLen: int): string;

    // TODO: We'll likely add some more methods here for additional performance
};
```

## Codec pseudocode

```js
class Encoder {
    write(str) {
        const bytes = this.backend.allocBytes(str.length * max_bytes_per_char);
        let bytesPos = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);  // todo: handle surrogates.
            // convert char to bytes
            bytes[bytesPos++] = byte1;
            ...
        }
        return this.backend.bytesToResult(bytes, bytesPos);
    }
}

class Decoder {
    write(buf) {  // NOTE: buf here can be Uint8Array, Buffer or regular array.
        const chars = this.backend.allocRawChars(buf.length * max_chars_per_byte);
        let charsPos = 0;
        for (let i = 0; i < buf.length; i++) {
            let byte1 = buf[i];
            // convert byte(s) to char
            chars[charsPos++] = char; // todo: handle surrogates.
            ...
        }
        return this.backend.rawCharsToResult(chars, charsPos);
    }
}
```
