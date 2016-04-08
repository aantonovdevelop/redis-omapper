'use strict';

class ForeignKey {
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