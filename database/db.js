/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable quotes */
/* eslint-disable import/no-extraneous-dependencies */
const { Client } = require('pg');
const Promise = require('bluebird');
require('dotenv').config();

const connection = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.eng.PGPORT,
});

const db = Promise.promisifyAll(connection, { multiArgs: true });

db.connectAsync()
  .then(() => console.log('Connected to database!'))
  .then(() => db.queryAsync(
    'CREATE TABLE IF NOT EXISTS reviews (id INT PRIMARY KEY, product_id INT, rating INT, date BIGINT, summary TEXT, body TEXT,recommend BOOLEAN, reported BOOLEAN, reviewer_name TEXT, reviewer_email TEXT, response TEXT, helpfulness INT)',
  ))
  .then(() => db.queryAsync(
    'CREATE TABLE IF NOT EXISTS characteristics (id INT PRIMARY KEY, product_id INT, name TEXT)',
  ))
  .then(() => db.queryAsync(
    'CREATE TABLE IF NOT EXISTS characteristic_reviews (id INT PRIMARY KEY,characteristic_id INT, review_id INT, value INT)',
  ))
  .then(() => db.queryAsync(
    'CREATE TABLE IF NOT EXISTS reviews_photos (id INT PRIMARY KEY, review_id INT, url TEXT)',
  ))
  .catch((error) => console.error('Error creating table:', error));

db.exportReviews = (page, count, sort, productID) => db.queryAsync("WITH total_rows AS (SELECT COUNT(*) AS total_count FROM reviews WHERE product_id = $1 AND reported = FALSE), paginated_reviews AS (SELECT reviews.id AS review_id, rating, summary, recommend, response, body, date, reviewer_name, helpfulness, COALESCE((SELECT json_agg(json_build_object('id', reviews_photos.id, 'url', url)) FROM reviews_photos WHERE reviews.id = reviews_photos.review_id), '[]') AS photos FROM reviews WHERE product_id = $1 GROUP BY reviews.id, rating, summary, recommend, response, body, date, reviewer_name, helpfulness LIMIT $2 OFFSET CASE WHEN (($3 - 1) * $2) > (SELECT total_count FROM total_rows) THEN 0 ELSE GREATEST((SELECT total_count FROM total_rows) - $2, 0) END) SELECT $1::INT AS product, $2::INT as page, $3::INT as count, json_agg(json_build_object('review_id', review_id, 'rating', rating, 'summary', summary, 'recommend', recommend, 'response', response, 'body', body, 'date', date, 'reviewer_name', reviewer_name, 'helpfulness', helpfulness, 'photos', photos)) AS results FROM paginated_reviews CROSS JOIN total_rows", [productID, count || 5, page || 1]);

db.exportReviewsMeta = (productID) => db.queryAsync(`SELECT json_build_object(
'product_id', product_id::text,
'ratings', json_build_object(
  1, COUNT(rating) FILTER (WHERE rating = 1),
  2, COUNT(rating) FILTER (WHERE rating = 2),
  3, COUNT(rating) FILTER (WHERE rating = 3),
  4, COUNT(rating) FILTER (WHERE rating = 4),
  5, COUNT(rating) FILTER (WHERE rating = 5)
),
'recommended', json_build_object(
  'true', COUNT(recommend) FILTER (WHERE recommend = true),
  'false', COUNT(recommend) FILTER (WHERE recommend = false)
),
'characteristics', (
  SELECT json_object_agg(
  c.name,
  json_build_object(
    'id', c.id,
    'value', avg_value.value::text
  )
)
FROM (
  SELECT cr.characteristic_id, AVG(cr.value) AS value
  FROM characteristic_reviews cr
  JOIN reviews r ON cr.review_id = r.id
  WHERE r.product_id = $1 AND r.reported = false
  GROUP BY cr.characteristic_id
) AS avg_value
JOIN characteristics c ON avg_value.characteristic_id = c.id
)
)
FROM reviews r
WHERE r.product_id = $1 AND r.reported = false
GROUP BY r.product_id`, [productID]);

// db.addReview = (product_id, rating, summary, body, recommend, name, email, photos, characteristics) => db.queryAsync(`DO $$
// DECLARE
//     new_review_id INT;
// BEGIN
//     INSERT INTO reviews (product_id, rating, date, summary, body, recommend, reviewer_name, reviewer_email, helpfulness)
//     VALUES ($1, $2, extract(epoch from now()) * 1000, $3, $4, $5, $6, $7, 0)
//     RETURNING id INTO new_review_id;

//     INSERT INTO reviews_photos (review_id, url)
//     SELECT new_review_id, unnest($8::text[]);

//     INSERT INTO characteristic_reviews (characteristic_id, review_id, value)
//     SELECT key::integer, new_review_id, value::integer
//     FROM jsonb_each_text($9::jsonb);
// END $$;`, [product_id, rating, summary, body, recommend, name, email, photos, characteristics]);

db.markHelpful = (review_id) => db.queryAsync(`UPDATE reviews
  SET helpfulness = helpfulness + 1
  WHERE id = $1`, [review_id]);

db.reportReview = (review_id) => db.queryAsync(`UPDATE reviews
  SET reported = true
  WHERE id = $1`, [review_id]);

module.exports = db;
