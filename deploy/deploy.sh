#!/bin/bash
set -e

# === Configuratie ===
APP_DIR="/opt/speech-to-text"
SERVICE_NAME="speech-to-text"
NODE_VERSION="20"

echo "=== Spraak naar Tekst - Deploy Script ==="

# 1. Node.js installeren als dat nog niet is gebeurd
if ! command -v node &> /dev/null; then
    echo ">> Node.js installeren..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo ">> Node.js is al geïnstalleerd: $(node -v)"
fi

# 2. App directory aanmaken
echo ">> App directory aanmaken: ${APP_DIR}"
sudo mkdir -p ${APP_DIR}
sudo chown $USER:$USER ${APP_DIR}

# 3. Bestanden kopiëren
echo ">> Bestanden kopiëren..."
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cp "${SCRIPT_DIR}/server.js" ${APP_DIR}/
cp "${SCRIPT_DIR}/package.json" ${APP_DIR}/
cp -r "${SCRIPT_DIR}/public" ${APP_DIR}/

# 4. .env aanmaken als die nog niet bestaat
if [ ! -f "${APP_DIR}/.env" ]; then
    cp "${SCRIPT_DIR}/.env.example" "${APP_DIR}/.env"
    echo ""
    echo "!! BELANGRIJK: Vul je OpenAI API key in:"
    echo "   sudo nano ${APP_DIR}/.env"
    echo ""
fi

# 5. Dependencies installeren
echo ">> Dependencies installeren..."
cd ${APP_DIR}
npm install --omit=dev

# 6. Systemd service installeren
echo ">> Systemd service installeren..."
sudo cp "${SCRIPT_DIR}/deploy/speech-to-text.service" /etc/systemd/system/${SERVICE_NAME}.service

# Pas de user aan naar de huidige gebruiker
sudo sed -i "s/User=stefan/User=$USER/" /etc/systemd/system/${SERVICE_NAME}.service

sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

echo ""
echo "=== Deployment voltooid! ==="
echo ""
echo "Status controleren:"
echo "  sudo systemctl status ${SERVICE_NAME}"
echo ""
echo "Logs bekijken:"
echo "  sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "De app draait op: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
