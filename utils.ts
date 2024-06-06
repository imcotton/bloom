import { hash32 } from "./murmur3.ts";

/**
 * @param input origin data to be sampled
 * @param index start from 0
 */
export type Hashing = (input: Uint8Array, index: number) => number;

/**
 * type to allow the Bloom constructor to initialize from a file
 */
export type BloomParams = { filter: Uint8Array; k: number; size: number };

/**
 * BucketInfo is returned by the buckets function and represents the byte index in the filter and the position within
 * that byte
 */
export type BucketInfo = { index: number; position: number };

/**
 * uint8ArrayToNumber converts a Uint8array to a javascript number
 * @param input array
 * @returns a javascript number
 */
export function uint8ArrayToNumber(input: Uint8Array): number {
    return input.reduceRight((acc, x) => (acc * 256) + x, 0);
}

/**
 * numberToUint8Array converts a number to a uint8array
 * @param n, the number to be converted
 * @return a Uint8Array representation of the number
 */
export function numberToUint8Array(n: number): Uint8Array {

    const from = Array.from<number>;
    const of = Array.of<number>;

    const result = from({ length: 8 }).reduce(({ acc, x }) => ({
        acc: acc.concat(x % 256),
        x: Math.floor(x / 256),
    }), {
        acc: of(),
        x: n,
    });

    return Uint8Array.from(result.acc);

}

export function gen_buckets({ k, size, hash = hash32 }: {

        k: number,
        size: number,
        hash?: Hashing,

}) {

    /**
     * buckets hashes k times and populate those buckets that get hit
     * @param input is the thing to be placed into the bloom filter
     * @return an array of which bucket and position the bit is in
     */
    return function*(input: Uint8Array): Iterable<BucketInfo> {

        for (let i = 0; i < k; i += 1) {

            const sum = hash(input, i);
            const next = sum % (size * 8);

            const index = next >> 3;
            const position = next % 8;

            yield { index, position };

        }

    }

}

export function calc(n: number, fp: number): Omit<BloomParams, "filter"> {

    const LN2_SQUARED = Math.LN2 ** 2;

    const d = -n * Math.log(fp);
    const m = Math.ceil(d / LN2_SQUARED);
    const k = Math.round((m / n) * Math.LN2);
    const size = Math.ceil((m + 8) / 8);

    return { k, size };

}

export function gen_dump({ k, size, filter }: BloomParams): Uint8Array {

    const buf = new Uint8Array(8 + 8 + size);

    buf.set(numberToUint8Array(k), 0);
    buf.set(numberToUint8Array(size), 8);
    buf.set(filter, 8 + 8);

    return buf;

}

export function from_dump(input: Uint8Array): BloomParams {

    const k = uint8ArrayToNumber(input.subarray(0, 8));
    const size = uint8ArrayToNumber(input.subarray(8, 16));
    const filter = input.subarray(16, size + 16);

    return { k, size, filter };

}

