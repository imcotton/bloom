import type { BucketInfo, BloomParams } from "./utils.ts";
import { calc, from_dump, gen_dump, gen_buckets } from "./utils.ts";





/**
 * **NOT** a `class`
 */
export interface BloomClassless {

    /** number of buckets to check for the hash */
    readonly k: number;

    /** total size in bytes of the bloom filter */
    readonly size: number;

    /**
     * dump will convert the entire bloom filter to a `Uint8Array` for storing,
     * this will contain all information in order to re-hydrate this bloom
     * filter using the {@linkcode bloom_from} function
     */
    dump (): Uint8Array;

    /** lookup returns true if the input is in the filter, false otherwise */
    lookup (input: Uint8Array): boolean;

    /**
     * **immutable**, insert will flip all the bits to 1 corresponding
     * to the input hash by returning **new** created bloom filter
     */
                insert (input:               Uint8Array):          BloomClassless;

    /**
     * **immutable**, same as `insert` but accept `Iterable`
     * such as `Array` or `Set`, etc...
     */
          batch_insert (input:      Iterable<Uint8Array>):         BloomClassless;

    /**
     * **immutable**, same as `batch_insert` but accept `AsyncIterable`
     * such as `ReadableStream`
     */
    async_batch_insert (input: AsyncIterable<Uint8Array>): Promise<BloomClassless>;

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





export function gen_bloom ({ k, size, filter = new Uint8Array(size) }: {

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

            return every(function ({ index, position }) {

                const bit = 1 << position;
                const value = at(filter, index) ?? 0;

                return (value & bit) !== 0;

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

            return modify(acc, index, value => value | bit);

        }, filter, buckets(input));

    };

}





export function at (buf: Uint8Array, index: number): number | undefined {

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





export function modify (

        buf: Uint8Array,
        index: number,
        map: (n: number) => number,

) {

    const value = at(buf, index);

    if (value != null) {
        return update(buf, { index, value: map(value) });
    }

    return buf;

}





function every <T> (

        f: (x: T) => boolean,
        xs: Iterable<T>,

): boolean {

    // @ts-ignore https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/every
    return xs.every?.(f) ?? Array.from(xs).every(f);

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

