var OneToOneKey = require('./one-to-one');
var OneToManyKey = require('./one-to-many');
var ManyToOneKey = require('./many-to-one');

module.exports = {
    one_to_one_key : function (key) {
        return new OneToOneKey(key, null);
    },
    
    one_to_many_key : function (key) {
        return new OneToManyKey(key, null);
    },
    
    many_to_one_key: function (key) {
        return new ManyToOneKey(key, null);
    }
};
