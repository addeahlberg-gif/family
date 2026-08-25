# Privat familjeportal

Data sparas i Cloudflare D1 och synkas mellan enheter. Familjekoden skyddar portalen och sessionen lagras i en säker HttpOnly-cookie.

## Installera och publicera
1. `npm install`
2. `npx wrangler login`
3. `npm run db:create`
4. Ersätt `REPLACE_WITH_D1_DATABASE_ID` i `wrangler.jsonc` med ID:t från steg 3.
5. `npm run db:migrate`
6. `npm run secret:pin` och ange familjens kod.
7. `npm run secret:session` och ange en lång slumpmässig hemlighet.
8. `npm run deploy`

Lägg aldrig familjekoden eller sessionshemligheten i GitHub.
