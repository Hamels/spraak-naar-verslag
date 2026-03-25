# Spraak naar Tekst — WIJeindhoven

Een webapplicatie waarmee je een gesproken audio- of videobestand (MP3/MP4) uploadt en de tekst automatisch laat transcriberen via OpenAI Whisper.

## Vereisten

- **Node.js** 18+ (aanbevolen: 20 LTS)
- **OpenAI API Key** met toegang tot het Whisper model

## Installatie

```bash
# 1. Ga naar de projectmap
cd TextToSpeach

# 2. Installeer dependencies
npm install

# 3. Maak een .env bestand aan
cp .env.example .env

# 4. Vul je OpenAI API key in
nano .env
```

Zet in `.env`:
```
OPENAI_API_KEY=sk-jouw-echte-api-key
PORT=3000
```

## Starten

```bash
npm start
```

Open je browser op **http://localhost:3000**

## Gebruik

1. Open de website in je browser
2. Sleep een MP3, MP4, WAV of WebM bestand naar het uploadveld (of klik om te selecteren)
3. Klik op **Transcriberen**
4. Wacht tot de transcriptie klaar is
5. Kopieer de tekst of download als `.txt` bestand

## Projectstructuur

```
TextToSpeach/
├── server.js          # Node.js/Express backend
├── package.json
├── .env.example       # Voorbeeld configuratie
├── .gitignore
├── README.md
└── public/
    ├── index.html     # Frontend pagina
    ├── style.css      # Styling (WIJeindhoven huisstijl)
    └── app.js         # Frontend JavaScript
```

## Limieten

- Maximale bestandsgrootte: **25 MB** (limiet van OpenAI Whisper API)
- Ondersteunde formaten: MP3, MP4, WAV, WebM
