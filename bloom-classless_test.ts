import { gen_bloom, at, modify, bloom_by } from "./bloom-classless.ts";
import type { Hashing } from "./utils.ts";
import { sample } from "./common.ts";

// @deno-types="npm:@types/murmurhash3js-revisited"
import murmurhash3js from "npm:murmurhash3js-revisited@^3.0.0";

// @deno-types="npm:@types/xxhashjs"
import xxhashjs from "npm:xxhashjs@~0.2.2";

import fnv1a from "npm:@sindresorhus/fnv1a@^3.1.0";

import { assert, assertEquals } from "jsr:@std/assert@^0.224.0";
import { crypto as std_crypto } from "jsr:@std/crypto@^0.224.0";
import { encodeHex }          from "jsr:@std/encoding@^0.224.3";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";





describe("gen_bloom", function () {

    it("ok with empty filter", function () {

        const filter = Uint8Array.of();

        let bloom = gen_bloom({ k: 2, size: 100, filter });

        assert(bloom.lookup(Uint8Array.of(1)) === false);

        bloom = bloom.insert(Uint8Array.of(2));

        assert(bloom.lookup(Uint8Array.of(1)) === false);

    });

});





describe("swap", function () {

    const length = 1000;

    const source = sample(length);

    const algos = {

        murmur3: murmurhash3js.x86.hash32,

        xxhash (buf, i) {
            return xxhashjs.h32(buf.buffer, i).toNumber();
        },

        fnv1 (buf, i) {
            const salted = modify(buf, 0, n => n ^ i);
            const ab = std_crypto.subtle.digestSync("FNV32", salted);
            return Number(BigInt("0x".concat(encodeHex(ab))));
        },

        fnv1a (buf, i) {
            const salted = modify(buf, 0, n => n ^ i);
            return Number(fnv1a(salted, { size: 32 }));
        },

    } satisfies Record<string, Hashing>;

    for (const [ name, hash ] of Object.entries(algos)) {

        it(`can switch to ${ name }`, function () {

            const { batch_insert } = bloom_by(length, 1e-7).swap(hash);
            const { lookup } = batch_insert(source);

            assert(    source.every(item => lookup(item) ===  true));
            assert(sample(20).every(item => lookup(item) === false));

        });

    }

});





describe("Misc", function () {

    it("at", function () {
        assert(at(Uint8Array.of(9), 0) === 9);
        assert(at(Uint8Array.of(1), 5) == null);
    });

    it("modify", function () {

        assertEquals(
            modify(Uint8Array.from([ 1, 2, 3 ]), 1, () => 9),
                   Uint8Array.from([ 1, 9, 3 ]),
        );

        assertEquals(
            modify(Uint8Array.from([ 1, 2, 3 ]), 5, () => 9),
                   Uint8Array.from([ 1, 2, 3 ]),
        );

    });

});

