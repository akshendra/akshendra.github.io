---
title: Generating documentation on the fly in expressjs
published: false
description: 
tags: node, webdev, express
---


I little while ago, I decided to generate docs for some HTTP APIs I was about to build. The APIs were going to be used internally, so I didn't want to commit to any of the online solutions, like [API Blueprint](https://apiblueprint.org/), [Apiary](https://apiary.io/) or [Swagger](https://swagger.io/). And setting up something from scratch would have been, bit much. Also, I wanted the docs integrated within the code, avoiding any kind of context switch, just to write documentation.


I was aware of `jsdoc` and `esdoc`, both of them allows us to write documentation in comments. However, their job is to document javascript code, and not HTTP APIs. Then, I found a tool [`swagger-jsdoc`](`https://github.com/Surnet/swagger-jsdoc`), which genrates swagger / openapi specification from comments. This was just what I was looking for.


### Let's see some `code` now

Just a simple server that list animals and you can add your favorite animal too. _Quite a novel concept_.

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
  return res.json(req.query.sort === 'yes' ? Array.from(animals).sort() : animals); // why is .sort inplace 😠
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

`swagger-jsdoc` requires comments to follow [OpenAPI Specification](https://swagger.io/docs/specification/about/), which is quite intutive.

Adding documentation comments for `/list` route.

```js
/**
 * @swagger
 * /list:
 *   get:
 *     summary: List all the animals
 *     description: Returns a list of all the animals, optionally sorted
 *     tags:
 *       - animals
 *     parameters:
 *       - in: query
 *         name: sort
 *         type: string
 *         required: false
 *         enum:
 *           - yes
 *           - no
 *     responses:
 *       200:
 *         description: List of animals
 *         schema:
 *           type: object
 *           properties:
 *             animals:
 *               type: array
 *               description: all the animals
 *               items:
 *                 type: string
 */

app.get('/list', (req, res) => {
  // ...
});

```

First line is `@swagger` which helps `swagger-jsdoc` indentify this comment block as swagger (OpenAPI) specification. Next few lines define the, the path, then method, a little summary and description. `tags` are used to group the APIs.

The expected parameters, `query` and `path` are described next. Our `/list` API, expects an optional sort query parameter, which is used to decided whether the list of animals should be sorted or not, before sending.

Then we define the response. Status coming first, a little description and then the schema of the resopnse. We are returning JSON here. However, its easy to document other content types as well.

Same we will do for the `/add` request.

```js
/**
 * @swagger
 * /add:
 *   post:
 *     summary: Add more animal
 *     description: Add animals to the list
 *     tags:
 *       - animals
  *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               animals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Adds the animals in body
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               default: 'Added'
 */
app.post('/add', (req, res) => {
  // ...
});

```

Now that we have the comments ready, we will hook up the `swagger-jsdoc` module.

```js
// ... other modules
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
app.use(bodyparser.json({
  strict: false,
}));

const animals = [
  'panda', 'racoon', 'python',
];

// -- setup up swagger-jsdoc --
const swaggerDefinition = {
  info: {
    title: 'Animals',
    version: '1.0.0',
    description: 'All things animlas',
  },
  host: 'localhost:3000',
  basePath: '/',
};
const options = {
  swaggerDefinition,
  apis: [path.resolve(__dirname, 'server.js')],
};
const swaggerSpec = swaggerJSDoc(options);

// -- routes for docs and generated swagger spec --

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// other routes
```

This will server a swagger specification at `/swagger.json`. All that is left to do is render this spec in a more human friendly way. I choose [ReDoc](https://github.com/Rebilly/ReDoc) for that. It has a simple setup.

Include an HTML file

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Quizizz Docs</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <link rel="shortcut icon" type="image/x-icon" href="https://quizizz.com/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

    <!--
    ReDoc doesn't change outer page styles
    -->
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <!-- we provide is specification here -->
    <redoc spec-url='http://localhost:3000/swagger.json' expand-responses="all"></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"> </script>
  </body>
</html>
```

We have set the `http://localhost:3000/docs/swagger.json` as the place to server JSON specification already. Let's setup a route to serve this HTML as well.

```js
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'redoc.html'));
});
```

The result,

![ReDoc rendered documentation](https://i.imgur.com/QN1LULM.gif)

> There is ofcourse more components to OpenAPI and `swagger-jsdoc` to make the process easier. You can write definitons for schemas / requests / reposnses that are used more than once and then use them in the docs. Check out  https://swagger.io/docs/specification/components/ and https://github.com/Surnet/swagger-jsdoc/blob/master/docs/GETTING-STARTED.md to define them in a JavaScripty way.
> Code can be found [here](https://github.com/akshendra/akshendra.github.io/tree/master/docs-on-fly/code)

