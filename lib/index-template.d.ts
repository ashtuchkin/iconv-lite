/*---------------------------------------------------------------------------------------------
 * REQUIREMENT: This definition is dependent on the @types/node definition.
 *
 * `npm install --save-dev @types/node`
 *
 * This file provides detailed typings for all encodings supported by iconv-lite,
 * based on the official wiki and source code:
 * https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
 *--------------------------------------------------------------------------------------------*/

/** A union of all supported encoding strings in `iconv-lite`. */
// --SUPPORTED-ENCODINGS-PLACEHOLDER--

export interface DecodeOptions {
  /** Strips the byte order mark (BOM) from the input, when decoding. @default true */
  stripBOM?: boolean;
  /** Overrides the default endianness for `UTF-16` and `UTF-32` decodings. */
  defaultEncoding?: "utf16be" | "utf32be";
}

export interface EncodeOptions {
  /** Adds a byte order mark (BOM) to the output, when encoding. @default false */
  addBOM?: boolean;
  /** Overrides the default endianness for `UTF-32` encoding. */
  defaultEncoding?: "utf32be";
}

export interface EncoderStream {
  write(str: string): Buffer;
  end(): Buffer | undefined;
}

export interface DecoderStream {
  write(buf: Buffer): string;
  end(): string | undefined;
}

declare const iconv: {
  //   --- Basic API ---

  /** Decodes a `Buffer` into a `string`, using the provided `encoding`. */
  decode(buffer: Buffer | Uint8Array, encoding: SupportedEncoding, options?: DecodeOptions): string;

  /** Encodes a `string` into a `Buffer`, using the provided `encoding`. */
  encode(content: string, encoding: SupportedEncoding, options?: EncodeOptions): Buffer;

  /** Checks if a given encoding is supported by `iconv-lite`. */
  encodingExists(encoding: string): encoding is SupportedEncoding;

  //   --- Stream API ---

  /** Creates a stream that decodes binary data from a given `encoding` into strings. */
  decodeStream(encoding: SupportedEncoding, options?: DecodeOptions): NodeJS.ReadWriteStream;

  /** Creates a stream that encodes strings into binary data in a given `encoding`. */
  encodeStream(encoding: SupportedEncoding, options?: EncodeOptions): NodeJS.ReadWriteStream;

  //   --- Low-level stream APIs ---

  /** Creates and returns a low-level encoder stream. */
  getEncoder(encoding: SupportedEncoding, options?: EncodeOptions): EncoderStream;

  /** Creates and returns a low-level decoder stream. */
  getDecoder(encoding: SupportedEncoding, options?: DecodeOptions): DecoderStream;
};

export default iconv;
