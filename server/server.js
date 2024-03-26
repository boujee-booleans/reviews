/* eslint-disable camelcase */
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

// app.post('/reviews', (req, res) => {
//   const {
//     product_id, rating, summary, body, recommend, name, email, photos, characteristics,
//   } = req.body;
//   console.log(req.body);
//   db.addReview(product_id, rating, summary, body, recommend, name, email, photos, characteristics)
//     .then((result) => {
//       res.status(201).send(result);
//     })
//     .catch((error) => {
//       console.log(error);
//       res.status(500).send(error);
//     });
// });

app.put('/reviews/:review_id/helpful', (req, res) => {
  db.markHelpful(req.params.review_id)
    .then(() => {
      res.status(204).send('Review marked as helpful');
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.put('/reviews/:review_id/report', (req, res) => {
  db.reportReview(req.params.review_id)
    .then(() => {
      res.status(204).send('Review reported');
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
