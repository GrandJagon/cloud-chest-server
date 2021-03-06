const ObjectId = require('mongoose').Types.ObjectId;
const User = require('../models/User.model');
const Album = require('../models/Album.model');
const AlbumAccess = require('../models/AlbumAccess.model');
const UserAccess = require('../models/UserAccess.model');
const Rights = require('../models/Rights.model');
const fs = require('fs');
const { getDateTime } = require('../services/datetime.js');

// Returns an array with a users albums
const albumsGet = async (req, res) => {

    // Fetches user in db according to id provided by the auth middleware (once token verified)
    const user = await User.findOne({ _id: ObjectId(req.user) });

    if (!user) return res.status(400).send('User ID not matching the database');

    if (user.albums.length <= 0) return res.status(200).send([]);

    try {

        userAlbums = user.albums;

        return res.status(200).send(userAlbums);

    } catch (err) {
        console.log(getDateTime() + ' Albums retrieval error => '+err);  
        return res.status(500).send(err.message);
    }
}

// Creates an album for a given user with the default permissions to read and write
// Returns the album ID and redirects to this specific album endpoint
const createAlbumPost = async (req, res) => {
    // Fetches user in db according to id provided by the auth middleware (once token verified)
    const user = await User.findOne({ _id: ObjectId(req.user) });
    if (!user) return res.status(400).send('User ID not matching database');


    // Assigning default values for title and description if user doesnt provide one
    var albumTitle = req.body.title;
    if (!albumTitle) albumTitle = 'My album';

    try {

        // Creating the album object with title and description provided by user (or default values)
        const newAlbum = new Album({
            title: albumTitle,
            users: [],
            size: {
                items: {}
            }
        });

         // Creates a new user access object to put in the album 
        // Allows to fetch all the users currently using this album
        const newUserAccess = new UserAccess({
            userId: user._id,
            email: user.email,
            username: user.username,
            rights: ['admin']
        });

        await newAlbum.users.push(newUserAccess);

        await newAlbum.save();

        // Creating the albumAccess object to append in the user document
        // Contains the album ID, title, description and the users rights in the album
        const newAlbumAccess = new AlbumAccess({
            albumId: newAlbum._id,
            title: albumTitle,
            rights: ['admin']
        });
    

        // Appending the content and saving the users documents
        await user.albums.push(newAlbumAccess);
        await user.save();
        
        var albumPath = './storage/'+newAlbum._id;

        // Finally creating the folder dedicated to the album
        await fs.promises.mkdir(albumPath, { recursive: true }, function(err){
            if(err){
                throw Error('Failed to create album directory : '+err);
            }
        });

        return res.status(200).send({ 'albumId': newAlbum._id, 'title': albumTitle, 'rights':['admin']});

    } catch (err) {
        console.log(getDateTime() + ' Album creation error => '+err);  
        res.status(500).send(err.message);
    }
}


// Deletes an album in users albums
// Takes user ID and album ID from request as middleware appends them once verified
const deleteAlbum = async (req, res) => {
    const albumId = req.albumId;

    try {

        await deleteAlbumAndPropagate(req.album);

        return res.status(200).send("Album deleted");
    } catch (err) {
        console.log(getDateTime() + ' Album deletion error => '+err);  
        return res.status(400).send(err.message);
    }
}

// Deletes a single album given an album object and propagates the change
const deleteAlbumAndPropagate = async (album) => {

    albumId = album._id;

    // GET ALL IDS FROM USER USING THIS ALBUM
    const userIds = [];

    for(const user of album.users){
        userIds.push(user.userId);
    }

    // Removing album from the database and the entry from the users object
    await Album.deleteOne({ _id: albumId });
    
    // Removing all occurences of this album in any user
    for(const id of userIds){
        await User.updateOne(
            { _id: id },
            { $pull: { 'albums': { 'albumId': ObjectId(albumId) } } }
        );
    }

    // Finally delete the album directory and the files inside
    var albumPath = './storage/'+albumId;
    await fs.rm(albumPath, { recursive:true, force:true}, () => console.log('File deletion successfull')); 

}





module.exports = { albumsGet, createAlbumPost, deleteAlbum, deleteAlbumAndPropagate }