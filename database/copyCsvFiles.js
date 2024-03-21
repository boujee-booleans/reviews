const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const copyFrom = require('pg-copy-streams').from;

var reviewsTable = 'reviews';
var characteristics = 'characteristics';
var characteristicReviews = 'characteristic_reviews';
var reviewsPhotos = 'reviews_photos';

var reviewsInputFile = path.join(__dirname, '../csv_data/reviews.csv');
var characteristicsInputFile = path.join(__dirname, '../csv_data/characteristics.csv');
var characteristicReviewsInputFile = path.join(__dirname, '../csv_data/characteristic_reviews.csv');
var reviewsPhotosInputFile = path.join(__dirname, '../csv_data/reviews_photos.csv');

async function loadData(targetTable, inputFile) {
  const db = new Client({
    database: 'reviews'
  });

  try {
    await db.connect();
    console.log(`Connected to PostgreSQL database for loading data into ${targetTable}`);
    const stream = db.query(copyFrom(`COPY ${targetTable} FROM STDIN WITH (FORMAT csv, HEADER true)`));
    const fileStream = fs.createReadStream(inputFile);
    console.time(`Loading ${targetTable}`);
    fileStream.on('error', (error) => {
      console.log(`Error in reading file ${inputFile}: ${error}`)
    });
    stream.on('error', (error) => {
      console.log(`Error in copy command with ${targetTable}: ${error}`)
    });
    stream.on('end', () => {
      console.log(`Completed loading data into ${targetTable}`)
      db.end()
      console.timeEnd(`Loading ${targetTable}`);
    });
    fileStream.pipe(stream);
  } catch (error) {
    console.error(`Error loading data into ${targetTable}`, error);
  }
};

async function copyCSVFiles() {
  try {
    await loadData(reviewsTable, reviewsInputFile );
    await loadData(characteristics, characteristicsInputFile);
    await loadData(characteristicReviews, characteristicReviewsInputFile);
    await loadData(reviewsPhotos, reviewsPhotosInputFile);
  } catch (error) {
    console.error('Error copying CSV files:', error);
  }
};

copyCSVFiles();


