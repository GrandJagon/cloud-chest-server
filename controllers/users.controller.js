require('dotenv').config({ path: '../.env' });
const Album = require('../models/Album.model');
const User = require("../models/User.model");
const { salt, saltHash } = require('../services/hasher');
const { deleteFiles } = require('../services/storage');

// Edits a user profile
const editUser = async (req, res) => {
    const user = req.user;
    const userId = req.userId;

    // Fetching requested update from the request or keep same values if null 
    if (req.body.email) {
        const emailExists = await User.findOne({ email: req.body.email })
        if (emailExists) return res.status(400).send('Email already in use');
    }
    const newEmail = req.body.email ?? user.email

    if (req.body.username) {
        const usernameExists = await User.findOne({ username: req.body.username })
        if (usernameExists) return res.status(400).send('Email already in use');
    }
    const newUsername = req.body.username ?? user.username

    const newPassword = req.body.password ? saltHash(newPassword, salt(process.env.SALT_LENGTH)) : user.password;

    try {

        // Updates the database
        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    "email": newEmail,
                    "username": newUsername,
                    "password": newPassword
                }
            }
        );

        res.status('200').send('Update succesfull');

    } catch (err) {
        return res.status(500).send(err.message);
    }


}

// Deletes a user and any album that they own
const deleteUser = async (req, res) => {
    const userId = req.userId;

    try {
        // Fetching all albums owned by the user
        const userAlbums = await Album.find({ owner: userId });

        const userFiles = []

        // Extracting all the file path of those albums and push it into array
        userAlbums.map((album) => {
            if (album.files.length > 0) album.files.forEach(file => {
                userFiles.push(file.path);
            });

        });

        // Delete the files
        await deleteFiles(userFiles, (err) => {
            if (err) return res.status(500).send('Error while deleting files');
        });

        // Delete the albums from the db
        await Album.deleteMany({ owner: userId });

        // Delete the user from the db
        await User.deleteOne({ _id: userId });

        res.status(200).send('User successfully deleted');

    } catch (err) {
        res.status(500).send(err.message)
    }
}



module.exports = { editUser, deleteUser };