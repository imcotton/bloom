import { gen_bloom, at, modify, bloom_by } from "./bloom-classless.ts";
import fnv1a from "./hashing/fnv1a.ts";
import fnv1a_deno from "./hashing/fnv1a-deno.ts";
import type { Hashing } from "./utils.ts";
import { sample } from "./common.ts";

// @deno-types="npm:@types/murmurhash3js-revisited"
import murmurhash3js from "npm:murmurhash3js-revisited@^3.0.0";

// @deno-types="npm:@types/xxhashjs"
import xxhashjs from "npm:xxhashjs@~0.2.2";

import { assert, assertEquals } from "jsr:@std/assert@^0.224.0";
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

        fnv1a,

        fnv1a_deno,

        murmur3: murmurhash3js.x86.hash32,

        xxhash (buf, i) {
            return xxhashjs.h32(buf.buffer, i).toNumber();
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

    it("resulting same between fnv1a and fnv1a-deno", function () {

        const buf = crypto.getRandomValues(new Uint8Array(8));

        assertEquals(
            fnv1a(     buf, 42),
            fnv1a_deno(buf, 42),
            encodeHex(buf),
        );

    });

});

