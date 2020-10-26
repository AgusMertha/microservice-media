const express = require('express');
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');
const router = express.Router();

// panggil model media
const {Media} = require('../models');

// set router
router.get('/', async(req, res) => {
  // mengambil semua value
  const media = await Media.findAll({
    // ambil beberapa kolom saja
    attributes : ['id', 'image']
  });

  // mengubah url gambar ditambah host
  const mappedMedia = media.map(m => {
    m.image = `${req.get('host')}/${m.image}`;
    return m;
  })

  return res.json({
    status : "success",
    data: mappedMedia
  });
})

// insert data
router.post('/', (req, res) => {
  const image = req.body.image

  // cek apakah gambar sudah dienkripsi base64
  if(!isBase64(image, {mimeRequired: true})){
    return res.status(400).json({status: "error", message : "invalid base64"})
  }

  // upload gambar yang telah dienkripsi base64
  base64Img.img(image, './public/images', Date.now(), async(err, filepath) => {
    if(err){
      return res.status(400).json({status: "error", message: err.message});
    }

    // filepath adalah direktori gambar disimpan
    const filename = filepath.split("\\").pop().split("/").pop();
    const media = await Media.create({ image: `images/${filename}` });

    return res.json({
      status: "success",
      data: {
        id: media.id,
        image : `${req.get("host")}/images/${filename}`
      }
    })
  });
})

// delete data
router.delete('/:id', async(req, res) => {
  const id = req.params.id;

  // cek id tersedia di database atau tidak
  const media = await Media.findByPk(id);

  if(!media){
    return res.status(404).json({
      status: "error",
      message : "media not found"
    })
  }

  // hapus media dari storage
  fs.unlink(`./public/${media.image}`, async (err) =>{
    if(err){
      return res.status(400).json({
        status: "error",
        message : err.message
      })
    }

    await media.destroy();
    return res.json({
      status : "success",
      message: "image destroyed"
    })
  });
})

module.exports = router;