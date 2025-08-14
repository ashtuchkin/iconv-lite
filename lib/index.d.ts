/*---------------------------------------------------------------------------------------------
 * REQUIREMENT: This definition is dependent on the @types/node definition.
 *
 * This file provides detailed typings for all encodings supported by iconv-lite,
 * based on the official wiki and source code:
 * https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
 *--------------------------------------------------------------------------------------------*/

// --- Unicode Encodings ---
type UnicodeEncoding =
  | "UTF7"
  | "UTF7-IMAP"
  | "UTF-16BE"
  | "UTF-16" // With BOM
  | "UCS-4"
  | "UTF-32" // With BOM, alias for UCS-4
  | "UTF-32LE"
  | "UTF-32BE";

// --- Single-byte Encodings ---

// Helper type for Windows codepage numbers
type WindowsCodepageNumber = "874" | "1250" | "1251" | "1252" | "1253" | "1254" | "1255" | "1256" | "1257" | "1258";

// Windows codepages with aliases (winXXX, cpXXX, XXX)
type WindowsCodepage =
  | WindowsCodepageNumber
  | `windows-${WindowsCodepageNumber}`
  | `win${WindowsCodepageNumber}`
  | `cp${WindowsCodepageNumber}`;

// Helper type for ISO codepage numbers
type ISOCodepageNumber = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "13" | "14" | "15" | "16";
type ISOCodepageAliasNumber =
  | "28591"
  | "28592"
  | "28593"
  | "28594"
  | "28595"
  | "28596"
  | "28597"
  | "28598"
  | "28599"
  | "28600"
  | "28601"
  | "28603"
  | "28604"
  | "28605"
  | "28606";

// ISO codepages with aliases
type ISOCodepage = `iso-8859-${ISOCodepageNumber}` | ISOCodepageAliasNumber | `cp${ISOCodepageAliasNumber}`;

// Helper type for IBM codepage numbers
type IBMCodepageNumber =
  | "437"
  | "737"
  | "775"
  | "850"
  | "852"
  | "855"
  | "856"
  | "857"
  | "858"
  | "860"
  | "861"
  | "862"
  | "863"
  | "864"
  | "865"
  | "866"
  | "869"
  | "922"
  | "1046"
  | "1124"
  | "1125"
  | "1129"
  | "1133"
  | "1161"
  | "1162"
  | "1163";

// IBM codepages with aliases (ibmXXX, csibmXXX, XXX)
type IBMCodepage =
  | IBMCodepageNumber
  | `CP${IBMCodepageNumber}`
  | `ibm${IBMCodepageNumber}`
  | `csibm${IBMCodepageNumber}`;

// Mac codepages
type MacCodepage =
  | "macCroatian"
  | "macCyrillic"
  | "macGreek"
  | "macIceland"
  | "macRoman"
  | "macRomania"
  | "macThai"
  | "macTurkish"
  | "macUkraine"
  | "macintosh"; // Alias for macRoman

// KOI8 codepages
type KOI8Codepage = "KOI8-R" | "KOI8-U" | "KOI8-RU" | "KOI8-T";

// Miscellaneous single-byte encodings
type MiscellaneousSingleByte =
  | "ARMSCII-8"
  | "RK1048"
  | "TCVN"
  | "GEORGIAN-ACADEMY"
  | "GEORGIAN-PS"
  | "PT154"
  | "VISCII"
  | "ISO646-CN"
  | "ISO646-JP"
  | "HP-ROMAN8"
  | "TIS620";

type SingleByteEncoding =
  | WindowsCodepage
  | ISOCodepage
  | IBMCodepage
  | MacCodepage
  | KOI8Codepage
  | MiscellaneousSingleByte;

// --- Multi-byte Encodings ---

// Japanese
type JapaneseEncoding = "Shift_JIS" | "Windows-31j" | "Windows932" | "EUC-JP";

// Chinese
type ChineseEncoding = "GB2312" | "GBK" | "GB18030" | "Windows936" | "EUC-CN";

// Korean
type KoreanEncoding = "KS_C_5601" | "Windows949" | "EUC-KR";

// Taiwan/Hong Kong
type TaiwanHongKongEncoding = "Big5" | "Big5-HKSCS" | "Windows950";

type MultiByteEncoding = JapaneseEncoding | ChineseEncoding | KoreanEncoding | TaiwanHongKongEncoding;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** A union of all supported encoding strings in `iconv-lite`. */
export type SupportedEncoding =
  | NodeJS.BufferEncoding
  | UnicodeEncoding
  | SingleByteEncoding
  | MultiByteEncoding
  | (string & {});

declare module "iconv-lite" {
  //   --- Basic API ---

  /** Decodes a `Buffer` into a `string`, using the provided `encoding`. */
  export function decode(buffer: Buffer | Uint8Array, encoding: SupportedEncoding, options?: DecodeOptions): string;

  /** Encodes a `string` into a `Buffer`, using the provided `encoding`. */
  export function encode(content: string, encoding: SupportedEncoding, options?: EncodeOptions): Buffer;

  /** Checks if a given encoding is supported by `iconv-lite`. */
  export function encodingExists(encoding: string): encoding is SupportedEncoding;

  //   --- Stream API ---

  /** Creates a stream that decodes binary data from a given `encoding` into strings. */
  export function decodeStream(encoding: SupportedEncoding, options?: DecodeOptions): NodeJS.ReadWriteStream;

  /** Creates a stream that encodes strings into binary data in a given `encoding`. */
  export function encodeStream(encoding: SupportedEncoding, options?: EncodeOptions): NodeJS.ReadWriteStream;

  //   --- Low-level stream APIs ---

  /** Creates and returns a low-level encoder stream. */
  export function getEncoder(encoding: SupportedEncoding, options?: EncodeOptions): EncoderStream;

  /** Creates and returns a low-level decoder stream. */
  export function getDecoder(encoding: SupportedEncoding, options?: DecodeOptions): DecoderStream;
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
