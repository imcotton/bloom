import { bloom_by, bloom_from } from "./bloom-classless.ts";
import { sample } from "./common.ts";
import { assert, assertEquals } from "jsr:@std/assert@^0.224.0";

Deno.test("should create bloom filter with correct properties", () => {
    const filter = bloom_by(4000, 0.0000001);
    assertEquals(filter.k, 23);
    assertEquals(filter.size, 16775);
});

Deno.test("should insert and lookup in a filter", () => {
    let filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter = filter.insert(uint8array);

    assertEquals(filter.lookup(uint8array), true);
});

Deno.test("should only have k non-zero buckets with 1 item inserted", () => {
    const filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    const dump = filter.insert(uint8array).dump().subarray(8 + 8);
    const count = dump.reduce((acc, n) => (n > 0) ? (acc + 1) : acc, 0);

    assertEquals(filter.k, count);
});

Deno.test("should not find random inputs in the filter", () => {
    let filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter = filter.batch_insert([ uint8array ]);
    assertEquals(filter.lookup(uint8array), true);

    const input2 = "hello world2";
    const encoder2 = new TextEncoder();
    const uint8array2 = encoder2.encode(input2);
    assertEquals(filter.lookup(uint8array2), false);
});

Deno.test("should insert, dump, read and then look up correctly", () => {
    let filter = bloom_by(4000, 0.0000001);
    const input = "hello world";
    const encoder = new TextEncoder();
    const uint8array = encoder.encode(input);
    filter = filter.insert(uint8array);
    assertEquals(filter.lookup(uint8array), true);

    const filter2 = bloom_from(filter.dump());
    assertEquals(filter2.lookup(uint8array), true);
});

Deno.test("should accept AsyncIterable as inserting source", async function () {

    const { async_batch_insert } = bloom_by(4000, 1e-9);

    const source = sample(5);

    const readable = ReadableStream.from(source);

    const { lookup } = await async_batch_insert(readable);

    assert(source.every(lookup), "every lookup");

});

Deno.test("should no false negative with full buckets", function () {

    const length = 4000;

    const source = sample(length);

    const { batch_insert } = bloom_by(length, 1e-9);
    const { lookup } = batch_insert(source);

    assert(    source.every(item => lookup(item) ===  true));
    assert(sample(20).every(item => lookup(item) === false));

});

