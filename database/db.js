/* eslint-disable import/no-extraneous-dependencies */
const { Client } = require('pg');


async function createTable() {
  const db = new Client({
    database: 'reviews',
  });

  try {
    await db.connect();
    await db.query(
      'CREATE TABLE IF NOT EXISTS reviews (id INT PRIMARY KEY, product_id INT, rating INT, date BIGINT, summary TEXT, body TEXT,recommend BOOLEAN, reported BOOLEAN, reviewer_name TEXT, reviewer_email TEXT, response TEXT, helpfulness INT)',
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS characteristics (id INT PRIMARY KEY, product_id INT, name TEXT)',
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS characteristic_reviews (id INT PRIMARY KEY,characteristic_id INT, review_id INT, value INT)',
    );
    await db.query(
      'CREATE TABLE IF NOT EXISTS reviews_photos (id INT PRIMARY KEY, review_id INT, url TEXT)'
    );
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await db.end();
    console.log('Tables created!')
  }
}

createTable();




