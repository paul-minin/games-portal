# Standort (Mobile Karte)

Diese kleine Seite zeigt deinen Standort auf einer Karte (Leaflet + OpenStreetMap).

Wichtig:
- Standort funktioniert nur über **HTTPS** oder `localhost`.
- Empfohlen: Veröffentliche diese Seite per **GitHub Pages** oder teste mit einem HTTPS‑Tunnel (z. B. ngrok).

Schnell testen lokal (nur zum Entwickeln, nicht über HTTPS):
- Mit Node: `npx http-server -c-1` und im Browser `http://<dein-lan-ip>:8080/` (mobil im gleichen WLAN)
- Oder: `python -m http.server 8000`

Veröffentlichen auf GitHub Pages (mit GitHub CLI):
1. `git init` (im Ordner)
2. `git add . && git commit -m "Standort-Seite"`
3. `gh repo create <repo-name> --public --source=. --remote=origin --push`
4. In den Repo‑Settings GitHub Pages aktivieren oder `gh` verwenden: `gh repo edit --visibility public` und unter Pages einstellen.

Viel Erfolg! Wenn du willst, kann ich dir helfen, das Repo anzulegen und die Seite als Pages zu veröffentlichen.