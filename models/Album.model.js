const mongoose = require('mongoose');
const { ObjectId } = require('bson');


// Model for specifying the users right for the album
const File = require('./File.model').schema;
const UserAccess = require('./UserAccess.model').schema;

// Model for album such as stored in the database
// Each album can be shared with multiple users with differents rights
const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        max: 30
    },
    thumbnail: {
        type: String
    },
    creationDate: {
        type: Date,
        default: Date.now()
    },
    users: [UserAccess],
    size: {
        total: {
            type: Number,
            default: 0
        },
        items: {
            type: Object,
            default: {}
        },
    },
    files: [File]
},
    { minimize: false });


module.exports = mongoose.model('Album', albumSchema);