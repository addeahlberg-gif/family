# Familjeplaneraren D1 - komplett version

Innehåller samtliga sju överenskomna funktioner:
1. Veckonummer i kalendern.
2. Dagens datum och namnsdag i sidhuvudet.
3. Manuell färgväljare för familjemedlemmar.
4. Återkommande aktiviteter: dagligen, varje vecka, varannan vecka och varje månad.
5. Dashboard för vald vecka.
6. Separat matsedel per år och vecka.
7. Kopiera en maträtt till valfri dag/vecka samt kopiera hela matsedelsveckan.

Befintlig D1-synk, stöd för flerdagarsaktiviteter och kopiering av aktiviteter är bevarade. Gammal `meals`-data migreras automatiskt till aktuell vecka och sparas därefter som `mealPlans`.

Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`
- D1 binding: `DB`

`wrangler.jsonc` innehåller det befintliga databas-ID:t. Ingen ny migrering behövs eftersom samma tabell `family_state` används.

## Rättning i version 1.1.1
API:t accepterar nu både det äldre fältet `meals` och det nya veckobundna `mealPlans`. Återkommande aktiviteter normaliseras och sparas med `recurrence` och `recurrenceUntil` i D1. Det förhindrar att appen felaktigt växlar till lokal reservlagring efter en ändring.
