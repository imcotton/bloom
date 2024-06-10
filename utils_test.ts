import * as utils from "./utils.ts";

import { assertEquals }  from "jsr:@std/assert@^0.224.0";
import { encodeHex }   from "jsr:@std/encoding@^0.224.3";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";





describe("uint8ArrayToNumber", function () {

    const buf = crypto.getRandomValues(new Uint8Array(8));
    const hex = encodeHex(buf);

    it(`reads ${ hex }`, function () {

        assertEquals(
            utils.uint8ArrayToNumber(buf),
            basis.uint8ArrayToNumber(buf),
        );

    });

});





const basis = {

    uint8ArrayToNumber(input: Uint8Array) {
        let num = 0;
        for (let i = 0; i < 8; i++) {
            num += Math.pow(256, i) * input[i]!;
        }
        return num;
    },

};

