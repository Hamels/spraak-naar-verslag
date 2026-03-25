# Spraak naar Verslag — NathAI

Webapplicatie om gesproken audio/video te uploaden, automatisch te transcriberen met OpenAI Whisper en daarna om te zetten naar een professioneel verslag.

## Functionaliteit

- Inlogpagina met sessie-authenticatie
- Upload van MP3, MP4, WAV en WebM
- Grote bestanden worden op de backend automatisch opgeknipt en sequentieel naar Whisper gestuurd
- Keuze uit 4 verslagtypes:
    1. 1-op-1 Gesprek
    2. Vergadering (Uitgebreid)
    3. Vergadering (Beknopt)
    4. MDO-verslag
- Resultaat met:
    - Geformatteerd verslag
    - Ruwe transcriptie (naslag)
    - Kopieer- en downloadknoppen voor beide

## Vereisten

- **Node.js** 18+ (aanbevolen: 20 LTS)
- **ffmpeg + ffprobe** (verplicht voor automatische chunking van grote bestanden)
- **OpenAI API Key** (Whisper + GPT)

Ubuntu installatie van ffmpeg:

```bash
sudo apt update
sudo apt install ffmpeg -y
```

## Installatie

```bash
# 1) Ga naar de projectmap
cd TextToSpeach

# 2) Installeer dependencies
npm install

# 3) Maak een .env bestand aan
cp .env.example .env

# 4) Vul je OpenAI API key in
nano .env
```

Zet in `.env`:

```env
OPENAI_API_KEY=sk-jouw-echte-api-key
PORT=3000
SESSION_SECRET=een-sterk-geheim
```

## Inloggen

De login is momenteel hardcoded in de backend:

- Gebruikersnaam: `nathalie`
- Wachtwoord: `Nathalie!`

## Starten

```bash
npm start
```

Open in browser:

- `http://localhost:3000`

## Gebruik

1. Log in
2. Upload een audio/video bestand
3. Kies een verslagtype in de dropdown
4. Klik op **Transcriberen**
5. Bekijk en download:
     - Het geformatteerde verslag
     - De ruwe transcriptie

## Belangrijke notities

- Er is geen frontend uploadlimiet ingesteld.
- Whisper accepteert per request beperkte bestandsgrootte; daarom splitst de backend grote bestanden automatisch in chunks.
- Chunks worden sequentieel verwerkt en daarna samengevoegd.

## Deploy (systemd)

In `deploy/` staan:

- `deploy/speech-to-text.service`
- `deploy/deploy.sh`

Na updates op de server:

```bash
cd /opt/speech-to-text
npm install
sudo systemctl restart speech-to-text
sudo systemctl status speech-to-text
```

## Projectstructuur

```text
TextToSpeach/
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
├── deploy/
│   ├── deploy.sh
│   └── speech-to-text.service
└── public/
        ├── index.html
        ├── login.html
        ├── style.css
        └── app.js
```
