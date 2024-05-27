import { hash32 } from "./murmur3.ts";

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
function uint8ArrayToNumber(input: Uint8Array): number {
    return Array.from(input).reduceRight((acc, x) => (acc << 8) + x, 0);
}

/**
 * numberToUint8Array converts a number to a uint8array
 * @param n, the number to be converted
 * @return a Uint8Array representation of the number
 */
function numberToUint8Array(n: number): Uint8Array {

    const result = Array.from({ length: 8 }).reduce(({ acc, x }) => ({
        acc: acc.concat(x & 0xFF),
        x: x >> 8,
    }), {
        acc: [],
        x: n,
    });

    return Uint8Array.from(result.acc);

}

/**
 * type to allow the Bloom constructor to initialize from a file
 */
export type BloomParams = { filter: Uint8Array; k: number; size: number };

export function gen_buckets({ k, size }: Omit<BloomParams, "filter">) {

    /**
     * buckets hashes k times and populate those buckets that get hit
     * @param input is the thing to be placed into the bloom filter
     * @return an array of which bucket and position the bit is in
     */
    return function(input: Uint8Array): Array<BucketInfo> {

        return Array.from({ length: k }, (_, i) => {

            const sum = hash32(input, i);
            const next = sum % size;

            const index = next >> 3;
            const position = next % 8;

            return { index, position };

        });

    }

}

export function calc(n: number, fp: number): Omit<BloomParams, "filter"> {

    const m = Math.ceil(n * Math.log(fp)) / Math.log(1.0 / Math.pow(2, Math.log(2)));
    const k = Math.round((m / n) * Math.log(2));
    const size = Math.floor(Math.ceil((m + 8.0) / 8.0));

    return { k, size };

}

export function gen_dump(that: BloomParams): Uint8Array {
    const k = numberToUint8Array(that.k);
    const size = numberToUint8Array(that.size);

    const buf = new Uint8Array(8 + 8 + that.size).fill(0);
    buf.set(k, 0);
    buf.set(size, 8);
    buf.set(that.filter, 16);

    return buf;
}

export function from_dump(input: Uint8Array): BloomParams {
    const k = uint8ArrayToNumber(input.subarray(0, 8));
    const size = uint8ArrayToNumber(input.subarray(8, 16));
    const filter = input.subarray(16, size + 16);
    return { filter, k, size };
}

