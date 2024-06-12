import fnv1a from "npm:@sindresorhus/fnv1a@^3.1.0";

import { modify } from "../bloom-classless.ts";





/**
 * via npm:@sindresorhus/fnv1a
 */
export default function (buf: Uint8Array, i: number): number {

    const salted = modify(buf, 0, n => n ^ i);

    return Number(fnv1a(salted, { size: 32 }));

};

