import { bloom_by } from "./bloom-classless.ts";
import { assert } from "jsr:@std/assert@^0.204.0";





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

