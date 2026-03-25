require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 uur
  },
}));

// Parse JSON bodies for login
app.use(express.json());

// Hardcoded credentials
const AUTH_USER = 'nathalie';
const AUTH_PASS = 'Nathalie!';

// Serve login page (public)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/style.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === AUTH_USER && password === AUTH_PASS) {
    req.session.authenticated = true;
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Ongeldige gebruikersnaam of wachtwoord.' });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Auth check endpoint
app.get('/api/auth-check', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// Auth middleware — protect everything below this
function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  // API calls get 401, page requests get redirected
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Niet ingelogd.' });
  }
  res.redirect('/login.html');
}

app.use(requireAuth);

// Serve static files (protected)
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const ALLOWED_MIMETYPES = [
  'audio/mpeg',
  'audio/mp3',
  'video/mp4',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'video/webm'
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Alleen MP3, MP4, WAV en WebM bestanden zijn toegestaan.'));
    }
  }
});

// Report type prompts
const PROMPTS = {
  '1op1': `Zet onderstaande tekst om in een helder en professioneel verslag van een 1-op-1 gesprek.

Gebruik de volgende structuur:
1. Aanleiding van het gesprek
2. Samenvatting van het gesprek (korte, duidelijke alinea)
3. Belangrijkste punten (in bullet points)
4. Afspraken en acties (in bullet points, concreet en duidelijk wie wat doet)
5. Eventuele zorgen / aandachtspunten (indien van toepassing)
6. Conclusie

Richtlijnen:
- Schrijf in professioneel en helder Nederlands
- Maak de tekst logisch en gestructureerd, ook als de input rommelig is
- Vat samen waar nodig, maar behoud de kern en belangrijke signalen
- Formuleer neutraal en objectief (geen aannames toevoegen)
- Maak afspraken concreet (wie, wat, wanneer indien mogelijk)
- Gebruik korte en duidelijke zinnen
- Zorg dat het verslag direct bruikbaar is voor dossiervorming

Hier is de tekst:`,

  'vergadering-uitgebreid': `Zet onderstaande tekst om in een helder en professioneel verslag van een vergadering.

Gebruik de volgende structuur:
1. Algemene gegevens
   - Datum:
   - Aanwezigen:
   - Afwezigen (indien bekend):
2. Agenda / besproken onderwerpen
3. Samenvatting per onderwerp (duidelijk gestructureerd)
4. Belangrijkste besluiten (in bullet points)
5. Actiepunten (in bullet points, met wie wat doet en eventueel wanneer)
6. Openstaande punten / vervolgacties
7. Rondvraag (indien van toepassing)
8. Conclusie

Richtlijnen:
- Schrijf in professioneel en duidelijk Nederlands
- Maak structuur aan, ook als de input rommelig of onsamenhangend is
- Vat samen, maar behoud de kern en belangrijke besluiten
- Scheid duidelijk:
  - wat besproken is
  - wat besloten is
  - wat acties zijn
- Formuleer actiepunten concreet (wie, wat, wanneer indien mogelijk)
- Gebruik bullet points waar passend
- Voeg geen informatie toe die niet in de tekst staat
- Zorg dat het verslag direct bruikbaar is voor dossiervorming of terugkoppeling

Hier is de tekst:`,

  'vergadering-beknopt': `Maak van onderstaande tekst korte en duidelijke notulen van een vergadering met:
- Samenvatting
- Belangrijkste besluiten (bullet points)
- Actiepunten (bullet points met wie/wat)

Schrijf professioneel en overzichtelijk.

Tekst:`,

  'mdo': `Zet onderstaande tekst om in een professioneel en goed leesbaar MDO-verslag.

Houd je aan de volgende structuur:
1. Aanleiding
2. Huidige situatie
3. Zorgsignalen (in bullet points)
4. Voorgeschiedenis en incidenten
5. Inschatting van betrokken partijen
6. Knelpunten
7. Afspraken en actiepunten (in bullet points)
8. Conclusie

Richtlijnen:
- Schrijf in helder en professioneel Nederlands
- Maak zinnen logisch en gestructureerd (ook als de input rommelig of onsamenhangend is)
- Vat samen waar nodig, maar behoud de belangrijkste inhoud en signalen
- Haal concrete actiepunten expliciet naar voren
- Gebruik geen spreektaal
- Maak er een rapport van dat direct gebruikt kan worden in een zorgoverleg
- Vul geen informatie in die niet in de tekst staat, maar mag wel logisch structureren en herformuleren
- Houd het beknopt maar volledig

Hier is de tekst:`,
};

