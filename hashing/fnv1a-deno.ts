import { encodeHex }          from "jsr:@std/encoding@^0.224.3/hex";
import { crypto as std_crypto } from "jsr:@std/crypto@^0.224.0/crypto";

import { modify } from "../bloom-classless.ts";





/**
 * via Deno native crypto.subtle.digestSync("FNV32A")
 */
export default function (buf: Uint8Array, i: number): number {

    const salted = modify(buf, 0, n => n ^ i);
    const ab = std_crypto.subtle.digestSync("FNV32A", salted);

    return Number(BigInt("0x".concat(encodeHex(ab))));

};

