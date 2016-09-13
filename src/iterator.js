"use strict";

/**
 * Iterate items and apply action for each item
 *
 * @param {Array} items
 * @param {Promise} action
 *
 * @return {Promise <Error>}
 */
function iterate (items, action) {
    items = generator(items);

    return new Promise((resolve, reject) => {
        recursion(items);

        function recursion (items) {
            let result = items.next();

            if (result.done) return resolve();

            result.value.then(action)
                .then(() => setImmediate(recursion.bind(this, items)))
                .catch(err => reject(err));
        }
    });

    function* generator(arr) {
        for (let item of arr) {
            yield Promise.resolve(item);
        }
    }
}

module.exports = iterate;