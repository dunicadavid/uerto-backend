const { getCosineSimilarityRowVector, sortByScore, getPlacesIndexById } = require('./common');

exports.predictWithContentBased = (X, PLACES_IN_LIST, idplace) => {
    
  const index = getPlacesIndexById(PLACES_IN_LIST, idplace);

  // Compute similarities based on input movie
  const cosineSimilarityRowVector = getCosineSimilarityRowVector(X, index);

  // Enrich the vector to convey all information
  // Use references from before which we kept track of
  const contentBasedRecommendation = cosineSimilarityRowVector
    .map((value, key) => ({
      score: value,
      idplace: PLACES_IN_LIST[key].idplace,
    }));

  return sortByScore(contentBasedRecommendation);
}

