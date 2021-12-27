const router = require('express').Router();
const { checkAuth } = require('../middlewares/auth.middleware');
const { checkRight } = require('../middlewares/rights.middleware');
const { albumsGet, createAlbumPost, deleteAlbum, addAccess, editAlbum } = require('../controllers/albums.controller');

// All routes from this page handle verything that is related to the album obects such as creating it, deleting it or editing it for instance
// The album ID must be provided in each request

// Route to get user's albums
router.get('/', checkAuth, albumsGet);

// Route to create an album
router.post('/create', checkAuth, createAlbumPost);

// Route to edit an existing album
router.patch('/', checkAuth, checkRight('album:edit'), editAlbum);

// Route to delete a specific album
router.delete('/', checkAuth, checkRight('album:delete'), deleteAlbum);

// Route to give album access to specific user
router.post('/addAccess', checkAuth, checkRight('admin'), addAccess)


module.exports = router;