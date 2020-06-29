// NOTE: This type definition uses Node.js types. To enable them in Typescript do the following:
// 1. Add "@types/node" npm package to your project.
// 2. Check "compilerOptions" - "types" array in tsconfig.json. If it's present, make sure there's "node" in it.
//    (see https://www.typescriptlang.org/tsconfig#types)

// Options that can be provided to encoding/decoding functions.
export interface EncodeOptions {
    // Adds BOM to the output data. Default is false.
    addBOM?: boolean;
}

export interface DecodeOptions {
    // Removes BOM from the input data when decoding. Default is true.
    // If a callback is provided, then it will be called when BOM is encountered.
    stripBOM?: boolean | (() => void);  
    
    // (only utf-16 and utf-32 encodings) - when endianness detection algorithm fails, this
    // encoding will be used.
    defaultEncoding?: string;
}

// Basic API
export function encode(content: string, encoding: string, options?: EncodeOptions): Buffer;
export function decode(buffer: Buffer | Uint8Array, encoding: string, options?: DecodeOptions): string;
export function encodingExists(encoding: string): boolean;

// Stream API
export function encodeStream(encoding: string, options?: EncodeOptions): NodeJS.ReadWriteStream;
export function decodeStream(encoding: string, options?: DecodeOptions): NodeJS.ReadWriteStream;

// Low-level stream APIs
export function getEncoder(encoding: string, options?: EncodeOptions): EncoderStream;
export function getDecoder(encoding: string, options?: DecodeOptions): DecoderStream;

export interface EncoderStream {
    write(str: string): Buffer;
    end(): Buffer | undefined;
}

export interface DecoderStream {
    write(buf: Buffer | Uint8Array): string;
    end(): string | undefined;
}

// Low-level codec APIs
export function getCodec(encoding: string): IconvCodec;

export interface IconvCodec {
    encoder: EncoderStreamConstructor;
    decoder: DecoderStreamConstructor;
    bomAware?: boolean;
}

export interface EncoderStreamConstructor {
    new (options: object | undefined, codec: IconvCodec): EncoderStream;
}

export interface DecoderStreamConstructor {
    new (options: object | undefined, codec: IconvCodec): DecoderStream;
}
