/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *  REQUIREMENT: This definition is dependent on the @types/node definition.
 *  Install with `npm install @types/node --save-dev`
 *--------------------------------------------------------------------------------------------*/

export declare function decode(buffer: NodeBuffer, encoding: string, options?: Options): string;

export declare function encode(content: string, encoding: string, options?: Options): NodeBuffer;

export declare function encodingExists(encoding: string): boolean;

export declare function decodeStream(encoding: string, options?: Options): NodeJS.ReadWriteStream;

export declare function encodeStream(encoding: string, options?: Options): NodeJS.ReadWriteStream;

export interface Options {
    stripBOM?: boolean;
    addBOM?: boolean;
    defaultEncoding?: string;
}
