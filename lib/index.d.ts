/*---------------------------------------------------------------------------------------------
 * REQUIREMENT: This definition is dependent on the @types/node definition.
 *
 * This file provides detailed typings for all encodings supported by iconv-lite,
 * based on the official wiki and source code:
 * https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
 *--------------------------------------------------------------------------------------------*/

// --- Unicode Encodings ---
type UnicodeEncoding =
  | "utf7"
  | "utf7imap"
  | "utf16be"
  | "utf16" // With BOM
  | "ucs4"
  | "utf32" // With BOM, alias for UCS-4
  | "utf32le"
  | "utf32be";

// --- Single-byte Encodings ---

// Helper type for Windows codepage numbers
type WindowsCodepageNumber = "874" | "1250" | "1251" | "1252" | "1253" | "1254" | "1255" | "1256" | "1257" | "1258";

// Windows codepages with aliases (windows-XXX, winXXX, cpXXX, XXX)
type WindowsCodepage =
  | WindowsCodepageNumber
  | `windows-${WindowsCodepageNumber}`
  | `windows${WindowsCodepageNumber}`
  | `win${WindowsCodepageNumber}`
  | `cp${WindowsCodepageNumber}`
  | "msee"
  | "mscyrl"
  | "msansi"
  | "msgreek"
  | "msturk"
  | "mshebr"
  | "msarab"
  | "winbaltrim";

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
type ISOCodepage =
  | `iso-8859-${ISOCodepageNumber}`
  | `iso8859${ISOCodepageNumber}`
  | ISOCodepageAliasNumber
  | `cp${ISOCodepageAliasNumber}`
  | "latin1"
  | "latin2"
  | "latin3"
  | "latin4"
  | "latin5"
  | "latin6"
  | "latin7"
  | "latin8"
  | "latin9"
  | "latin10"
  | "csisolatin1"
  | "csisolatin2"
  | "csisolatin3"
  | "csisolatin4"
  | "csisolatincyrillic"
  | "csisolatinarabic"
  | "csisolatingreek"
  | "csisolatinhebrew"
  | "csisolatin5"
  | "csisolatin6"
  | "l1"
  | "l2"
  | "l3"
  | "l4"
  | "l5"
  | "l6"
  | "l7"
  | "l8"
  | "l9"
  | "l10"
  | "isoir100"
  | "isoir101"
  | "isoir109"
  | "isoir110"
  | "isoir144"
  | "isoir127"
  | "isoir126"
  | "isoir138"
  | "isoir148"
  | "isoir157"
  | "isoir179"
  | "isoir199"
  | "isoir203"
  | "isoir226"
  | "cp819"
  | "ibm819"
  | "cyrillic"
  | "arabic"
  | "arabic8"
  | "ecma114"
  | "asmo708"
  | "greek"
  | "greek8"
  | "ecma118"
  | "elot928"
  | "hebrew"
  | "hebrew8"
  | "turkish"
  | "turkish8"
  | "thai"
  | "thai8"
  | "celtic"
  | "celtic8"
  | "isoceltic";

// Helper type for IBM codepage numbers
type IBMCodepageNumber =
  | "437"
  | "720"
  | "737"
  | "775"
  | "808"
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
  | `cp${IBMCodepageNumber}`
  | `ibm${IBMCodepageNumber}`
  | `csibm${IBMCodepageNumber}`
  | "cspc8codepage437"
  | "cspc775baltic"
  | "cspc850multilingual"
  | "cspcp852"
  | "cspc862latinhebrew"
  | "cpgr";

// Mac codepages
type MacCodepage =
  | "maccroatian"
  | "maccyrillic"
  | "macgreek"
  | "maciceland"
  | "macroman"
  | "macromania"
  | "macthai"
  | "macturkish"
  | "macukraine"
  | "maccenteuro"
  | "10000"
  | "10006"
  | "10007"
  | "10029"
  | "10079"
  | "10081";

// KOI8 codepages
type KOI8Codepage =
  | "koi8r"
  | "koi8u"
  | "koi8ru"
  | "koi8t"
  | "cp20866"
  | "20866"
  | "ibm878"
  | "cskoi8r"
  | "cp21866"
  | "21866"
  | "ibm1168";

// Miscellaneous single-byte encodings
type MiscellaneousSingleByte =
  | "armscii8"
  | "rk1048"
  | "strk10482002"
  | "tcvn"
  | "tcvn5712"
  | "tcvn57121"
  | "georgianacademy"
  | "georgianps"
  | "pt154"
  | "viscii"
  | "iso646cn"
  | "gb198880"
  | "cn"
  | "isoir57"
  | "iso646jp"
  | "isoir14"
  | "csiso14jisc6220ro"
  | "jisc62201969ro"
  | "jp"
  | "hproman8"
  | "cshproman8"
  | "r8"
  | "roman8"
  | "xroman8"
  | "ibm1051"
  | "macintosh"
  | "mac"
  | "csmacintosh"
  | "ascii"
  | "ascii8bit"
  | "usascii"
  | "ansix34"
  | "ansix341968"
  | "ansix341986"
  | "csascii"
  | "cp367"
  | "ibm367"
  | "isoir6"
  | "iso646us"
  | "iso646irv"
  | "us"
  | "tis620"
  | "isoir166"
  | "tis6200"
  | "tis62025291"
  | "tis62025330"
  | "cp720"
  | "mik";

type SingleByteEncoding =
  | WindowsCodepage
  | ISOCodepage
  | IBMCodepage
  | MacCodepage
  | KOI8Codepage
  | MiscellaneousSingleByte;

// --- Multi-byte Encodings ---

// Japanese
type JapaneseEncoding =
  | "shiftjis"
  | "csshiftjis"
  | "mskanji"
  | "sjis"
  | "windows31j"
  | "ms31j"
  | "xsjis"
  | "windows932"
  | "ms932"
  | "932"
  | "cp932"
  | "eucjp";

// Chinese
type ChineseEncoding =
  | "gb2312"
  | "gb231280"
  | "gb23121980"
  | "csgb2312"
  | "csiso58gb231280"
  | "euccn"
  | "windows936"
  | "ms936"
  | "936"
  | "cp936"
  | "gbk"
  | "xgbk"
  | "isoir58"
  | "gb18030"
  | "chinese";

// Korean
type KoreanEncoding =
  | "windows949"
  | "ms949"
  | "949"
  | "cp949"
  | "cseuckr"
  | "csksc56011987"
  | "euckr"
  | "isoir149"
  | "korean"
  | "ksc56011987"
  | "ksc56011989"
  | "ksc5601";

// Taiwan/Hong Kong
type TaiwanHongKongEncoding =
  | "windows950"
  | "ms950"
  | "950"
  | "cp950"
  | "big5"
  | "big5hkscs"
  | "cnbig5"
  | "csbig5"
  | "xxbig5";

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
