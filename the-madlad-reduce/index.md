---
title: The beast that is `Array.prototype.reduce`
published: true
description: 
tags: node, javascript, reduce, functional
---

`reduce()` is an absolute beast of a method when it comes to functional style programming in JavaScript. The more you use it, the more you see use cases popping everywhere for it.

I recently realized, that it has become my goto method, whenever I have to deal with arrays. So I looked through bunch of my code and found a lot of examples, some of which I will list in this post. But before that - lets start with a short review the method itself.


### Signature

```js
arr.reduce((acc, current, index, array) => {
  // work goes here
}, initial);
```

`reduce()` takes two parameters.
- A `callback` function, would be the first. `reduce()` will go through every element of the array and pass `callback` the following values.
  - `acc` or accumulator, this value is like state that gets updated on every call to keep track of the result
    - For the first call, it is equal to `initial` value provided as second parameter.
    - And in subsequent calls, `acc` will be the value returned by the previous `callback` call.
  - `current`, the element of the array we are dealing with.
  - `index`, the current index of array
  - `array`, the array itself
- The second parameter is `initial`, the first value of `acc`. This is optional and in case it is not provided, `acc` will be the first element of the array.


### Simple example

A very common example of `reduce()` is to calculate the sum of an array of integers.

```js
[1, 2, 3, 4, 5].reduce((sum, integer) => sum + integer, 0);
```

In this example, we don't need `index` and `array`, which is a case in general with `reduce()`. And `sum`, `integer` and `0` play the parts of `acc`, `current` and `initial` respectively.


### Now some practical examples

I mentioned above that I went through some of my code to find examples of `reduce()`. I have listed below some of those, which were different enough to represent a new use case.

> I have trimmed the project specific code from these examples to keep the short

#### 1. Reducing to a boolean

I have a file path (`id`) and I want to know, if the path belongs to any of the directories or files from the `watching` array.

```js
return watching.reduce((acc, curr) => {
  return acc || id.startsWith(path.join(__dirname, curr));
}, false);
```


#### 2. Converting an array of objects into a map using a specific property / key of the objects

I have an array of objects that I received from a database. But I want to convert them into a simple map for later processing. All these objects have a common structure and a key that stores a unique identifier (primary key).


Example of data,
```js
// docs array
const docs = [{
  id: 'id-1',
  name: 'K Dilkington',
  style: 'orange',
}, {
  id: 'id-2',
  name: 'Lanky Fellow',
  style: 'googly',
}];

// result
const result = {
  'id-1': {
    id: 'id-1',
    name: 'K Dilkington',
    style: 'orange',
  },
  'id-2': {
    id: 'id-2',
    name: 'Lanky Fellow',
    style: 'googly',
  },
};
```

```js
function makeMap(docs, key) {
  return docs.reduce((map, doc) => {
    map[doc[key]] = doc;
    return map;
  }, {});
}
```

We can now call the this function using `makeMap(docs, 'id')`, to build the map we desire.


#### 3. Flatten an array of arrays

A very common case. I have an array of arrays and I want to combine them into a single array.

```js
function flatten(arr) {
  return arr.reduce((acc, current) => {
    return acc.concat(current);
  }, []);
}


flatten([['1', '2'], ['3', 4], [{}, []]]) // => [ '1', '2', '3', 4, {}, [] ]
```

#### 4. Doing the job of `filter()` - quite unnecessary :)

From an array of players, filter those with with valid ids (`mongoId` here).

```js
game.players.reduce((acc, val) => {
  if (is.existy(val.mongoId)) {
    acc.push(val.mongoId);
  }
  return acc;
}, []);
```


#### 5. A deep `Object.assign`

`Object.assign` copies values from source objects to given object, but it does a shallow copy and also mutates the given object.

I want a function (`deepAssign`), that would do a deep copy and would not mutate the given object.

```js
const source = {
  l1: {
    inside: true,
    prop: 'in',
  },
  prop: 'value',
};
const target = {
  prop: 'out',
  l1: {
    prop: 'inisde',
  },
}

const shallow = Object.assign(source, target);
/*
shallow = {
  "l1": {
    "prop": "inisde"
  },
  "prop": "out"
}
*/

const deep = deepAssign(source, target);
/*
deep = {
  "l1": {
    "inside":true,
    "prop": "inisde"
  },
  "prop": "out"
}
```

```js
function deepAssign(object, update, level = 0) {
  if (level > 5) {
    throw new Error('Deep Assign going beyound five levels');
  }

  return Object.keys(update).reduce((acc, key) => {
    const updatewith = update[key];
    if (is.not.existy(updatewith)) {
      return acc;
    }

    // lets just suppose `is` exists
    if (is.object(updatewith) && is.not.array(updatewith)) {
      acc[key] = deepAssign(object[key], updatewith, level + 1);
      return acc;
    }

    acc[key] = updatewith;
    return acc;
  }, Object.assign({}, object));
}
```

We are using recursion here and don't want to kill the `stack`, hence a simple check for - how many levels deep inside the source object we should care about.


#### 6. Chaining Promises

I have four async functions that have to be executed in series, feeding the result of the previous function into next.

```js
const arr = [fetchData, updateData, postData, showData];
const response = arr.reduce((acc, current) => {
  // (cue alarm sirens) no error handling
  return acc.then(current));
}, Promise.resolve(userId));

response.then(data => {
  // data is final response
});
```


### That's pretty much it folks. 

I found several more examples, however they were following more or less the same storylines with a twist or two of their own.

Finally, thanks for reading and if you have any magical use case of `reduce()` or if I have made any mistake in this post, I would love to know.
