'use strict';

const random = require('rand-token');

class ForeignKey {
    constructor () {
        this.id = random.generate(16);
    }

    update_key (key, value) {
        throw new Error('Not implemented exception');
    }
    
    get_values (key, value) {
        throw new Error('Not implemented exception');
    }
    
    delete_key (key, value) {
        throw new Error('Not implemented exception');
    }
    
    get_keys () {
        throw new Error('Not implemented exception');
    }
}

module.exports = ForeignKey;