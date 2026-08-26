# Familjeplaneraren med Cloudflare D1

## Viktigt först
Öppna `wrangler.jsonc` och ersätt `REPLACE_WITH_YOUR_D1_DATABASE_ID` med ID:t för din D1-databas.

## Ny installation
1. Installera Node.js LTS.
2. Öppna PowerShell i projektmappen.
3. Kör `npm install`.
4. Kör `npx wrangler login`.
5. Kör `npm run db:create`.
6. Kopiera `database_id` från svaret och klistra in det i `wrangler.jsonc`.
7. Kör `npm run db:migrate:remote`.
8. Kör `npm run deploy`.

## Lokal test med lokal D1
1. Kör `npm install`.
2. Ersätt först databas-ID:t i `wrangler.jsonc`.
3. Kör `npm run db:migrate:local`.
4. Kör `npm run dev`.
5. Öppna adressen som Wrangler visar.

`npm run dev:vite` visar bara gränssnittet. D1-API:t körs när du använder `npm run dev`.

## Git-kopplad Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `dist`
- D1-bindingens variabelnamn måste vara `DB`.
- Kör migreringen mot fjärrdatabasen minst en gång: `npm run db:migrate:remote`.

## Data
Aktiviteter, familjemedlemmar och veckomat sparas gemensamt i D1. Webbläsarens localStorage används bara som reserv om API:t inte kan nås.
