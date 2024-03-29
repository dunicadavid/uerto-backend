const { sortByScore } = require("./common");
const math = require('mathjs');

const LEARNING_RATE = 0.03;
const LEARNING_ITERATIONS = 750;

exports.predictWithLinearRegression  = (X, PLACES_IN_LIST, ratings) =>  {
  // Add intercept term
  const ones = Array(X.length).fill().map((v, i) => [1]);
  X = math.concat(ones, X);

  const init = {
    training: {
      X: [],
      y: [],
    },
    // Not a real test set
    // Because of missing labels
    test: {
      X: [],
      references: [],
    }
  };

  // Prepare training and test set
  const { training, test } = PLACES_IN_LIST.reduce((result, movie, key) => {
    const hasRatedMovie = !!ratings[movie.idplace];
    if (hasRatedMovie) {
      result.training.X.push(X[key]);
      result.training.y.push([ratings[movie.idplace].rating]);
    } else {
      result.test.X.push(X[key]);
      // Keep a reference to map the predictions later to places
      result.test.references.push(movie.idplace);
    }
    return result;
  }, init);


  // Train theta paramaters
  let m = training.X[0].length;
  let theta = Array(m).fill().map((v, i) => [0]);
  theta = gradientDescent(
    training.X,
    training.y,
    theta,
    LEARNING_RATE,
    LEARNING_ITERATIONS
  );

  // Predict all ratings
  let predictedRatings = getPredictedRatings(theta, test.X);

  // Enrich the vector to convey all information
  // Use references from before which we kept track of
  predictedRatings = predictedRatings.map((rating, key) => ({
    score: rating[0],
    idplace: test.references[key],
  }));

  return sortByScore(predictedRatings);
}

function gradientDescent(X, y, theta, ALPHA, ITERATIONS) {
  const m = y.length;

  for (let i = 0; i < ITERATIONS; i++) {
    theta = math.evaluate(`theta - ALPHA / m * ((X * theta - y)' * X)'`, {
      theta,
      ALPHA,
      m,
      X,
      y,
    });

    if (i % 50 === 0) {
      const cost = computeCost(X, y, theta);
      //console.log(`Cost after ${i} of trained ${ITERATIONS}: ${cost}`);
    }
  }

  return theta;
}

function getPredictedRatings(theta, X) {
  return math.evaluate(`X * theta`, {
    theta,
    X,
  })
}

function computeCost(X, y, theta) {
  let m = y.length;

  let predictions = math.evaluate('X * theta', {
    X,
    theta,
  });

  let sqrErrors = math.evaluate('(predictions - y).^2', {
    predictions,
    y,
  });

  let J = math.evaluate(`1 / (2 * m) * sum(sqrErrors)`, {
    m,
    sqrErrors,
  });

  return J;
}
