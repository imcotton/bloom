import type { BloomParams } from "./utils.ts";
import * as utils from "./utils.ts";

export class Bloom {
    public readonly filter: Uint8Array;
    // number of buckets to check for the hash
    readonly k: number;
    // total size in bytes of the bloom filter
    readonly size: number;

    readonly #buckets;

    constructor(n: number, fp: number, bloomParams?: BloomParams) {
        if (bloomParams) {
            this.filter = bloomParams.filter;
            this.k = bloomParams.k;
            this.size = bloomParams.size;
            this.#buckets = utils.gen_buckets(this);
            return;
        }

        const { k, size } = utils.calc(n, fp);

        this.k = k;
        this.size = size;
        this.#buckets = utils.gen_buckets(this);
        this.filter = new Uint8Array(size).fill(0);
    }

    /**
     * dump will convert the entire bloom filter to a Uint8Array for storing. This will contain all information in
     * order to re-hydrate this bloom filter using the `from` static function.
     * @returns the byte representation of the bloom filter.
     */
    public dump(): Uint8Array {
        return utils.gen_dump(this);
    }

    /**
     * from will take the output of the `dump` method and create a bloom filter object for use.
     * @param input, raw bytes from `dump` command
     * @param Bloom filter object
     */
    static from(input: Uint8Array): Bloom {
        return new Bloom(0, 0, utils.from_dump(input));
    }

    /**
     * insert will flip all the bits to 1 corresponding to the input hash in the bloom filter.
     * @param input is the raw bytes array of the thing to be placed in the filter
     */
    public insert(input: Uint8Array) {

        for (const { index, position } of this.#buckets(input)) {

            const bit = 1 << position;

            this.filter[index] |= bit;

        }

    }

    /** lookup returns true if the input is in the filter, false otherwise */
    public lookup(input: Uint8Array): boolean {

        for (const { index, position } of this.#buckets(input)) {

            const bit = 1 << position;
            const value = this.filter[index]!;

            if ((value & bit) === 0) {
                return false;
            }

        }

        return true;

    }
}
