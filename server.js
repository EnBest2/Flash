const express = require('express');
const multer  = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware a JSON és URL-encoded adatokhoz
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Statikus mappa kiszolgálása
app.use(express.static(path.join(__dirname, 'public')));

// Győződjünk meg róla, hogy a uploads mappa létezik
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Győződjünk meg róla, hogy a data mappa létezik
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

// Multer konfigurálása az uploads mappába történő mentéshez
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    // Időbélyeggel és random számkiegészítéssel a név egyediségének biztosításához
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Két file input mező fogadására: 'photo' és 'pdf'
const upload = multer({ storage: storage });

// Flashcard hozzáadása (új kártya létrehozása)
// A formban a file típusától függően csak az egyik file input kerül elküldésre.
app.post('/api/cards', upload.fields([{ name: 'photo' }, { name: 'pdf' }]), (req, res) => {
  const { title, content, category } = req.body;
  let fileUrl = null;
  let fileType = null;

  if (req.files && req.files.photo && req.files.photo.length > 0) {
    fileUrl = '/uploads/' + req.files.photo[0].filename;
    fileType = 'photo';
  } else if (req.files && req.files.pdf && req.files.pdf.length > 0) {
    fileUrl = '/uploads/' + req.files.pdf[0].filename;
    fileType = 'pdf';
  }

  // Olvassuk be a már mentett kártyákat a JSON fájlból
  const dataFile = path.join(dataFolder, 'cards.json');
  let cards = [];
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile);
    if (data.length > 0) {
      cards = JSON.parse(data);
    }
  }

  // Új kártya objektum létrehozása
  const newCard = {
    id: Date.now(),
    title,
    content,
    category,
    fileUrl,
    fileType,
    createdAt: new Date()
  };

  cards.push(newCard);

  // Frissítsük a JSON fájlt
  fs.writeFileSync(dataFile, JSON.stringify(cards, null, 2));

  res.json({ success: true, card: newCard });
});

// Flashcard-ok lekérése
app.get('/api/cards', (req, res) => {
  const dataFile = path.join(dataFolder, 'cards.json');
  let cards = [];
  if (fs.existsSync(dataFile)) {
    const data = fs.readFileSync(dataFile);
    if (data.length > 0) {
      cards = JSON.parse(data);
    }
  }
  res.json(cards);
});

// Az uploads mappa statikus kiszolgálása
app.use('/uploads', express.static(uploadFolder));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
