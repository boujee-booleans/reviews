/* eslint-disable import/extensions */
const express = require('express');
const db = require('../database/db.js');

const app = express();

const PORT = 3000;

app.use(express.json());

app.get('/reviews/', (req, res) => {
  db.exportReviews(req.body.page, req.body.count, req.body.sort, req.body.product_id)
    .then((result) => {
      res.status(200).send(result[0].rows[0]);
    })
    .catch((err) => res.status(500).send(err));
});

app.get('/reviews/meta', (req, res) => {
  db.exportReviewsMeta(req.body.product_id)
    .then((result) => {
      res.status(200).send(result[0].rows[0].json_build_object);
    })
    .catch((err) => res.status(500).send(err));
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
