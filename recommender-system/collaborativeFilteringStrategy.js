const { sortByScore, getCosineSimilarityRowVector } = require("./common");
const math = require('mathjs');

exports.predictWithCfUserBased = (ratingsGroupedByUser, ratingsGroupedByPlace, userId) => {
    const { userItem } = getMatrices(ratingsGroupedByUser, ratingsGroupedByPlace, userId);
    const { matrix, placeIds, userIndex } = userItem;

    const matrixNormalized = meanNormalizeByRowVector(matrix);

    const userRatingsRowVector = matrixNormalized[userIndex];

    const cosineSimilarityRowVector = getCosineSimilarityRowVector(matrixNormalized, userIndex);

    const predictedRatings = userRatingsRowVector.map((rating, placeIndex) => {     //am ramas aici
        const placeId = placeIds[placeIndex];

        const placeRatingsRowVector = getPlaceRatingsRowVector(matrixNormalized, placeIndex);

        let score;
        if (rating === 0) {
            score = getPredictedRating(placeRatingsRowVector, cosineSimilarityRowVector);
        } else {
            score = rating
        }
        return { score, idplace: placeId };
    });

    return sortByScore(predictedRatings);
}

exports.predictWithCfItemBased = (ratingsGroupedByUser, ratingsGroupedByPlace, userId) => {
    const { itemUser } = getMatrices(ratingsGroupedByUser, ratingsGroupedByPlace, userId);
    const { matrix, placeIds, userIndex } = itemUser;

    const matrixNormalized = meanNormalizeByRowVector(matrix);
    const userRatingsRowVector = getUserRatingsRowVector(matrixNormalized, userIndex);

    const predictedRatings = userRatingsRowVector.map((rating, placeIndex) => {
        const placeId = placeIds[placeIndex];

        const cosineSimilarityRowVector = getCosineSimilarityRowVector(matrixNormalized, placeIndex);

        let score;
        if (rating === 0) {
            score = getPredictedRating(
                userRatingsRowVector,
                cosineSimilarityRowVector
            );
        } else {
            score = rating;
        }

        return { score, idplace: placeId };
    });

    return sortByScore(predictedRatings);
}




function getPredictedRating (ratingsRowVector, cosineSimilarityRowVector) {

    const N = 5;

    const neighborSelection = cosineSimilarityRowVector
        // keep track of rating and similarity
        .map((similarity, index) => ({ similarity, rating: ratingsRowVector[index] }))
        // only neighbors with a rating
        .filter(value => value.rating !== 0)
        // most similar neighbors on top
        .sort((a, b) => b.similarity - a.similarity)
        // N neighbors
        .slice(0, N);
  

    const numerator = neighborSelection.reduce((result, value) => {
        return result + value.similarity * value.rating;
    }, 0);

    const denominator = neighborSelection.reduce((result, value) => {
        return result + math.pow(value.similarity, 2);
    }, 0);

    return numerator / math.sqrt(denominator) || 0;
}

function getUserRatingsRowVector (itemBasedMatrix, userIndex) {
    return itemBasedMatrix.map(itemRatings => {
        return itemRatings[userIndex];
    });
}

function getPlaceRatingsRowVector (userBasedMatrix, placeIndex) {
    return userBasedMatrix.map(userRatings => {
        return userRatings[placeIndex];
    });
}

function meanNormalizeByRowVector (matrix) {
    return matrix.map((rowVector) => {
        return rowVector.map(cell => {
            return cell !== 0 ? cell - getMean(rowVector) : cell;
        });
    });
}

function getMean(rowVector) {
    const valuesWithoutZeroes = rowVector.filter(cell => cell !== 0);
    return valuesWithoutZeroes.length ? math.mean(valuesWithoutZeroes) : 0;
}

function getMatrices(ratingsGroupedByUser, ratingsGroupedByPlace, uId) {
    const itemUser = Object.keys(ratingsGroupedByPlace).reduce((result, placeId) => {
        const rowVector = Object.keys(ratingsGroupedByUser).map((userId, userIndex) => {

            if (userId == uId) {
                result.userIndex = userIndex;
            }

            return getConditionalRating(ratingsGroupedByPlace, placeId, userId);
        });

        result.matrix.push(rowVector);
        result.placeIds.push(placeId);

        return result;
    }, { matrix: [], placeIds: [], userIndex: null });

    const userItem = Object.keys(ratingsGroupedByUser).reduce((result, userId, userIndex) => {
        const rowVector = Object.keys(ratingsGroupedByPlace).map(placeId => {
            return getConditionalRating(ratingsGroupedByUser, userId, placeId);
        });

        result.matrix.push(rowVector);

        if (userId == uId) {
            result.userIndex = userIndex;
        }

        return result;
    }, { matrix: [], placeIds: Object.keys(ratingsGroupedByPlace), userIndex: null });

    return { itemUser, userItem };
}

function getConditionalRating(value, primaryKey, secondaryKey) {
    if (!value[primaryKey]) {
        return 0;
    }

    if (!value[primaryKey][secondaryKey]) {
        return 0;
    }

    return value[primaryKey][secondaryKey].rating;
}