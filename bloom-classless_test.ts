import { bloom_by, gen_bloom, at, modify } from "./bloom-classless.ts";
import { assert, assertEquals } from "jsr:@std/assert@^0.224.0";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";





Deno.test("should accept AsyncIterable as inserting source", async function () {

    const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

    const { async_batch_insert } = bloom_by(4000, 1e-9);

    const source = Array.from({ length: 5 }, function () {
        return rand(32);
    });

    const readable = ReadableStream.from(source);

    const { lookup } = await async_batch_insert(readable);

    assert(source.every(lookup), "every lookup");

    assert(lookup(rand(32)) === false, "false positive");

});





describe("gen_bloom", function () {

    it("ok with empty filter", function () {

        const filter = Uint8Array.of();

        let bloom = gen_bloom({ k: 2, size: 100, filter });

        assert(bloom.lookup(Uint8Array.of(1)) === false);

        bloom = bloom.insert(Uint8Array.of(2));

        assert(bloom.lookup(Uint8Array.of(1)) === false);

    });

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

