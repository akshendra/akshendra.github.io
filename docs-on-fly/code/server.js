
const path = require('path');
const express = require('express');
const bodyparser = require('body-parser');
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
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'redoc.html'));
});

app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


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
  return res.json(req.query.sort === 'yes' ? Array.from(animals).sort() : animals);
});


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
  animals.push(...req.body.animals);
  return res.json({
    message: 'Added',
  });
});


// -- start the server --
app.listen(3000, () => {
  console.log('Server started at port 3000');
});

