import type { BucketInfo, BloomParams } from "./utils.ts";
import { calc, from_dump, gen_dump, gen_buckets } from "./utils.ts";





export interface BloomClassless {

    /** number of buckets to check for the hash */
    readonly k: number;

    /** total size in bytes of the bloom filter */
    readonly size: number;

    dump(): Uint8Array;

    lookup(input: Uint8Array): boolean;

    /** **immutable** */
                insert(input:               Uint8Array):          BloomClassless;

    /** **immutable** */
          batch_insert(input:      Iterable<Uint8Array>):         BloomClassless;

    /** **immutable** */
    async_batch_insert(input: AsyncIterable<Uint8Array>): Promise<BloomClassless>;

}





/**
 * Create filter by total count and false positive rate.
 *
 * @param  n The number of total items in this filter.
 * @param fp The false positive rate of this filter.
 */
export function bloom_by (n: number, fp: number): BloomClassless {

    return gen_bloom(calc(n, fp));

}





/**
 * Create filter from raw bytes.
 *
 * @param dump The raw bytes generated from {@link BloomClassless.dump}
 */
export function bloom_from (dump: Uint8Array): BloomClassless {

    return gen_bloom(from_dump(dump));

}





function gen_bloom ({ k, size, filter = new Uint8Array(size) }: {

        k: number,
        size: number,
        filter?: Uint8Array,

}): BloomClassless {

    const next = gen_bloom_curried({ k, size });
    const buckets = gen_buckets({ k, size });
    const append = lift(buckets);

    return {

        k,

        size,

        dump () {

            return gen_dump({ k, size, filter });

        },

        lookup (input) {

            return !some(function ({ index, position }) {

                const bit = 1 << position;
                const value = at(filter, index) & bit;

                return value === 0;

            }, buckets(input));

        },

        insert (input) {

            return next(append(filter, input));

        },

        batch_insert (input) {

            return next(fold(append, filter, input));

        },

        async async_batch_insert (input) {

            return next(await async_fold(append, filter, input));

        },

    };

}





function gen_bloom_curried ({ k, size }: Omit<BloomParams, "filter">) {

    return function (filter: BloomParams["filter"]) {

        return gen_bloom({ k, size, filter });

    };

}





function lift (buckets: (_: Uint8Array) => Iterable<BucketInfo>) {

    return function (filter: Uint8Array, input: Uint8Array)  {

        return fold(function (acc, { index, position }) {

            const bit = 1 << position;
            const value = at(acc, index) | bit;

            return update(acc, { index, value });

        }, filter, buckets(input));

    };

}





function at (buf: Uint8Array, index: number) {

    return buf.at?.(index) ?? buf[index];

}





function update (buf: Uint8Array, { index, value }: {

        index: number,
        value: number,

}) {

    if (typeof buf.with === "function") {
        return buf.with(index, value);
    }

    const clone = typeof structuredClone === "function"
        ? structuredClone(buf, { transfer: [ buf.buffer ] })
        : Uint8Array.from(buf)
    ;

    clone[index] = value;

    return clone;

}





function some <T> (

        f: (x: T) => boolean,
        xs: Iterable<T>,

): boolean {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/some
    return xs.some?.(f) ?? Array.from(xs).some(f);

}





function fold <A, B> (

        f: (acc: A, x: B) => A,
        x: A,
        xs: Iterable<B>,

): A {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/reduce
    return xs.reduce?.(f, x) ?? Array.from(xs).reduce(f, x);

}





async function async_fold <A, B> (

        f: (acc: A, x: B) => A,
        x: A,
        xs: AsyncIterable<B>,

): Promise<A> {

    let result = x;

    for await (const item of xs) {
        result = f(result, item);
    }

    return result;

}

