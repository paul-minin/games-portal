# Sternefänger — kleines HTML-Game

Kleines, responsives Canvas-Spiel, das mit Touch (iPad) und Tastatur (Pfeiltasten / A D) gesteuert werden kann.

Features
- Touch-Buttons für links/rechts
- Drag auf dem Bildschirm zum Bewegen
- Punktesystem, Leben, Game Over
- Läuft in modernen Browsern (auch iPad)

Anleitung lokal testen
1. Einfach die Dateien im Browser öffnen: `index.html` (einige Browser blocken lokale Ressourcen, dann nutze einen kleinen Server)
2. Mit einem einfachen Server starten (Node.js):

   npx serve .

Oder mit Python 3:

   python -m http.server 8000

Veröffentlichen auf GitHub Pages
1. Erstelle ein neues Repository auf GitHub (z.B. `sternefanger`).
2. Lokal initialisieren und pushen:

   git init
   git add .
   git commit -m "Erstes Spiel: Sternefänger"
   git branch -M main
   git remote add origin <URL_des_Repos>
   git push -u origin main

3. In den Repository-Einstellungen -> Pages -> Branch `main` auswählen, dann ist die Seite unter `https://<dein-benutzername>.github.io/<repo>/` erreichbar.

Hast du Lust, dass ich das Repo für dich initialisiere und die Dateien vorbereite (ohne remote push)? Sag Bescheid, oder gib die Remote-URL, wenn ich pushen soll.