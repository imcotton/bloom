import * as utils from "./utils.ts";
import { sample } from "./common.ts";

import { assertEquals }  from "jsr:@std/assert@^0.224.0";
import { encodeHex, decodeHex } from "jsr:@std/encoding@^0.224.3";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";





describe("uint8ArrayToNumber", function () {

    const cases = Array.from([

    ]).map(decodeHex).concat(sample(5, 8));

    for (const buf of cases) {

        it(`reads ${ encodeHex(buf) }`, function () {

            assertEquals(
                utils.uint8ArrayToNumber(buf),
                basis.uint8ArrayToNumber(buf),
            );

        });

    }

});





describe("numberToUint8Array", function () {

    const cases = Array.from([

        "9da165befdaa402a",

    ]).map(decodeHex).concat(sample(5, 8));

    for (const buf of cases) {

        const hex = encodeHex(buf);
        const big = BigInt("0x".concat(hex));
        const num = Number(big);

        it(`reads ${ hex }`, function () {

            assertEquals(
                utils.numberToUint8Array(num),
                basis.numberToUint8Array(num),
            );

        });

    }

});





const basis = {

    uint8ArrayToNumber(input: Uint8Array) {
        let num = 0;
        for (let i = 0; i < 8; i++) {
            num += Math.pow(256, i) * input[i]!;
        }
        return num;
    },

    numberToUint8Array(n: number): Uint8Array {
        const out = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            out[i] = n % 256;
            n = Math.floor(n / 256);
        }
        return out;
    },

};

