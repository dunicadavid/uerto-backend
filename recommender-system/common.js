const similarity = require('compute-cosine-similarity');

exports.sortByScore = (recommendation) => {
    return recommendation.sort((a, b) => b.score - a.score);
}

exports.getCosineSimilarityRowVector = (matrix, index) => {
    return matrix.map((rowRelative, i) => {
      return similarity(matrix[index], matrix[i]) || 0;
    });
}

exports.getPlacesIndexById = (PLACES_IN_LIST, query) => {
    const index = PLACES_IN_LIST.map(place => place.idplace).indexOf(query);
  
    return index;
   // const { title, id } = MOVIES_IN_LIST[index];
   // return { index, title, id };
}