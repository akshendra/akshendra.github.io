---
title: Iterators in JavaScript
published: false
description:
tags: node, javascript, js, iterators
---

Many a times you wake up and realize that today you will be traversing through an array or maybe many arrays. But you don't worry about it, you have done it before and it wasn't that difficult. You also have a lot of options, you can use the good old loops, or the wonderful `map`, `reduce`, `fitler`. OR you can use the `iterators`.

`Iterator` is a design pattern that allows us to traverse over a list or collection. In JavaScript, like most things, they are implemented as objects. Before going in detail, here is a simple example.

```js
const arr = [1, 2, 3, 4, 5];

for (const num of arr) {
  console.log(num);
}
```

Using `for..of` loop, you can iterate over any `object` that implements the `iterable` protocol.


### `Iterable` Protocol

To follow this protocol, the object must define a special method `@@iterator` (as `Symbol.iterator` key) which takes zero arguments and returns an object which itself should follow the `iterator` protocol.


### `Iterator` Protocol

To follow this protocol, the object must define a method named `next`, which itself returns an object with two properties:

  1. `value`: the current item in iteration
  2. `done`: a boolean, that represents whether the iteration is finished or not. `done=true` means iteration is finished.


> Array, String, Map, Set, TypedArrays follow the iterator protocol.


### Implementing the protocols

Here is a function that returns an `iterable` which allows us iterate over first `n` natural numbers.

```js
function numbers(till = 100) {
  let i = 0;
  const iteratorFx = () => {
    const iterator = {
      next() {
        i += 1;
        if (i <= till) {
          return { done: false, value: i };
        }
        return { done: true };
      },
    };
    return iterator;
  };
  return {
    [Symbol.iterator]: iteratorFx,
  };
}

const numbersTill10 = numbers(10);
for (const i for numbersTill10) {
  // 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
}
```

> The `@@iterator` method is only called once at the beginning of the `for..of` loop. So the following is same as above

```js
for (const i for numbers(10)) {
  // 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
}
```

Since we know that the object has a `next` method which implements the details of iteration, we can simple call this method ourselves.

```js
const numbersTill5 = number(5);
numbersTill5.next(); // { done: false, value : 1 }
numbersTill5.next(); // { done: false, value : 2 }
numbersTill5.next(); // { done: false, value : 3 }
numbersTill5.next(); // { done: false, value : 4 }
numbersTill5.next(); // { done: false, value : 5 }
numbersTill5.next(); // { done: true }
```

> This can be used to control the iteration externally, by passing values to `next` method.


We can implement our custom iterators like above. However, JavaScript provides another way to create `iterables`.

## Generators

Generators are special function which when called return a `Generator` object. The `generator` object follows the iteration protocols. So to implement the above example using generators,

```js
function* generateNumbers(till = 100) {
  let i = 1;
  while (i <= till) {
    yield i;
    i += 1;
  }
}

const numbersTill10 = generateNumbers(10); // iterator
// rest is same
```

The value sent by `yield` (here `i`), will be the `value` stored in object returned by the `next` method. And when the generator finishes it returns `{ done: true }`.

It is very clear from the above example that Generators provide a concise way to create `iterables`. They abstract away the protocols, and we need to worry about the iteration logic only.


## Conclusion

Since we started this post with a hyperbole about traversing array. Its only fair that we include an example involving arrays. `Arrays` are already `iterable`, so we will create an `iterable` value mapper.

```js
function* mapOver(arr, mapper = (v) => v) {
  for (let i = 0; i < arr.length; i += 1) {
    yield mapper(arr[i]);
  }
}

const twices = mapOver([...numbers(5)], (v) => v + 2);
for (const num of twices) {
  // 2, 4, 6, 8, 10
}
```

> [Spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) (...) operator, by definition works on `iterables`.
