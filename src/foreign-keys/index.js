'use strict';

var OneToOneKey = require('./one-to-one');
var OneToManyKey = require('./one-to-many');
var ManyToManyKey = require('./many-to-many');

module.exports = {
    one_to_one_key : function (key) {
        return new OneToOneKey(key, null);
    },
    
    one_to_many_key : function (key) {
        return new OneToManyKey(key, null);
    },
    
    many_to_many_key: function (key) {
        return new ManyToManyKey(key, null);
    }
};
