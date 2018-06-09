---
title: Generating documentation on the fly in expressjs
published: true
description: 
tags: node, webdev, express
---

Before starting a few words about the components we will be using

- [`swagger`](https://swagger.io/):  It is a collection of tools for designing, buidling and documenting APIs.
- [`jsdoc`](http://usejsdoc.org/): A tool which parses sourcecode and generates documentation from comments.
- [`redoc`](https://github.com/Rebilly/ReDoc): A renderer for swagger documentation specs.

Let's start by creating a simple server with apis to list and add animals.

```js
const express = require('express');
const bodyparser = require('body-parser');

const app = express();
app.use(bodyparser.json({
  strict: false,
}));

const animals = [
  'panda', 'racoon', 'python',
];

app.get('/list', (req, res) => {
  return res.json(req.query.sort === 'yes' ? Array.from(animals).sort() : animals);
});

app.post('/add', (req, res) => {
  animals.push(...req.body.animals);
  return res.json({
    message: 'Added',
  });
});

app.listen(3000, () => {
  console.log('Server started at port 3000');
});
```

