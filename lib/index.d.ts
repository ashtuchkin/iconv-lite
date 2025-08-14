/*---------------------------------------------------------------------------------------------
 * REQUIREMENT: This definition is dependent on the @types/node definition.
 *
 * This file provides detailed typings for all encodings supported by iconv-lite,
 * based on the official wiki:
 * https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
 *--------------------------------------------------------------------------------------------*/

declare module 'iconv-lite' {
  //   --- Basic API ---

  /** Decodes a `Buffer` into a `string`, using the provided `encoding`. */
	export function decode(buffer: Buffer | Uint8Array, encoding: string, options?: DecodeOptions): string;

  /** Encodes a `string` into a `Buffer`, using the provided `encoding`. */
	export function encode(content: string, encoding: string, options?: EncodeOptions): Buffer;

  /** Checks if a given encoding is supported by `iconv-lite`. */
	export function encodingExists(encoding: string): boolean;

  //   --- Stream API ---

  /** Creates a stream that decodes binary data from a given `encoding` into strings. */
	export function decodeStream(encoding: string, options?: DecodeOptions): NodeJS.ReadWriteStream;

  /** Creates a stream that encodes strings into binary data in a given `encoding`. */
	export function encodeStream(encoding: string, options?: EncodeOptions): NodeJS.ReadWriteStream;

  //   --- Low-level stream APIs ---

  /** Creates and returns a low-level encoder stream. */
	export function getEncoder(encoding: string, options?: EncodeOptions): EncoderStream;

  /** Creates and returns a low-level decoder stream. */
	export function getDecoder(encoding: string, options?: DecodeOptions): DecoderStream;
}

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
