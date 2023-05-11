const fetch = require('node-fetch');
const tf = require('@tensorflow/tfjs-node');
const tfvis = require('@tensorflow/tfjs-node');
const { TensorBoard } = require('@tensorflow/tfjs-node/dist/callbacks');
const fs = require('fs');


async function run(req, res) {
// read the file contents
const contents = fs.readFileSync('matches.json');
let data;
try {
  data = JSON.parse(contents);
} catch (e) {
  console.error('Error parsing JSON:', e);
  return res.status(500).json({ error: 'Error parsing JSON file' });
}

if (!Array.isArray(data)) {
  console.warn('Warning: "matches" property is not an array, attempting to convert to array...');

  // Attempt to convert to array
  data= Object.values(data);

  if (!Array.isArray(data)) {
    console.error('Error: "matches" property is not an array');
    return res.status(500).json({ error: '"matches" property is not an array' });
  }
}

const TRAIN_TEST_RATIO = 0.8; // use 80% of the data for training

// convert our data to a TensorFlow.js dataset
const dataset = tf.data.array(data);

  // shuffle our dataset
  const shuffledDataset = dataset.shuffle(data.length);

  // split our dataset into training and testing sets
  const trainDataset = shuffledDataset.take(Math.floor(data.count * TRAIN_TEST_RATIO));
  const testDataset = shuffledDataset.skip(Math.floor(data.count * TRAIN_TEST_RATIO));

  // extract the relevant features from our data
  const features = trainDataset.map(match => [
    match.homeTeam.id,
    match.awayTeam.id,
    match.matchday,
    match.score.fullTime.homeTeam,
    match.score.fullTime.awayTeam
  ]);

  // extract the labels (i.e. the outcomes) from our data
  const labels = trainDataset.map(match => {
    if (match.score.fullTime.homeTeam > match.score.fullTime.awayTeam) {
      return 1; // home team wins
    } else if (match.score.fullTime.homeTeam < match.score.fullTime.awayTeam) {
      return 2; // away team wins
    } else {
      return 0; // draw
    }
  });

  // convert our features and labels to tensors
  const featuresTensor = tf.data.array(features).map(features => tf.tensor1d(features));
  const labelsTensor = tf.data.array(labels).map(label => tf.oneHot(tf.scalar(label, "int32"), 3).squeeze());
  const INPUT_SHAPE = [5]; // number of features
  const OUTPUT_SHAPE = 3; // number of classes

  // define our model
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape: INPUT_SHAPE, units: 32, activation: "relu"}));
  model.add(tf.layers.dense({units: 16, activation: "relu"}));
  model.add(tf.layers.dense({units: 3, activation: "softmax"}));

  // compile the model
  const LEARNING_RATE = 0.01;
  const optimizer = tf.train.adam(LEARNING_RATE);
  model.compile({
    optimizer: optimizer,
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"]
  });

  const NUM_EPOCHS = 50;
  const BATCH_SIZE = 32;

  // train the model
  const logDir = './logs'; // directory to store the log files
  const tensorboardCallback = tensorBoard.callback({logDir});
  const history = await model.fit(featuresTensor, labelsTensor, {
    epochs: NUM_EPOCHS,
    batchSize: BATCH_SIZE,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: [
      tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss', 'val_loss', 'acc', 'val_acc'],
        { callbacks: ['onEpochEnd'] }
      ),
      tensorboardCallback
    ]
  });

  console.log(history);

  // save the trained model
  await model.save('indexeddb://trained-model');
  res.status(200).json('trained and saved');
}

module.exports = run;