const REPORT_LABELS = {
  '1op1': '1-op-1 Gespreksverslag',
  'vergadering-uitgebreid': 'Vergaderverslag (Uitgebreid)',
  'vergadering-beknopt': 'Vergaderverslag (Beknopt)',
  'mdo': 'MDO-verslag',
};

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const WHISPER_MAX_SIZE = 24 * 1024 * 1024; // 24 MB per chunk (safe margin under 25MB API limit)

// Split a file into chunks using ffmpeg, returns array of chunk file paths
async function splitAudioFile(filePath) {
  const ext = path.extname(filePath);
  const fileSize = fs.statSync(filePath).size;

  // If small enough, no splitting needed
  if (fileSize <= WHISPER_MAX_SIZE) {
    return [filePath];
  }

  // Get duration in seconds
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ]);
  const duration = parseFloat(stdout.trim());

  // Calculate number of chunks needed
  const numChunks = Math.ceil(fileSize / WHISPER_MAX_SIZE);
  const chunkDuration = Math.floor(duration / numChunks);

  const chunkDir = path.join(uploadsDir, `chunks-${Date.now()}`);
  fs.mkdirSync(chunkDir, { recursive: true });

  // Split using ffmpeg
  await execFileAsync('ffmpeg', [
    '-i', filePath,
    '-f', 'segment',
    '-segment_time', String(chunkDuration),
    '-c', 'copy',
    '-reset_timestamps', '1',
    path.join(chunkDir, `chunk_%03d${ext}`)
  ]);

  // Read chunk files in order
  const chunks = fs.readdirSync(chunkDir)
    .filter(f => f.startsWith('chunk_'))
    .sort()
    .map(f => path.join(chunkDir, f));

  return chunks;
}

// Clean up chunk files and directory
function cleanupChunks(chunkPaths) {
  if (chunkPaths.length === 0) return;
  const chunkDir = path.dirname(chunkPaths[0]);
  for (const p of chunkPaths) {
    fs.unlink(p, () => { });
  }
  // Remove chunk directory if it's a chunks-* dir
  if (path.basename(chunkDir).startsWith('chunks-')) {
    fs.rmdir(chunkDir, () => { });
  }
}

// Upload, transcribe and generate report
app.post('/api/transcribe', upload.single('audioFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Geen bestand geüpload.' });
  }

  const reportType = req.body.reportType;
  const prompt = PROMPTS[reportType];
  if (!prompt) {
    return res.status(400).json({ error: 'Ongeldig verslagtype geselecteerd.' });
  }

  const filePath = req.file.path;
  let chunkPaths = [];

  try {
    // Step 1: Split file if needed
    chunkPaths = await splitAudioFile(filePath);

    // Step 2: Transcribe each chunk sequentially
    const transcriptionParts = [];
    for (const chunkPath of chunkPaths) {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(chunkPath),
        model: 'whisper-1',
      });
      transcriptionParts.push(transcription.text);
    }

    // Clean up files
    fs.unlink(filePath, () => { });
    if (chunkPaths[0] !== filePath) {
      cleanupChunks(chunkPaths);
    }

    const rawText = transcriptionParts.join(' ');

    // Step 3: Generate report with GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: rawText },
      ],
      temperature: 0.3,
    });

    const report = completion.choices[0].message.content;

    res.json({
      rawText,
      report,
      reportType,
      reportLabel: REPORT_LABELS[reportType],
      filename: req.file.originalname,
    });
  } catch (err) {
    // Clean up all files on error
    fs.unlink(filePath, () => { });
    if (chunkPaths.length > 0 && chunkPaths[0] !== filePath) {
      cleanupChunks(chunkPaths);
    }

    console.error('Processing error:', err.message);
    res.status(500).json({
      error: 'Er is een fout opgetreden bij het verwerken. Controleer je API key en probeer het opnieuw.',
    });
  }
});

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
