const express = require("express");
const router = express.Router();
const Image = require("../models/Image.js")
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const sharp = require('sharp');

router.use(cors())
router.use(bodyParser.json({ charset: 'utf-8', limit: '2000kb' }));
router.use(express.static('public'));

const imagePath = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const filePath = req.file.path;
    
        // Sharp ile sıkıştırma
        const compressedImage = await sharp(filePath)
          .jpeg({ quality: 80 })
          .toBuffer();
    
        // Sıkıştırılmış görüntüyü yeni bir dosya olarak kaydet
        const newFilePath = await filePath.replace(/\.[^/]+$/, '-compressed.jpeg');
        await sharp(compressedImage).toFile(newFilePath);
        res.json(req.file);

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sunucu Hatası." });
      }
});

router.post("/save", async (req, res) => {
    try {
        const data = req.body;

        const newInsert = new Image(data);
        await newInsert.save();

        res.status(201).json({ ...newInsert, id: newInsert._id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error." });
    }
})

router.get('/allImages', async (req, res) => {
    try {
        const images = await Image.find().sort({_id:-1});
        res.status(200).json(images);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error." });
    }
  });

router.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(imagePath, filename);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('Dosya bulunamadı.');
        } else {
            res.sendFile(filePath);
        }
    });
});

module.exports = router;