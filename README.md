> [!NOTE]
> This is a forked version of (https://jsr.io/@kgwinnup/bloom), \
> featuring significant internal rewrites from **class-based**
> to **functional** implementation.
> 
> Stick to the original unless you're specifically interested
> in functional programming characteristics.

# Bloom filter <sup>(classless)</sup>

[![JSR](https://jsr.io/badges/@imcotton/bloom)](https://jsr.io/@imcotton/bloom)
[![codecov](https://codecov.io/gh/imcotton/bloom/graph/badge.svg)](https://codecov.io/gh/imcotton/bloom)





## create

```ts
const filter1 = bloom_by(4000, 1e-7);

const filter2 = bloom_from(filter1.dump());
```





## swap

create new filter with internal hashing algorithm replaced
from the default **Murmur3**

```ts
const filter1 = bloom_by(4000, 1e-7);

const filter2 = filter1.swap((input, index) => 42);
```





## insert

immutable insertion

```ts
let filter = bloom_by(4000, 1e-7);

filter = filter.insert(a);

filter = filter.batch_insert([ b, c ]);

filter = await filter.async_batch_insert(
    ReadableStream.from([ d, e, f ]),
);
```





## lookup


```ts
const { lookup } = bloom_by(4000, 1e-7).insert(a);

lookup(a); // true
lookup(b); // false
```


