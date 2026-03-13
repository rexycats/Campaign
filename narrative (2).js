// ── NARRATIVE TRANSLATIONS ────────────────────────────────────────
// DataShop CEO — all story / narrative content in NL and EN.
// Access via:  n(id, field)  →  returns string in current LANG
// Example:     n('new_customer', 'title')

const NARRATIVE = {

  // ══ SCENARIOS ══════════════════════════════════════════════════
  scenarios: {
    new_customer: {
      nl: { title:'Nieuwe klant registreren', who:'Klantenservice',
            story:'<strong>Sophie Vermeersch</strong> uit <strong>Gent</strong> registreerde zich net. Email: <strong>sophie@mail.be</strong>. Actief account. Voeg toe!',
            obj:'INSERT INTO klant (naam, email, stad, actief) VALUES (...)',
            win:'Sophie staat in de databank! 🎉' },
      en: { title:'Register new customer', who:'Customer Service',
            story:'<strong>Sophie Vermeersch</strong> from <strong>Ghent</strong> just registered. Email: <strong>sophie@mail.be</strong>. Active account. Add her!',
            obj:'INSERT INTO klant (naam, email, stad, actief) VALUES (...)',
            win:'Sophie is in the database! 🎉' },
    },
    price_update: {
      nl: { title:'Prijsaanpassing doorvoeren', who:'Leverancier',
            story:'USB-C Hub (product_id=2) krijgt nieuwe prijs: <strong>€44.99</strong>. Pas aan vóór de webshop opent.',
            obj:'UPDATE product SET prijs = 44.99 WHERE product_id = 2',
            win:'Prijs bijgewerkt. Geen verlies meer. 💶' },
      en: { title:'Apply price update', who:'Supplier',
            story:'USB-C Hub (product_id=2) gets a new price: <strong>€44.99</strong>. Update it before the shop opens.',
            obj:'UPDATE product SET prijs = 44.99 WHERE product_id = 2',
            win:'Price updated. No more losses. 💶' },
    },
    query_gent: {
      nl: { title:'Klanten uit Gent opzoeken', who:'Marketing',
            story:'Marketing lanceert een Gent-campagne. Geef namen en e-mails van klanten uit <strong>Gent</strong>, gesorteerd op naam.',
            obj:'SELECT naam, email FROM klant WHERE stad = \'Gent\' ORDER BY naam',
            win:'Lijst verstuurd! Campagne gelanceerd. 📣' },
      en: { title:'Look up customers from Ghent', who:'Marketing',
            story:'Marketing is launching a Ghent campaign. Get names and emails of customers from <strong>Ghent</strong>, sorted by name.',
            obj:'SELECT naam, email FROM klant WHERE stad = \'Gent\' ORDER BY naam',
            win:'List sent! Campaign launched. 📣' },
    },
    deactivate_gdpr: {
      nl: { title:'GDPR — Account deactiveren', who:'Juridische Dienst',
            story:'<strong>Kobe Janssen</strong> (klant_id=4) vraagt deactivering. GDPR verbiedt verwijdering — zet enkel <strong>actief = 0</strong>.',
            obj:'UPDATE klant SET actief = 0 WHERE klant_id = 4',
            win:'Kobe gedeactiveerd. GDPR correct nageleefd. ✅' },
      en: { title:'GDPR — Deactivate account', who:'Legal Department',
            story:'<strong>Kobe Janssen</strong> (klant_id=4) requests deactivation. GDPR prohibits deletion — just set <strong>actief = 0</strong>.',
            obj:'UPDATE klant SET actief = 0 WHERE klant_id = 4',
            win:'Kobe deactivated. GDPR correctly followed. ✅' },
    },
    new_product: {
      nl: { title:'Nieuw product toevoegen', who:'Inkoop',
            story:'Nieuw product: <strong>Staande Lamp LED</strong>, prijs <strong>€89.99</strong>, stock <strong>10</strong>, categorie <strong>Wonen</strong>.',
            obj:'INSERT INTO product (naam, prijs, stock, categorie) VALUES (\'Staande Lamp LED\', 89.99, 10, \'Wonen\')',
            win:'Staande Lamp LED live! 💡' },
      en: { title:'Add new product', who:'Purchasing',
            story:'New product: <strong>Standing LED Lamp</strong>, price <strong>€89.99</strong>, stock <strong>10</strong>, category <strong>Wonen</strong>.',
            obj:'INSERT INTO product (naam, prijs, stock, categorie) VALUES (\'Staande Lamp LED\', 89.99, 10, \'Wonen\')',
            win:'Standing LED Lamp is live! 💡' },
    },
    active_customers: {
      nl: { title:'Actieve klanten opzoeken', who:'Marketing',
            story:'Haal alle klanten op waarbij <strong>actief = 1</strong>, gesorteerd op naam. Welke zijn er?',
            obj:'SELECT naam, email FROM klant WHERE actief = 1 ORDER BY naam',
            win:'Actieve klantenlijst klaar! Campagne kan starten. 📣' },
      en: { title:'Look up active customers', who:'Marketing',
            story:'Get all customers where <strong>actief = 1</strong>, sorted by name. Who are they?',
            obj:'SELECT naam, email FROM klant WHERE actief = 1 ORDER BY naam',
            win:'Active customer list ready! Campaign can start. 📣' },
    },
    count_products: {
      nl: { title:'Hoeveel producten?', who:'Voorraadmanager',
            story:'Hoeveel producten staan er in de databank? Gebruik <strong>COUNT(*)</strong> om het totaal te tellen.',
            obj:'SELECT COUNT(*) FROM product',
            win:'Productaantal geteld. Voorraadrapport klaar! 📊' },
      en: { title:'How many products?', who:'Stock Manager',
            story:'How many products are in the database? Use <strong>COUNT(*)</strong> to count the total.',
            obj:'SELECT COUNT(*) FROM product',
            win:'Product count done. Stock report ready! 📊' },
    },
    disable_coupon: {
      nl: { title:'🚨 CRISIS: Kortingscode deactiveren', who:'Ines — PR',
            story:'<strong>ALARM!</strong> Kortingscode <strong>FOUT999</strong> geeft 99% korting. Al 23 klanten misbruiken hem. <strong>DEACTIVEER NU!</strong>',
            obj:'UPDATE kortingscode SET actief = 0 WHERE code = \'FOUT999\'',
            win:'Crisis bezworen! FOUT999 gedeactiveerd. 🎉' },
      en: { title:'🚨 CRISIS: Deactivate discount code', who:'Ines — PR',
            story:'<strong>ALARM!</strong> Discount code <strong>FOUT999</strong> gives 99% off. Already 23 customers are abusing it. <strong>DEACTIVATE NOW!</strong>',
            obj:'UPDATE kortingscode SET actief = 0 WHERE code = \'FOUT999\'',
            win:'Crisis averted! FOUT999 deactivated. 🎉' },
    },
    restock_webcam: {
      nl: { title:'Webcam HD bijvullen', who:'Logistiek',
            story:'Webcam HD (product_id=5): stock=0. 20 nieuwe exemplaren zijn binnen. Verwerk dit.',
            obj:'UPDATE product SET stock = 20 WHERE product_id = 5',
            win:'Webcam HD terug in stock! 📷' },
      en: { title:'Restock HD Webcam', who:'Logistics',
            story:'HD Webcam (product_id=5): stock=0. 20 new units have arrived. Process this.',
            obj:'UPDATE product SET stock = 20 WHERE product_id = 5',
            win:'HD Webcam back in stock! 📷' },
    },
    new_order: {
      nl: { title:'Bestelling verwerken', who:'Orderverwerking',
            story:'Jana Pieters (klant_id=1) bestelde 3× Notitieboek A5 (product_id=3) op 2024-12-01. Status: "verwerking".',
            obj:'INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (1, 3, \'2024-12-01\', 3, \'verwerking\')',
            win:'Bestelling verwerkt! Jana krijgt een bevestiging. 📧' },
      en: { title:'Process order', who:'Order Processing',
            story:'Jana Pieters (klant_id=1) ordered 3× Notebook A5 (product_id=3) on 2024-12-01. Status: "verwerking".',
            obj:'INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (1, 3, \'2024-12-01\', 3, \'verwerking\')',
            win:'Order processed! Jana will receive a confirmation. 📧' },
    },
    count_orders: {
      nl: { title:'Bestellingen per klant tellen', who:'Analytics',
            story:'Investeerders willen weten welke klanten het meest actief zijn. Gebruik GROUP BY.',
            obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id',
            win:'Rapport klaar! Investeerders tevreden. 📈' },
      en: { title:'Count orders per customer', who:'Analytics',
            story:'Investors want to know which customers are most active. Use GROUP BY.',
            obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id',
            win:'Report ready! Investors satisfied. 📈' },
    },
    delete_test: {
      nl: { title:'Test-bestellingen opruimen', who:'Auditor',
            story:'Testbestellingen van vóór 2024-11-12 moeten weg. Altijd WHERE bij DELETE!',
            obj:'DELETE FROM bestelling WHERE datum < \'2024-11-12\'',
            win:'Testdata verwijderd. Database proper voor het fiscale jaar. 🧹' },
      en: { title:'Clean up test orders', who:'Auditor',
            story:'Test orders before 2024-11-12 must be removed. Always use WHERE with DELETE!',
            obj:'DELETE FROM bestelling WHERE datum < \'2024-11-12\'',
            win:'Test data deleted. Database clean for the fiscal year. 🧹' },
    },
    add_telefoon: {
      nl: { title:'Telefoon: kolom aanmaken & controleren', who:'Klantenservice Chef',
            story:'Stap 1: Voeg kolom <strong>telefoon VARCHAR(20)</strong> toe aan <strong>klant</strong>. Stap 2: Zoek daarna alle klanten waarbij <strong>telefoon IS NULL</strong> — dat zijn de klanten die nog gebeld moeten worden.',
            obj:'Stap 1: ALTER TABLE klant ADD COLUMN telefoon · Stap 2: SELECT ... WHERE telefoon IS NULL',
            win:'Kolom aangemaakt én NULL-controle geslaagd! Het outreach-team weet nu wie gebeld moet worden. ☎️' },
      en: { title:'Phone: add column & check', who:'Customer Service Lead',
            story:'Step 1: Add column <strong>telefoon VARCHAR(20)</strong> to <strong>klant</strong>. Step 2: Then find all customers where <strong>telefoon IS NULL</strong> — those are the customers still to be called.',
            obj:'Step 1: ALTER TABLE klant ADD COLUMN telefoon · Step 2: SELECT ... WHERE telefoon IS NULL',
            win:'Column added and NULL check passed! The outreach team now knows who to call. ☎️' },
    },
    low_stock: {
      nl: { title:'Producten met lage stock', who:'Logistiek',
            story:'Welke producten hebben een <strong>stock van minder dan 5</strong>? Maak een urgentielijst — inclusief stock=0!',
            obj:'SELECT naam, stock FROM product WHERE stock < 5 ORDER BY stock ASC',
            win:'Urgentielijst klaar! Bestelling geplaatst bij leverancier. 📦' },
      en: { title:'Low stock products', who:'Logistics',
            story:'Which products have a <strong>stock below 5</strong>? Make an urgency list — including stock=0!',
            obj:'SELECT naam, stock FROM product WHERE stock < 5 ORDER BY stock ASC',
            win:'Urgency list ready! Order placed with supplier. 📦' },
    },
    update_order_status: {
      nl: { title:'Bestellingsstatus bijwerken', who:'Leveringsdienst',
            story:'Bestelling 4 (status "onderweg") is aangekomen! Zet status op <strong>"geleverd"</strong>.',
            obj:'UPDATE bestelling SET status = \'geleverd\' WHERE bestelling_id = 4',
            win:'Bestelling gemarkeerd als geleverd! Klant krijgt bevestiging. ✅' },
      en: { title:'Update order status', who:'Delivery Service',
            story:'Order 4 (status "onderweg") has arrived! Set status to <strong>"geleverd"</strong>.',
            obj:'UPDATE bestelling SET status = \'geleverd\' WHERE bestelling_id = 4',
            win:'Order marked as delivered! Customer receives confirmation. ✅' },
    },
    create_leverancier: {
      nl: { title:'Leverancier: tabel aanmaken & eerste rij invoegen', who:'Inkoopmanager',
            story:'DataShop werkt samen met externe leveranciers. Stap 1: Maak tabel <strong>leverancier</strong> aan (leverancier_id PK AUTO, naam NOT NULL, email, land). Stap 2: Voeg eerste leverancier toe: <strong>TechParts BV</strong>, info@techparts.be, Belgie.',
            obj:'Stap 1: CREATE TABLE leverancier · Stap 2: INSERT INTO leverancier',
            win:'Tabel aangemaakt en eerste leverancier geregistreerd! DataShop is klaar voor partnerships. 🤝' },
      en: { title:'Supplier: create table & insert first row', who:'Purchasing Manager',
            story:'DataShop works with external suppliers. Step 1: Create table <strong>leverancier</strong> (leverancier_id PK AUTO, naam NOT NULL, email, land). Step 2: Add the first supplier: <strong>TechParts BV</strong>, info@techparts.be, Belgium.',
            obj:'Step 1: CREATE TABLE leverancier · Step 2: INSERT INTO leverancier',
            win:'Table created and first supplier registered! DataShop is ready for partnerships. 🤝' },
    },
    avg_review: {
      nl: { title:'Gemiddelde reviewscore', who:'Productmanager',
            story:'Bereken de <strong>gemiddelde score</strong> van alle reviews. Gebruik AVG().',
            obj:'SELECT AVG(score) FROM review',
            win:'Gemiddelde score berekend. ⭐' },
      en: { title:'Average review score', who:'Product Manager',
            story:'Calculate the <strong>average score</strong> of all reviews. Use AVG().',
            obj:'SELECT AVG(score) FROM review',
            win:'Average score calculated. ⭐' },
    },
    expensive: {
      nl: { title:'Premium producten raadplegen', who:'CFO',
            story:'Lijst van producten duurder dan <strong>€50</strong>, duurste eerst, voor marge-analyse.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > 50 ORDER BY prijs DESC',
            win:'CFO heeft zijn rapport. Marges goed! 💰' },
      en: { title:'View premium products', who:'CFO',
            story:'List of products more expensive than <strong>€50</strong>, most expensive first, for margin analysis.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > 50 ORDER BY prijs DESC',
            win:'CFO has their report. Margins look good! 💰' },
    },
    join_orders: {
      nl: { title:'JOIN — Bestellingen met klantnamen', who:'Analytics',
            story:'Logistiek wil klantnamen, datum en status. Twee tabellen: klant en bestelling. Gebruik impliciete JOIN.',
            obj:'SELECT k.naam, b.datum, b.status FROM bestelling b, klant k WHERE b.klant_id = k.klant_id',
            win:'JOIN geslaagd! Logistiek heeft overzicht. 🔗' },
      en: { title:'JOIN — Orders with customer names', who:'Analytics',
            story:'Logistics needs customer names, date and status. Two tables: klant and bestelling. Use an implicit JOIN.',
            obj:'SELECT k.naam, b.datum, b.status FROM bestelling b, klant k WHERE b.klant_id = k.klant_id',
            win:'JOIN succeeded! Logistics has a clear overview. 🔗' },
    },
    having: {
      nl: { title:'VIP-klanten (HAVING)', who:'Analytics',
            story:'VIP-programma voor klanten met <strong>méér dan 1 bestelling</strong>. Gebruik HAVING.',
            obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id HAVING COUNT(*) > 1',
            win:'VIP-lijst klaar! Jana Pieters is onze trouwste klant. 👑' },
      en: { title:'VIP customers (HAVING)', who:'Analytics',
            story:'VIP programme for customers with <strong>more than 1 order</strong>. Use HAVING.',
            obj:'SELECT klant_id, COUNT(*) FROM bestelling GROUP BY klant_id HAVING COUNT(*) > 1',
            win:'VIP list ready! Jana Pieters is our most loyal customer. 👑' },
    },
    max_stock: {
      nl: { title:'Product met meeste voorraad', who:'Logistiek',
            story:'Welk product heeft de <strong>hoogste stock</strong>? Gebruik ORDER BY + LIMIT 1.',
            obj:'SELECT naam, stock FROM product ORDER BY stock DESC LIMIT 1',
            win:'Notitieboek A5 heeft hoogste stock. Opslag geoptimaliseerd! 📦' },
      en: { title:'Product with most stock', who:'Logistics',
            story:'Which product has the <strong>highest stock</strong>? Use ORDER BY + LIMIT 1.',
            obj:'SELECT naam, stock FROM product ORDER BY stock DESC LIMIT 1',
            win:'Notebook A5 has the highest stock. Storage optimised! 📦' },
    },
    products_per_category: {
      nl: { title:'Producten per categorie', who:'CFO',
            story:'Hoeveel producten zitten er per categorie in de databank? Gebruik GROUP BY.',
            obj:'SELECT categorie, COUNT(*) FROM product GROUP BY categorie',
            win:'Categorieoverzicht klaar. Elektronica domineert! 🏆' },
      en: { title:'Products per category', who:'CFO',
            story:'How many products are in each category? Use GROUP BY.',
            obj:'SELECT categorie, COUNT(*) FROM product GROUP BY categorie',
            win:'Category overview ready. Electronics dominates! 🏆' },
    },
    min_max_prijs: {
      nl: { title:'Goedkoopste & duurste product', who:'CFO',
            story:'De CFO wil de <strong>goedkoopste</strong> én <strong>duurste</strong> prijs weten in één query. Gebruik MIN() en MAX().',
            obj:'SELECT MIN(prijs), MAX(prijs) FROM product',
            win:'Prijsbereik bepaald. Perfecte input voor de winststrategie! 💶' },
      en: { title:'Cheapest & most expensive product', who:'CFO',
            story:'The CFO wants the <strong>cheapest</strong> and <strong>most expensive</strong> price in one query. Use MIN() and MAX().',
            obj:'SELECT MIN(prijs), MAX(prijs) FROM product',
            win:'Price range determined. Perfect input for the profit strategy! 💶' },
    },
    join_all: {
      nl: { title:'Megaoverzicht: klant + bestelling + product', who:'Raad van Bestuur',
            story:'De Raad van Bestuur wil <strong>één overzicht</strong>: klantnaam, productnaam en datum. Koppel drie tabellen.',
            obj:'SELECT k.naam, p.naam, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id',
            win:'Megaoverzicht geleverd! De raad is onder de indruk. 🌐' },
      en: { title:'Mega overview: customer + order + product', who:'Board of Directors',
            story:'The Board wants <strong>one overview</strong>: customer name, product name and date. Join three tables.',
            obj:'SELECT k.naam, p.naam, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id',
            win:'Mega overview delivered! The board is impressed. 🌐' },
    },
    distinct_steden: {
      nl: { title:'Unieke steden (DISTINCT)', who:'Marketing',
            story:'Marketing wil weten in welke <strong>unieke steden</strong> onze klanten wonen — zonder duplicaten. Gebruik <strong>DISTINCT</strong>.',
            obj:'SELECT DISTINCT stad FROM klant',
            win:'Unieke steden gevonden! Campagne per regio kan starten. 🗺️' },
      en: { title:'Unique cities (DISTINCT)', who:'Marketing',
            story:'Marketing wants to know which <strong>unique cities</strong> our customers live in — without duplicates. Use <strong>DISTINCT</strong>.',
            obj:'SELECT DISTINCT stad FROM klant',
            win:'Unique cities found! Regional campaign can start. 🗺️' },
    },
    alias_products: {
      nl: { title:'Kolomaliassen gebruiken (AS)', who:'CFO',
            story:'Het rapport moet leesbare kolomnamen bevatten. Noem <strong>naam</strong> om als <strong>product</strong> en <strong>prijs</strong> als <strong>verkoopprijs</strong>. Gebruik het sleutelwoord <strong>AS</strong>.',
            obj:'SELECT naam AS product, prijs AS verkoopprijs FROM product',
            win:'Rapport met leesbare kolomnamen klaar! CFO tevreden. 📋' },
      en: { title:'Using column aliases (AS)', who:'CFO',
            story:'The report needs readable column names. Rename <strong>naam</strong> as <strong>product</strong> and <strong>prijs</strong> as <strong>verkoopprijs</strong>. Use the keyword <strong>AS</strong>.',
            obj:'SELECT naam AS product, prijs AS verkoopprijs FROM product',
            win:'Report with readable column names ready! CFO satisfied. 📋' },
    },
    subquery_above_avg: {
      nl: { title:'Producten boven gemiddelde prijs', who:'Finance',
            story:'Welke producten kosten <strong>meer dan de gemiddelde prijs</strong>? Los dit op met een <strong>subquery</strong> in de WHERE-clausule.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product)',
            win:'Subquery geslaagd! Premium producten geïdentificeerd. 🏆' },
      en: { title:'Products above average price', who:'Finance',
            story:'Which products cost <strong>more than the average price</strong>? Solve this with a <strong>subquery</strong> in the WHERE clause.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product)',
            win:'Subquery succeeded! Premium products identified. 🏆' },
    },
    subquery_in: {
      nl: { title:'Klanten die ooit besteld hebben', who:'Marketing',
            story:'Welke klanten hebben <strong>minstens één bestelling</strong> geplaatst? Gebruik een subquery met <strong>IN</strong> om klant_id\'s op te zoeken in de bestelling-tabel.',
            obj:'SELECT naam, email FROM klant WHERE klant_id IN (SELECT klant_id FROM bestelling)',
            win:'Klanten met bestellingen gevonden via subquery! Gerichte marketing mogelijk. 📧' },
      en: { title:'Customers who have ever ordered', who:'Marketing',
            story:'Which customers have placed <strong>at least one order</strong>? Use a subquery with <strong>IN</strong> to look up klant_id\'s in the bestelling table.',
            obj:'SELECT naam, email FROM klant WHERE klant_id IN (SELECT klant_id FROM bestelling)',
            win:'Customers with orders found via subquery! Targeted marketing is possible. 📧' },
    },
    distinct_count: {
      nl: { title:'Hoeveel unieke steden?', who:'Marketing',
            story:'Hoeveel <strong>verschillende steden</strong> zijn er in de klantendatabank? Gebruik <strong>COUNT(DISTINCT stad)</strong> om unieke steden te tellen.',
            obj:'SELECT COUNT(DISTINCT stad) FROM klant',
            win:'Unieke steden geteld! Marketinggebieden bepaald. 🗺️' },
      en: { title:'How many unique cities?', who:'Marketing',
            story:'How many <strong>different cities</strong> are in the customer database? Use <strong>COUNT(DISTINCT stad)</strong> to count unique cities.',
            obj:'SELECT COUNT(DISTINCT stad) FROM klant',
            win:'Unique cities counted! Marketing regions determined. 🗺️' },
    },
    join_alias_order: {
      nl: { title:'JOIN met aliassen en sortering', who:'Raad van Bestuur',
            story:'Overzicht van alle bestellingen: <strong>klantnaam als "klant"</strong>, <strong>productnaam als "artikel"</strong>, datum gesorteerd van nieuwste naar oudste. Combineer JOIN + AS + ORDER BY.',
            obj:'SELECT k.naam AS klant, p.naam AS artikel, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id ORDER BY b.datum DESC',
            win:'Meesterwerk! JOIN + AS + ORDER BY in één query. Raad van Bestuur staat te klappen. 👏' },
      en: { title:'JOIN with aliases and sorting', who:'Board of Directors',
            story:'Overview of all orders: <strong>customer name as "klant"</strong>, <strong>product name as "artikel"</strong>, date sorted newest first. Combine JOIN + AS + ORDER BY.',
            obj:'SELECT k.naam AS klant, p.naam AS artikel, b.datum FROM bestelling b, klant k, product p WHERE b.klant_id = k.klant_id AND b.product_id = p.product_id ORDER BY b.datum DESC',
            win:'Masterpiece! JOIN + AS + ORDER BY in one query. Board of Directors applauds. 👏' },
    },
    inner_join_basic: {
      nl: { title:'INNER JOIN: klanten en bestellingen', who:'Analytics',
            story:'Tijd voor de ANSI-standaard! Haal alle klanten op <strong>samen met hun besteldatum</strong> via een <strong>INNER JOIN</strong>. Alleen klanten die besteld hebben verschijnen in het resultaat.',
            obj:'SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id',
            win:'Perfecte INNER JOIN! Enkel klanten met bestellingen zichtbaar. ANSI-syntax onder de knie. ✅' },
      en: { title:'INNER JOIN: customers and orders', who:'Analytics',
            story:'Time for the ANSI standard! Get all customers <strong>together with their order date</strong> via an <strong>INNER JOIN</strong>. Only customers who have ordered appear in the result.',
            obj:'SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id',
            win:'Perfect INNER JOIN! Only customers with orders visible. ANSI syntax mastered. ✅' },
    },
    left_join_all: {
      nl: { title:'LEFT JOIN: ook klanten zonder bestelling', who:'Analytics',
            story:'We willen <strong>ALLE klanten</strong> zien, ook wie nog nooit iets besteld heeft. Gebruik een <strong>LEFT JOIN</strong> zodat klanten zonder bestelling ook verschijnen (met NULL als datum).',
            obj:'SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id',
            win:'LEFT JOIN geslaagd! Lena is onder de indruk: ook klanten zonder bestelling zijn zichtbaar. 🎯' },
      en: { title:'LEFT JOIN: including customers without orders', who:'Analytics',
            story:'We want to see <strong>ALL customers</strong>, including those who have never ordered. Use a <strong>LEFT JOIN</strong> so customers without orders also appear (with NULL as date).',
            obj:'SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id',
            win:'LEFT JOIN succeeded! Even customers without orders are visible. 🎯' },
    },
    join_three_tables: {
      nl: { title:'3-weg JOIN: klant + bestelling + product', who:'Raad van Bestuur',
            story:'De board wil weten <strong>wie wat besteld heeft</strong>: klantnaam, productnaam en aankoopprijs. Koppel <strong>drie tabellen</strong> via twee INNER JOINs.',
            obj:'SELECT klant.naam, product.naam, product.prijs FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id INNER JOIN product ON bestelling.product_id = product.product_id',
            win:'3-tabel JOIN in één query! Dit is enterprise-niveau SQL. Board of Directors applauds. 👏' },
      en: { title:'3-way JOIN: customer + order + product', who:'Board of Directors',
            story:'The board wants to know <strong>who ordered what</strong>: customer name, product name and purchase price. Join <strong>three tables</strong> using two INNER JOINs.',
            obj:'SELECT klant.naam, product.naam, product.prijs FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id INNER JOIN product ON bestelling.product_id = product.product_id',
            win:'3-table JOIN in one query! This is enterprise-level SQL. Board of Directors applauds. 👏' },
    },
    join_with_where: {
      nl: { title:'JOIN + WHERE: Gentse bestellingen', who:'Marketing',
            story:'Marketing wil een lijst van klanten uit <strong>Gent</strong> met hun bestellingen. Combineer een <strong>INNER JOIN</strong> met een <strong>WHERE</strong>-filter op stad.',
            obj:'SELECT klant.naam, bestelling.datum, bestelling.status FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE klant.stad = \'Gent\'',
            win:'JOIN + WHERE gecombineerd! Gentse klanten met hun orders in beeld voor gerichte campagnes. 📍' },
      en: { title:'JOIN + WHERE: Ghent orders', who:'Marketing',
            story:'Marketing wants a list of customers from <strong>Ghent</strong> with their orders. Combine an <strong>INNER JOIN</strong> with a <strong>WHERE</strong> filter on city.',
            obj:'SELECT klant.naam, bestelling.datum, bestelling.status FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE klant.stad = \'Gent\'',
            win:'JOIN + WHERE combined! Ghent customers with their orders visible for targeted campaigns. 📍' },
    },
    groupby_category: {
      nl: { title:'Omzet per categorie', who:'CFO',
            story:'Kwartaalrapport! Bereken de <strong>totale omzet per productcategorie</strong> via <strong>SUM(prijs)</strong> gegroepeerd op categorie. Sorteer van hoog naar laag.',
            obj:'SELECT categorie, SUM(prijs) FROM product GROUP BY categorie ORDER BY SUM(prijs) DESC',
            win:'Omzet per categorie berekend! Elektronica loopt duidelijk het best. Financieel rapport klaar. 📈' },
      en: { title:'Revenue per category', who:'CFO',
            story:'Quarterly report! Calculate the <strong>total revenue per product category</strong> using <strong>SUM(prijs)</strong> grouped by category. Sort from high to low.',
            obj:'SELECT categorie, SUM(prijs) FROM product GROUP BY categorie ORDER BY SUM(prijs) DESC',
            win:'Revenue per category calculated! Electronics clearly leads. Financial report ready. 📈' },
    },
    groupby_having: {
      nl: { title:'HAVING: categorieën met hoge gemiddelde prijs', who:'Finance',
            story:'We willen enkel categorieën zien met een <strong>gemiddelde prijs boven €30</strong>. Gebruik <strong>GROUP BY + HAVING</strong> om groepen te filteren na aggregatie.',
            obj:'SELECT categorie, AVG(prijs) FROM product GROUP BY categorie HAVING AVG(prijs) > 30',
            win:'HAVING gemeisterd! Enkel dure categorieën zichtbaar. Dit is het verschil tussen WHERE en HAVING. 🏆' },
      en: { title:'HAVING: categories with high average price', who:'Finance',
            story:'We only want to see categories with an <strong>average price above €30</strong>. Use <strong>GROUP BY + HAVING</strong> to filter groups after aggregation.',
            obj:'SELECT categorie, AVG(prijs) FROM product GROUP BY categorie HAVING AVG(prijs) > 30',
            win:'HAVING mastered! Only expensive categories visible. That\'s the difference between WHERE and HAVING. 🏆' },
    },
    groupby_count_status: {
      nl: { title:'Bestellingen per status tellen', who:'Logistiek',
            story:'Logistiek wil weten hoeveel bestellingen er per status zijn (geleverd, onderweg, verwerking). Gebruik <strong>COUNT(*) + GROUP BY status</strong>.',
            obj:'SELECT status, COUNT(*) FROM bestelling GROUP BY status',
            win:'Logistiek rapport klaar! Per status weten we exact hoeveel bestellingen wachten. 🚚' },
      en: { title:'Count orders per status', who:'Logistics',
            story:'Logistics wants to know how many orders there are per status (delivered, in transit, processing). Use <strong>COUNT(*) + GROUP BY status</strong>.',
            obj:'SELECT status, COUNT(*) FROM bestelling GROUP BY status',
            win:'Logistics report ready! We now know exactly how many orders are waiting per status. 🚚' },
    },
    create_table_leverancier: {
      nl: { title:'CREATE TABLE + INSERT: leveranciers beheren', who:'Inkoopmanager',
            story:'Herhaling op expert-niveau. Stap 1: Maak tabel <strong>leverancier</strong> opnieuw aan (leverancier_id PK AUTO_INCREMENT, naam NOT NULL, email, land). Stap 2: Voeg meteen een tweede leverancier in: <strong>CloudBase NV</strong>, cloud@cloudbase.be, Nederland.',
            obj:'Stap 1: CREATE TABLE leverancier · Stap 2: INSERT tweede leverancier',
            win:'Tabel aangemaakt en leverancier ingevoegd! Expert-niveau DDL + DML gecombineerd. 🏗️' },
      en: { title:'CREATE TABLE + INSERT: manage suppliers', who:'Purchasing Manager',
            story:'Expert-level recap. Step 1: Create table <strong>leverancier</strong> again (leverancier_id PK AUTO_INCREMENT, naam NOT NULL, email, land). Step 2: Immediately insert a second supplier: <strong>CloudBase NV</strong>, cloud@cloudbase.be, Netherlands.',
            obj:'Step 1: CREATE TABLE leverancier · Step 2: INSERT second supplier',
            win:'Table created and supplier inserted! Expert-level DDL + DML combined. 🏗️' },
    },
    alter_add_column: {
      nl: { title:'ALTER TABLE: kolom toevoegen & vullen', who:'Lena — Lead Engineer',
            story:'Stap 1: Voeg kolom <strong>geboortedatum DATE</strong> toe aan tabel <strong>klant</strong>. Stap 2: Vul het geboortedatum van Jana Pieters (klant_id=1) in: <strong>1990-03-15</strong>. Zo zie je het verschil tussen structuur aanpassen (DDL) en data aanpassen (DML).',
            obj:'Stap 1: ALTER TABLE klant ADD COLUMN geboortedatum · Stap 2: UPDATE klant SET geboortedatum',
            win:'DDL geslaagd — de structuur is aangepast. Data ingevoerd via DML. Perfect gecombineerd! 🏗️' },
      en: { title:'ALTER TABLE: add column & fill it', who:'Lena — Lead Engineer',
            story:'Step 1: Add column <strong>geboortedatum DATE</strong> to table <strong>klant</strong>. Step 2: Fill in the birthdate of Jana Pieters (klant_id=1): <strong>1990-03-15</strong>. This shows the difference between changing structure (DDL) and changing data (DML).',
            obj:'Step 1: ALTER TABLE klant ADD COLUMN geboortedatum · Step 2: UPDATE klant SET geboortedatum',
            win:'DDL succeeded — structure updated. Data entered via DML. Perfectly combined! 🏗️' },
    },
    join_having_advanced: {
      nl: { title:'JOIN + GROUP BY + HAVING: topklanten', who:'Venture Capitalist',
            story:'De investeerders willen de <strong>klanten die meer dan 1 bestelling</strong> geplaatst hebben. Koppel klant aan bestelling, groepeer per klant en filter via HAVING. Dit is het meest geavanceerde patroon in SQL.',
            obj:'SELECT klant.naam, COUNT(*) FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id GROUP BY klant.naam HAVING COUNT(*) > 1',
            win:'JOIN + GROUP BY + HAVING in één query! Dit is het niveau van een senior data engineer. Investeerders tekenen. 🌟💰' },
      en: { title:'JOIN + GROUP BY + HAVING: top customers', who:'Venture Capitalist',
            story:'The investors want to see <strong>customers with more than 1 order</strong>. Join customer to order, group per customer and filter via HAVING. This is the most advanced SQL pattern.',
            obj:'SELECT klant.naam, COUNT(*) FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id GROUP BY klant.naam HAVING COUNT(*) > 1',
            win:'JOIN + GROUP BY + HAVING in one query! This is senior data engineer level. Investors are signing. 🌟💰' },
    },
    delete_review: {
      nl: { title:'Slechte review verwijderen', who:'Klantenservice',
            story:'Klant Lena Maes dient een verwijderverzoek in voor haar review (review_id=3). Verwijder alleen die review.',
            obj:'DELETE FROM review WHERE review_id = 3',
            win:'Review verwijderd. Verzoek GDPR-conform verwerkt. ✅' },
      en: { title:'Delete bad review', who:'Customer Service',
            story:'Customer Lena Maes submits a deletion request for her review (review_id=3). Delete only that review.',
            obj:'DELETE FROM review WHERE review_id = 3',
            win:'Review deleted. Request processed in GDPR compliance. ✅' },
    },
    insert_review: {
      nl: { title:'Klantreview toevoegen', who:'Klantenservice',
            story:'Jana Pieters (klant_id=1) geeft product 3 (Notitieboek A5) een score van <strong>5</strong> met commentaar <strong>"Top kwaliteit!"</strong>.',
            obj:'INSERT INTO review (klant_id, product_id, score, commentaar) VALUES (1, 3, 5, \'Top kwaliteit!\')',
            win:'Review opgeslagen! Jana is blij gehoord te worden. ⭐' },
      en: { title:'Add customer review', who:'Customer Service',
            story:'Jana Pieters (klant_id=1) gives product 3 (Notebook A5) a score of <strong>5</strong> with comment <strong>"Top kwaliteit!"</strong>.',
            obj:'INSERT INTO review (klant_id, product_id, score, commentaar) VALUES (1, 3, 5, \'Top kwaliteit!\')',
            win:'Review saved! Jana is happy to be heard. ⭐' },
    },
    activate_coupon: {
      nl: { title:'Kortingscode activeren', who:'Marketing',
            story:'Zomercampagne! Kortingscode <strong>ZOMER20</strong> moet geactiveerd worden (actief = 1).',
            obj:'UPDATE kortingscode SET actief = 1 WHERE code = \'ZOMER20\'',
            win:'ZOMER20 geactiveerd! Campagne kan starten. 🌞' },
      en: { title:'Activate discount code', who:'Marketing',
            story:'Summer campaign! Discount code <strong>ZOMER20</strong> must be activated (actief = 1).',
            obj:'UPDATE kortingscode SET actief = 1 WHERE code = \'ZOMER20\'',
            win:'ZOMER20 activated! Campaign can start. 🌞' },
    },
    delete_inactive: {
      nl: { title:'Inactieve klant verwijderen', who:'Auditor',
            story:'Audit resultaat: klant_id=4 (Kobe Janssen) is inactief en heeft nooit besteld. Hij mag volledig verwijderd worden.',
            obj:'DELETE FROM klant WHERE klant_id = 4',
            win:'Kobe correct verwijderd uit de databank. 🧹' },
      en: { title:'Delete inactive customer', who:'Auditor',
            story:'Audit result: klant_id=4 (Kobe Janssen) is inactive and has never ordered. He can be fully removed.',
            obj:'DELETE FROM klant WHERE klant_id = 4',
            win:'Kobe correctly deleted from the database. 🧹' },
    },
    insert_coupon: {
      nl: { title:'Nieuwe kortingscode aanmaken', who:'Marketing',
            story:'Zwarte Vrijdag! Maak kortingscode <strong>BLACK30</strong> aan: <strong>30%</strong> korting, actief (1), gebruik <strong>0</strong>.',
            obj:'INSERT INTO kortingscode (code, korting, actief, gebruik) VALUES (\'BLACK30\', 30, 1, 0)',
            win:'BLACK30 aangemaakt! Klanten gaan genieten van 30% korting. 🛍️' },
      en: { title:'Create new discount code', who:'Marketing',
            story:'Black Friday! Create discount code <strong>BLACK30</strong>: <strong>30%</strong> off, active (1), usage <strong>0</strong>.',
            obj:'INSERT INTO kortingscode (code, korting, actief, gebruik) VALUES (\'BLACK30\', 30, 1, 0)',
            win:'BLACK30 created! Customers will enjoy 30% off. 🛍️' },
    },
    update_stock_category: {
      nl: { title:'Elektronicastock verhogen', who:'Logistiek',
            story:'Grote levering elektronica binnen! Verhoog de stock van <strong>alle Elektronica-producten</strong> met <strong>10</strong>.',
            obj:'UPDATE product SET stock = stock + 10 WHERE categorie = \'Elektronica\'',
            win:'Elektronicastock opgehoogd! Geen tekorten meer. ⚡' },
      en: { title:'Increase electronics stock', who:'Logistics',
            story:'Large electronics delivery arrived! Increase the stock of <strong>all Electronics products</strong> by <strong>10</strong>.',
            obj:'UPDATE product SET stock = stock + 10 WHERE categorie = \'Elektronica\'',
            win:'Electronics stock increased! No more shortages. ⚡' },
    },
    delete_product_reviews: {
      nl: { title:'Reviews van gestopt product wissen', who:'Productmanager',
            story:'Product 3 (Notitieboek A5) wordt stopgezet. Verwijder alle reviews van product_id=3 vóór het product zelf weg kan.',
            obj:'DELETE FROM review WHERE product_id = 3',
            win:'Reviews verwijderd. Product kan nu volledig uit de databank. 🧹' },
      en: { title:'Delete reviews of discontinued product', who:'Product Manager',
            story:'Product 3 (Notebook A5) is being discontinued. Delete all reviews of product_id=3 before the product itself can be removed.',
            obj:'DELETE FROM review WHERE product_id = 3',
            win:'Reviews deleted. Product can now be fully removed from the database. 🧹' },
    },
    delete_no_orders: {
      nl: { title:'Klanten zonder bestelling verwijderen', who:'Data Engineer',
            story:'Dataopschoning: verwijder alle klanten die <strong>nooit een bestelling</strong> hebben geplaatst. Gebruik NOT IN met een subquery.',
            obj:'DELETE FROM klant WHERE klant_id NOT IN (SELECT klant_id FROM bestelling)',
            win:'Klanten zonder bestellingen opgeruimd. Zuivere databank! 🧹' },
      en: { title:'Delete customers without orders', who:'Data Engineer',
            story:'Data cleanup: delete all customers who have <strong>never placed an order</strong>. Use NOT IN with a subquery.',
            obj:'DELETE FROM klant WHERE klant_id NOT IN (SELECT klant_id FROM bestelling)',
            win:'Customers without orders cleaned up. Pure database! 🧹' },
    },
    insert_bulk_order: {
      nl: { title:'Bestelling van topklant verwerken', who:'Orderverwerking',
            story:'Fatima El Asri (klant_id=5) bestelde 2x Ergonomische stoel (product_id=4) op <strong>2025-01-15</strong>. Status: <strong>"verwerking"</strong>.',
            obj:'INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (5, 4, \'2025-01-15\', 2, \'verwerking\')',
            win:'Bestellingsverwerking afgerond. Fatima krijgt een bevestiging. 📧' },
      en: { title:'Process top customer order', who:'Order Processing',
            story:'Fatima El Asri (klant_id=5) ordered 2x Ergonomic Chair (product_id=4) on <strong>2025-01-15</strong>. Status: <strong>"verwerking"</strong>.',
            obj:'INSERT INTO bestelling (klant_id, product_id, datum, aantal, status) VALUES (5, 4, \'2025-01-15\', 2, \'verwerking\')',
            win:'Order processing complete. Fatima will receive a confirmation. 📧' },
    },
    update_top_discount: {
      nl: { title:'VIP kortingscode upgraden', who:'Marketing',
            story:'VIP-actie: verhoog de korting van <strong>TROUW15</strong> naar <strong>25%</strong> én verhoog het gebruik met 1 (loyaliteitsbonus).',
            obj:'UPDATE kortingscode SET korting = 25, gebruik = gebruik + 1 WHERE code = \'TROUW15\'',
            win:'TROUW15 bijgewerkt naar 25% korting. VIP-klant in de wolken! 👑' },
      en: { title:'Upgrade VIP discount code', who:'Marketing',
            story:'VIP action: increase the discount of <strong>TROUW15</strong> to <strong>25%</strong> and increase usage by 1 (loyalty bonus).',
            obj:'UPDATE kortingscode SET korting = 25, gebruik = gebruik + 1 WHERE code = \'TROUW15\'',
            win:'TROUW15 updated to 25% discount. VIP customer is thrilled! 👑' },
    },
    delete_old_reviews: {
      nl: { title:'Negatieve reviews opschonen', who:'Productmanager',
            story:'Negatieve reviews (score ≤ 2) schaden de reputatie. Verwijder alle reviews met score <strong>kleiner dan of gelijk aan 2</strong>.',
            obj:'DELETE FROM review WHERE score <= 2',
            win:'Lage reviews verwijderd. Reputatie hersteld! ⭐' },
      en: { title:'Clean up negative reviews', who:'Product Manager',
            story:'Negative reviews (score ≤ 2) damage the reputation. Delete all reviews with a score <strong>less than or equal to 2</strong>.',
            obj:'DELETE FROM review WHERE score <= 2',
            win:'Low reviews deleted. Reputation restored! ⭐' },
    },
    like_search: {
      nl: { title:'Klanten zoeken op naam', who:'Marketing',
            story:'Marketing wil een campagne sturen naar alle klanten waarvan de naam begint met de letter <strong>J</strong>. Gebruik <strong>LIKE</strong> om op naampatroon te filteren.',
            obj:'SELECT naam, email FROM klant WHERE naam LIKE \'J%\'',
            win:'J-klanten gevonden! Campagne verstuurd. 📣' },
      en: { title:'Search customers by name', who:'Marketing',
            story:'Marketing wants to send a campaign to all customers whose name starts with the letter <strong>J</strong>. Use <strong>LIKE</strong> to filter by name pattern.',
            obj:'SELECT naam, email FROM klant WHERE naam LIKE \'J%\'',
            win:'J-customers found! Campaign sent. 📣' },
    },
    between_price: {
      nl: { title:'Middensegment producten', who:'Inkoop',
            story:'Inkoop zoekt producten in het middensegment: prijs <strong>tussen €20 en €80</strong> (inclusief). Gebruik <strong>BETWEEN</strong>.',
            obj:'SELECT naam, prijs FROM product WHERE prijs BETWEEN 20 AND 80',
            win:'Middensegment in kaart gebracht! Inkoopstrategie klaar. 💼' },
      en: { title:'Mid-range products', who:'Purchasing',
            story:'Purchasing is looking for mid-range products: price <strong>between €20 and €80</strong> (inclusive). Use <strong>BETWEEN</strong>.',
            obj:'SELECT naam, prijs FROM product WHERE prijs BETWEEN 20 AND 80',
            win:'Mid-range mapped! Purchasing strategy ready. 💼' },
    },
    null_email: {
      nl: { title:'Klanten zonder e-mailadres', who:'Data Engineer',
            story:'Dataopschoning: welke klanten hebben <strong>geen e-mailadres</strong> ingevuld? Gebruik <strong>IS NULL</strong> — nooit <code>= NULL</code>!',
            obj:'SELECT naam FROM klant WHERE email IS NULL',
            win:'Klanten zonder e-mail gevonden. Klantenservice neemt contact op via post. 📬' },
      en: { title:'Customers without email address', who:'Data Engineer',
            story:'Data cleanup: which customers have <strong>no email address</strong> filled in? Use <strong>IS NULL</strong> — never <code>= NULL</code>!',
            obj:'SELECT naam FROM klant WHERE email IS NULL',
            win:'Customers without email found. Customer service will contact them by post. 📬' },
    },
    not_in_products: {
      nl: { title:'Producten zonder reviews', who:'Productmanager',
            story:'Welke producten hebben <strong>nog nooit een review</strong> ontvangen? Gebruik <strong>NOT IN</strong> met een subquery op de review-tabel.',
            obj:'SELECT naam FROM product WHERE product_id NOT IN (SELECT product_id FROM review)',
            win:'Producten zonder feedback geïdentificeerd. Inkoopteam stuurt testpakketjes. 📦' },
      en: { title:'Products without reviews', who:'Product Manager',
            story:'Which products have <strong>never received a review</strong>? Use <strong>NOT IN</strong> with a subquery on the review table.',
            obj:'SELECT naam FROM product WHERE product_id NOT IN (SELECT product_id FROM review)',
            win:'Products without feedback identified. Purchasing team sends test packages. 📦' },
    },
    anti_join_no_orders: {
      nl: { title:'Klanten die nog nooit besteld hebben', who:'Marketing',
            story:'Marketing wil klanten activeren die <strong>nooit een bestelling</strong> hebben geplaatst. Gebruik een <strong>LEFT JOIN + WHERE IS NULL</strong> (anti-join patroon).',
            obj:'SELECT klant.naam, klant.email FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE bestelling.klant_id IS NULL',
            win:'Anti-join geslaagd! Inactieve klanten gevonden. Reactivatiecampagne klaar. 📧' },
      en: { title:'Customers who have never ordered', who:'Marketing',
            story:'Marketing wants to activate customers who have <strong>never placed an order</strong>. Use a <strong>LEFT JOIN + WHERE IS NULL</strong> (anti-join pattern).',
            obj:'SELECT klant.naam, klant.email FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE bestelling.klant_id IS NULL',
            win:'Anti-join succeeded! Inactive customers found. Reactivation campaign ready. 📧' },
    },
    like_product_search: {
      nl: { title:'Producten zoeken op sleutelwoord', who:'Webshop',
            story:'De zoekbalk van de webshop filtert producten op naam. Zoek alle producten waarvan de naam <strong>"Cam"</strong> bevat — klanten zoeken naar camera\'s en webcams.',
            obj:'SELECT naam, prijs, stock FROM product WHERE naam LIKE \'%Cam%\'',
            win:'Zoekresultaten gevonden! Webcam HD en Camera-producten zichtbaar. 📷' },
      en: { title:'Search products by keyword', who:'Webshop',
            story:'The webshop search bar filters products by name. Find all products whose name contains <strong>"Cam"</strong> — customers are searching for cameras and webcams.',
            obj:'SELECT naam, prijs, stock FROM product WHERE naam LIKE \'%Cam%\'',
            win:'Search results found! HD Webcam and Camera products visible. 📷' },
    },
    between_dates: {
      nl: { title:'Bestellingen van Q4 2024', who:'Finance',
            story:'Kwartaalrapport: haal alle bestellingen op van <strong>Q4 2024</strong> — van 1 oktober tot en met 31 december 2024. Gebruik <strong>BETWEEN</strong> met datums.',
            obj:'SELECT bestelling_id, datum, status FROM bestelling WHERE datum BETWEEN \'2024-10-01\' AND \'2024-12-31\'',
            win:'Q4-rapport klaar! Alle bestellingen van het laatste kwartaal in beeld. 📊' },
      en: { title:'Orders from Q4 2024', who:'Finance',
            story:'Quarterly report: get all orders from <strong>Q4 2024</strong> — from 1 October to 31 December 2024. Use <strong>BETWEEN</strong> with dates.',
            obj:'SELECT bestelling_id, datum, status FROM bestelling WHERE datum BETWEEN \'2024-10-01\' AND \'2024-12-31\'',
            win:'Q4 report ready! All orders from the last quarter visible. 📊' },
    },
    case_stock_status: {
      nl: { title:'Stockstatus labelen met CASE WHEN', who:'Logistiek',
            story:'Logistiek wil een overzicht met een leesbare <strong>stockstatus</strong>: "Uitverkocht" als stock = 0, "Bijna op" als stock < 5, anders "Op voorraad". Gebruik <strong>CASE WHEN</strong>.',
            obj:'SELECT naam, stock, CASE WHEN stock = 0 THEN \'Uitverkocht\' WHEN stock < 5 THEN \'Bijna op\' ELSE \'Op voorraad\' END AS status FROM product',
            win:'CASE WHEN gemeisterd! Stockoverzicht met leesbare labels. Logistiek blij! 🏷️' },
      en: { title:'Label stock status with CASE WHEN', who:'Logistics',
            story:'Logistics wants an overview with a readable <strong>stock status</strong>: "Uitverkocht" if stock = 0, "Bijna op" if stock < 5, otherwise "Op voorraad". Use <strong>CASE WHEN</strong>.',
            obj:'SELECT naam, stock, CASE WHEN stock = 0 THEN \'Uitverkocht\' WHEN stock < 5 THEN \'Bijna op\' ELSE \'Op voorraad\' END AS status FROM product',
            win:'CASE WHEN mastered! Stock overview with readable labels. Logistics happy! 🏷️' },
    },
    join_product_review: {
      nl: { title:'Producten met hun reviews', who:'Marketing',
            story:'Marketing wil een overzicht van <strong>producten met hun gemiddelde reviewscore</strong>. Koppel de tabel product aan review via product_id.',
            obj:'SELECT p.naam, AVG(r.score) AS gemiddelde FROM product p INNER JOIN review r ON p.product_id = r.product_id GROUP BY p.product_id, p.naam',
            win:'Reviewoverzicht klaar! Marketing heeft nu een duidelijk beeld van klanttevredenheid per product. 🌟' },
      en: { title:'Products with their reviews', who:'Marketing',
            story:'Marketing wants an overview of <strong>products with their average review score</strong>. Join the product table to review via product_id.',
            obj:'SELECT p.naam, AVG(r.score) AS gemiddelde FROM product p INNER JOIN review r ON p.product_id = r.product_id GROUP BY p.product_id, p.naam',
            win:'Review overview ready! Marketing now has a clear picture of customer satisfaction per product. 🌟' },
    },
    subquery_expensive: {
      nl: { title:'Producten duurder dan gemiddeld', who:'Finance',
            story:'Finance wil een lijst van <strong>producten die duurder zijn dan het gemiddelde</strong>. Gebruik een subquery om het gemiddelde te berekenen.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product) ORDER BY prijs DESC',
            win:'Subquery gemeisterd! Finance heeft nu een lijst van premium producten boven het gemiddelde. 💎' },
      en: { title:'Products more expensive than average', who:'Finance',
            story:'Finance wants a list of <strong>products that are more expensive than average</strong>. Use a subquery to calculate the average.',
            obj:'SELECT naam, prijs FROM product WHERE prijs > (SELECT AVG(prijs) FROM product) ORDER BY prijs DESC',
            win:'Subquery mastered! Finance now has a list of premium products above average. 💎' },
    },
    update_email: {
      nl: { title:'E-mailadres bijwerken', who:'Klantenservice',
            story:'Klant Jana Pieters (klant_id=1) heeft haar e-mailadres gewijzigd naar <strong>jana.pieters@nieuw.be</strong>. Update de database.',
            obj:'UPDATE klant SET email = \'jana.pieters@nieuw.be\' WHERE klant_id = 1',
            win:'E-mail bijgewerkt! Jana kan nu inloggen met haar nieuwe adres. 📬' },
      en: { title:'Update email address', who:'Customer Service',
            story:'Customer Jana Pieters (klant_id=1) has changed her email to <strong>jana.pieters@nieuw.be</strong>. Update the database.',
            obj:'UPDATE klant SET email = \'jana.pieters@nieuw.be\' WHERE klant_id = 1',
            win:'Email updated! Jana can now log in with her new address. 📬' },
    },
    search_by_email_domain: {
      nl: { title:'Klanten op e-maildomein zoeken', who:'IT',
            story:'IT wil alle klanten vinden met een <strong>@mail.be</strong> e-mailadres voor een security-controle.',
            obj:'SELECT naam, email FROM klant WHERE email LIKE \'%@mail.be\'',
            win:'Security-controle klaar! Alle @mail.be klanten gevonden. 🔐' },
      en: { title:'Search customers by email domain', who:'IT',
            story:'IT wants to find all customers with a <strong>@mail.be</strong> email address for a security check.',
            obj:'SELECT naam, email FROM klant WHERE email LIKE \'%@mail.be\'',
            win:'Security check done! All @mail.be customers found. 🔐' },
    },
    revenue_per_customer: {
      nl: { title:'Omzet per klant berekenen', who:'CFO',
            story:'De CFO wil weten hoeveel <strong>elke klant totaal heeft besteld</strong> (som van totaal_prijs). Sorteer op omzet aflopend.',
            obj:'SELECT k.naam, SUM(b.totaal_prijs) AS omzet FROM klant k INNER JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY omzet DESC',
            win:'Omzetranking klaar! De CFO ziet nu wie de top-klanten zijn. 🏆' },
      en: { title:'Calculate revenue per customer', who:'CFO',
            story:'The CFO wants to know how much <strong>each customer has ordered in total</strong> (sum of totaal_prijs). Sort by revenue descending.',
            obj:'SELECT k.naam, SUM(b.totaal_prijs) AS omzet FROM klant k INNER JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY omzet DESC',
            win:'Revenue ranking ready! The CFO can now see who the top customers are. 🏆' },
    },
    select_all_products: {
      nl: { title:'Alle producten bekijken', who:'CEO — jij',
            story:'Je hebt net toegang tot de database. Bekijk alle producten om een overzicht te krijgen van het assortiment.',
            obj:'SELECT * FROM product',
            win:'Perfect! Je ziet nu alle producten. Zo krijg je snel overzicht. 🎉' },
      en: { title:'View all products', who:'CEO — you',
            story:'You just got access to the database. View all products to get an overview of the range.',
            obj:'SELECT * FROM product',
            win:'Perfect! You can now see all products. Great way to get a quick overview. 🎉' },
    },
    count_klanten: {
      nl: { title:'Hoeveel klanten zijn er?', who:'Investeerder',
            story:'Een investeerder vraagt hoeveel klanten DataShop heeft. Tel alle rijen in de klant-tabel.',
            obj:'SELECT COUNT(*) AS aantal_klanten FROM klant',
            win:'Geteld! Je weet nu exact hoeveel klanten er zijn. 📊' },
      en: { title:'How many customers are there?', who:'Investor',
            story:'An investor asks how many customers DataShop has. Count all rows in the klant table.',
            obj:'SELECT COUNT(*) AS aantal_klanten FROM klant',
            win:'Counted! You now know exactly how many customers there are. 📊' },
    },
    join_top_products: {
      nl: { title:'Bestsellers via bestellingen', who:'Investeerder',
            story:'De investeerder wil weten welke producten het vaakst besteld zijn. JOIN product en bestelling, tel bestellingen per product, sorteer aflopend.',
            obj:'SELECT p.naam, COUNT(b.bestelling_id) AS aantal FROM product p LEFT JOIN bestelling b ON p.product_id = b.product_id GROUP BY p.product_id, p.naam ORDER BY aantal DESC',
            win:'Bestseller-ranking klaar! De investor is onder de indruk. 🏆' },
      en: { title:'Bestsellers via orders', who:'Investor',
            story:'The investor wants to know which products are ordered most often. JOIN product and bestelling, count orders per product, sort descending.',
            obj:'SELECT p.naam, COUNT(b.bestelling_id) AS aantal FROM product p LEFT JOIN bestelling b ON p.product_id = b.product_id GROUP BY p.product_id, p.naam ORDER BY aantal DESC',
            win:'Bestseller ranking ready! The investor is impressed. 🏆' },
    },
    update_stock_bulk: {
      nl: { title:'Stock aanvullen na levering', who:'Logistiek',
            story:'Er is een levering binnengekomen. Verhoog de stock van ALLE producten met categorie "Elektronica" met 10.',
            obj:'UPDATE product SET stock = stock + 10 WHERE categorie = \'Elektronica\'',
            win:'Voorraad bijgewerkt! Alle elektronica-producten hebben 10 extra stuks. 📦' },
      en: { title:'Top up stock after delivery', who:'Logistics',
            story:'A delivery has arrived. Increase the stock of ALL products with category "Elektronica" by 10.',
            obj:'UPDATE product SET stock = stock + 10 WHERE categorie = \'Elektronica\'',
            win:'Stock updated! All electronics products have 10 extra units. 📦' },
    },
    select_active_products: {
      nl: { title:'Producten in stock', who:'Webshop',
            story:'De webshop toont alleen producten met meer dan 0 stuks op voorraad. Haal alle producten op waar <strong>stock > 0</strong>.',
            obj:'SELECT naam, prijs, stock FROM product WHERE stock > 0 ORDER BY stock DESC',
            win:'Productoverzicht klaar! De webshop toont nu alleen leverbare producten. ✅' },
      en: { title:'Products in stock', who:'Webshop',
            story:'The webshop only shows products with more than 0 units in stock. Get all products where <strong>stock > 0</strong>.',
            obj:'SELECT naam, prijs, stock FROM product WHERE stock > 0 ORDER BY stock DESC',
            win:'Product overview ready! The webshop now only shows deliverable products. ✅' },
    },
    subquery_top_customer: {
      nl: { title:'Klant met meeste bestellingen', who:'Marketing',
            story:'Zoek de naam van de klant die de <strong>meeste bestellingen</strong> heeft geplaatst. Gebruik een subquery of GROUP BY + LIMIT.',
            obj:'SELECT k.naam, COUNT(b.bestelling_id) AS totaal FROM klant k JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY totaal DESC LIMIT 1',
            win:'VIP-klant gevonden! Dit is goud voor de marketingafdeling. 👑' },
      en: { title:'Customer with most orders', who:'Marketing',
            story:'Find the name of the customer who has placed the <strong>most orders</strong>. Use a subquery or GROUP BY + LIMIT.',
            obj:'SELECT k.naam, COUNT(b.bestelling_id) AS totaal FROM klant k JOIN bestelling b ON k.klant_id = b.klant_id GROUP BY k.klant_id, k.naam ORDER BY totaal DESC LIMIT 1',
            win:'VIP customer found! This is gold for the marketing department. 👑' },
    },
    delete_test_klant: {
      nl: { title:'Testklant verwijderen', who:'Developer',
            story:'Bij de opstart werd een testklant (klant_id=99) aangemaakt. Verwijder die rij.',
            obj:'DELETE FROM klant WHERE klant_id = 99',
            win:'Testdata opgeruimd! De database is nu schoon. 🧹' },
      en: { title:'Delete test customer', who:'Developer',
            story:'During setup a test customer (klant_id=99) was created. Delete that row.',
            obj:'DELETE FROM klant WHERE klant_id = 99',
            win:'Test data cleaned up! The database is now clean. 🧹' },
    },
    join_klant_review: {
      nl: { title:'Klanten met hun reviews', who:'Analytics',
            story:'Welke klanten hebben reviews geschreven? Gebruik een JOIN om namen en reviewscores samen te tonen.',
            obj:'SELECT k.naam, r.score, r.tekst FROM klant k INNER JOIN review r ON k.klant_id = r.klant_id ORDER BY r.score DESC',
            win:'Review-overzicht per klant klaar! Analysts zijn blij. 📋' },
      en: { title:'Customers with their reviews', who:'Analytics',
            story:'Which customers have written reviews? Use a JOIN to show names and review scores together.',
            obj:'SELECT k.naam, r.score, r.tekst FROM klant k INNER JOIN review r ON k.klant_id = r.klant_id ORDER BY r.score DESC',
            win:'Review overview per customer ready! Analysts are happy. 📋' },
    },
    debug_missing_groupby: {
      nl: { title:'🐛 Debug: GROUP BY vergeten', who:'Lena — Developer',
            story:'Lena heeft een query geschreven om de <strong>totale stock per categorie</strong> te berekenen, maar krijgt een fout. Kun jij de bug vinden en repareren?',
            obj:'Herstel de query zodat de stock per categorie gegroepeerd wordt.',
            win:'Bug gevonden! Zonder GROUP BY kan SUM() niet per categorie berekenen. 🐛→✅' },
      en: { title:'🐛 Debug: GROUP BY forgotten', who:'Lena — Developer',
            story:'Lena wrote a query to calculate the <strong>total stock per category</strong> but gets an error. Can you find and fix the bug?',
            obj:'Fix the query so that stock is grouped per category.',
            win:'Bug found! Without GROUP BY, SUM() cannot calculate per category. 🐛→✅' },
    },
    debug_update_no_where: {
      nl: { title:'🐛 Debug: UPDATE zonder WHERE', who:'Alex — Developer',
            story:'Alex stuurde deze UPDATE naar productie en heeft <strong>per ongeluk alle prijzen op €99 gezet</strong>. Repareer de query zodat ze enkel de Ergonomische stoel (product_id=4) aanpast.',
            obj:'Voeg een WHERE-clausule toe zodat enkel product_id = 4 bijgewerkt wordt.',
            win:'Bug gerepareerd! WHERE is verplicht bij UPDATE. Zonder WHERE worden ALLE rijen aangepast. 🛡️' },
      en: { title:'🐛 Debug: UPDATE without WHERE', who:'Alex — Developer',
            story:'Alex sent this UPDATE to production and <strong>accidentally set all prices to €99</strong>. Fix the query so it only updates the Ergonomic Chair (product_id=4).',
            obj:'Add a WHERE clause so that only product_id = 4 is updated.',
            win:'Bug fixed! WHERE is required with UPDATE. Without WHERE ALL rows are updated. 🛡️' },
    },
    debug_having_no_groupby: {
      nl: { title:'🐛 Debug: HAVING zonder GROUP BY', who:'Junior Developer',
            story:'Deze query zou klanten moeten tonen met meer dan 1 bestelling, maar gooit een fout. Repareer hem.',
            obj:'Voeg GROUP BY toe zodat HAVING correct werkt.',
            win:'Bug gevonden! HAVING werkt altijd samen met GROUP BY — zo kun je groepen filteren na aggregatie. 🎯' },
      en: { title:'🐛 Debug: HAVING without GROUP BY', who:'Junior Developer',
            story:'This query should show customers with more than 1 order but throws an error. Fix it.',
            obj:'Add GROUP BY so that HAVING works correctly.',
            win:'Bug found! HAVING always works together with GROUP BY — that\'s how you filter groups after aggregation. 🎯' },
    },
    debug_join_no_on: {
      nl: { title:'🐛 Debug: JOIN zonder ON', who:'Junior Developer',
            story:'Deze JOIN-query mist de verbindingsconditie en geeft een verkeerd resultaat (kruis-product). Repareer hem.',
            obj:'Voeg de ON-clausule toe om klant en bestelling correct te koppelen.',
            win:'Bug gevonden! Zonder ON-conditie krijg je een Cartesisch product — elke rij gecombineerd met elke rij. 🔗' },
      en: { title:'🐛 Debug: JOIN without ON', who:'Junior Developer',
            story:'This JOIN query is missing the join condition and gives a wrong result (cross product). Fix it.',
            obj:'Add the ON clause to correctly link klant and bestelling.',
            win:'Bug found! Without an ON condition you get a Cartesian product — every row combined with every row. 🔗' },
    },
  },

  // ══ CHAPTERS ════════════════════════════════════════════════════
  chapters: {
    0: {
      nl: { title:'🏠 H1: De Startup', cinTitle:'De Startup 🚀', cinCh:'HOOFDSTUK 1',
            lines:[
              { txt:'Gefeliciteerd, <strong>CEO</strong>! Je hebt €50.000 opgehaald. DataShop gaat live. Maar je klantendatabank is een puinhoop.', who:'Thomas — Adviseur' },
              { txt:'Eerste klanten wachten. Elke fout kost <strong>reputatiepunten</strong>.', who:'System' },
              { txt:'Oké. Ik pak dit aan.', who:'CEO — jij' },
            ],
            recap:'Je beheerst nu de basis van SQL: gegevens opvragen, invoegen, bijwerken en verwijderen.',
            nextPreview:'Volgende stap: crisismanagement met UPDATE en DELETE.' },
      en: { title:'🏠 Ch1: The Startup', cinTitle:'The Startup 🚀', cinCh:'CHAPTER 1',
            lines:[
              { txt:'Congratulations, <strong>CEO</strong>! You\'ve raised €50,000. DataShop is going live. But your customer database is a mess.', who:'Thomas — Advisor' },
              { txt:'First customers are waiting. Every mistake costs <strong>reputation points</strong>.', who:'System' },
              { txt:'OK. I\'ll handle this.', who:'CEO — you' },
            ],
            recap:'You now master the basics of SQL: querying, inserting, updating and deleting data.',
            nextPreview:'Next up: crisis management with UPDATE and DELETE.' },
    },
    1: {
      nl: { title:'⚡ H2: Crisis Mode', cinTitle:'Crisis Mode 🚨', cinCh:'HOOFDSTUK 2',
            lines:[
              { txt:'CEO, we hebben een crisis! Een kortingscode van 99% staat actief. <strong>Social media ontploft!</strong>', who:'Ines — PR Manager' },
              { txt:'Reviews over defecte USB-C Hub komen binnen. Webcam al weken uitverkocht.', who:'Klantenservice' },
              { txt:'Ik regel het. Geef me database-toegang.', who:'CEO — jij' },
            ],
            recap:'Je hebt geleerd hoe je crises oplost met SQL: data aanpassen, corrigeren en verwijderen.',
            nextPreview:'Volgende stap: tabellen samenvoegen met JOIN en geavanceerde aggregaten.' },
      en: { title:'⚡ Ch2: Crisis Mode', cinTitle:'Crisis Mode 🚨', cinCh:'CHAPTER 2',
            lines:[
              { txt:'CEO, we have a crisis! A 99% discount code is active. <strong>Social media is exploding!</strong>', who:'Ines — PR Manager' },
              { txt:'Reviews about the defective USB-C Hub are coming in. Webcam out of stock for weeks.', who:'Customer Service' },
              { txt:'I\'ll sort it. Give me database access.', who:'CEO — you' },
            ],
            recap:'You\'ve learned how to resolve crises with SQL: updating, correcting and deleting data.',
            nextPreview:'Next up: joining tables with JOIN and advanced aggregates.' },
    },
    2: {
      nl: { title:'🔗 H3: Data Expert', cinTitle:'Data Expert 🧠', cinCh:'HOOFDSTUK 3',
            lines:[
              { txt:'Investeerders willen rapporten. Welke klanten bestellen het meest? Beste categorieën?', who:'Alex — Data Analyst' },
              { txt:'We willen de database uitbreiden met nieuwe tabellen.', who:'Raad van Bestuur' },
              { txt:'Laat me de queries schrijven.', who:'CEO — jij' },
            ],
            recap:'Je bent nu een data expert: JOINs, aggregaten en DDL behoren tot je toolkit.',
            nextPreview:'Volgende stap: geavanceerde queries met DISTINCT, aliassen en subqueries.' },
      en: { title:'🔗 Ch3: Data Expert', cinTitle:'Data Expert 🧠', cinCh:'CHAPTER 3',
            lines:[
              { txt:'Investors want reports. Which customers order the most? Best categories?', who:'Alex — Data Analyst' },
              { txt:'We want to expand the database with new tables.', who:'Board of Directors' },
              { txt:'Let me write the queries.', who:'CEO — you' },
            ],
            recap:'You are now a data expert: JOINs, aggregates and DDL are all in your toolkit.',
            nextPreview:'Next up: advanced queries with DISTINCT, aliases and subqueries.' },
    },
    3: {
      nl: { title:'🧬 H4: Expert Modus', cinTitle:'Expert Modus 🧬', cinCh:'HOOFDSTUK 4',
            lines:[
              { txt:'Proficiat CEO! Je beheerst de basis volledig. Tijd voor <strong>gevorderde SQL</strong>: DISTINCT, aliassen, subqueries.', who:'AI Systeem' },
              { txt:'We overwegen €500.000 te investeren. We willen rapporten die onze analistensoftware niet aankan. Imponeer ons.', who:'Venture Capitalist' },
              { txt:'Ik schrijf queries die jullie nooit eerder gezien hebben.', who:'CEO — jij' },
            ],
            recap:'Expert-niveau: DISTINCT, aliassen, subqueries en complexe JOIN-combinaties.',
            nextPreview:'Volgende stap: enterprise SQL met INNER/LEFT JOIN, HAVING en DDL.' },
      en: { title:'🧬 Ch4: Expert Mode', cinTitle:'Expert Mode 🧬', cinCh:'CHAPTER 4',
            lines:[
              { txt:'Congratulations CEO! You\'ve fully mastered the basics. Time for <strong>advanced SQL</strong>: DISTINCT, aliases, subqueries.', who:'AI System' },
              { txt:'We\'re considering investing €500,000. We want reports that our analyst software can\'t handle. Impress us.', who:'Venture Capitalist' },
              { txt:'I\'ll write queries you\'ve never seen before.', who:'CEO — you' },
            ],
            recap:'Expert level: DISTINCT, aliases, subqueries and complex JOIN combinations.',
            nextPreview:'Next up: enterprise SQL with INNER/LEFT JOIN, HAVING and DDL.' },
    },
    4: {
      nl: { title:'🏗️ H5: Data Architect', cinTitle:'Data Architect 🏗️', cinCh:'HOOFDSTUK 5',
            lines:[
              { txt:'DataShop expandeert internationaal. We hebben <strong>professionele JOINs, gegroepeerde rapporten en een strakke database-architectuur</strong> nodig.', who:'Boardroom' },
              { txt:'We schakelen over naar ANSI-standaard JOIN-syntax. Schrijf queries die echte databases aankunnen: INNER JOIN, LEFT JOIN, GROUP BY met HAVING, en DDL voor nieuwe structuren.', who:'Lena — Lead Engineer' },
              { txt:'Ik bouw de databank die DataShop naar de beurs brengt.', who:'CEO — jij' },
            ],
            recap:'Je bent nu een volwaardige Data Architect. DataShop is klaar voor de beursgang.',
            nextPreview:'' },
      en: { title:'🏗️ Ch5: Data Architect', cinTitle:'Data Architect 🏗️', cinCh:'CHAPTER 5',
            lines:[
              { txt:'DataShop is expanding internationally. We need <strong>professional JOINs, grouped reports and a solid database architecture</strong>.', who:'Boardroom' },
              { txt:'We\'re switching to ANSI standard JOIN syntax. Write queries that real databases can handle: INNER JOIN, LEFT JOIN, GROUP BY with HAVING, and DDL for new structures.', who:'Lena — Lead Engineer' },
              { txt:'I\'ll build the database that takes DataShop to the stock exchange.', who:'CEO — you' },
            ],
            recap:'You are now a fully-fledged Data Architect. DataShop is ready for its IPO.',
            nextPreview:'' },
    },
  },

  // ══ ACHIEVEMENTS ════════════════════════════════════════════════
  achievements: {
    first_insert:     { nl:{ name:'Eerste INSERT',      desc:'Je eerste rij toegevoegd.' },                  en:{ name:'First INSERT',        desc:'Your first row added.' } },
    first_update:     { nl:{ name:'Data Wijziger',      desc:'Je eerste UPDATE uitgevoerd.' },               en:{ name:'Data Changer',        desc:'Your first UPDATE executed.' } },
    first_delete:     { nl:{ name:'Opruimer',           desc:'Je eerste DELETE uitgevoerd.' },               en:{ name:'Clean-up Crew',       desc:'Your first DELETE executed.' } },
    first_select:     { nl:{ name:'Data Analist',       desc:'Je eerste SELECT uitgevoerd.' },               en:{ name:'Data Analyst',        desc:'Your first SELECT executed.' } },
    ddl_master:       { nl:{ name:'Architect',          desc:'Tabel aangemaakt of gewijzigd.' },             en:{ name:'Architect',           desc:'Table created or modified.' } },
    speed:            { nl:{ name:'Snelheidsdemon',     desc:'Scenario opgelost in < 10 seconden.' },        en:{ name:'Speed Demon',         desc:'Scenario solved in < 10 seconds.' } },
    streak3:          { nl:{ name:'In Vuur en Vlam',    desc:'3 op rij correct.' },                          en:{ name:'On Fire',             desc:'3 in a row correct.' } },
    streak5:          { nl:{ name:'Vulkaan',            desc:'5 op rij correct.' },                          en:{ name:'Volcano',             desc:'5 in a row correct.' } },
    gdpr:             { nl:{ name:'GDPR-held',          desc:'Klant correct gedeactiveerd.' },               en:{ name:'GDPR Hero',           desc:'Customer correctly deactivated.' } },
    join:             { nl:{ name:'JOIN Meester',       desc:'JOIN-query geslaagd.' },                       en:{ name:'JOIN Master',         desc:'JOIN query succeeded.' } },
    agg:              { nl:{ name:'Aggregatie Expert',  desc:'AVG, SUM, MAX of MIN gebruikt.' },             en:{ name:'Aggregation Expert',  desc:'AVG, SUM, MAX or MIN used.' } },
    security:         { nl:{ name:'Beveiligingschef',   desc:'Foute kortingscode gedeactiveerd.' },          en:{ name:'Security Chief',      desc:'Faulty discount code deactivated.' } },
    ch1:              { nl:{ name:'Startup CEO',        desc:'Hoofdstuk 1 voltooid.' },                      en:{ name:'Startup CEO',         desc:'Chapter 1 completed.' } },
    ch2:              { nl:{ name:'Crisis Manager',     desc:'Hoofdstuk 2 voltooid.' },                      en:{ name:'Crisis Manager',      desc:'Chapter 2 completed.' } },
    ch3:              { nl:{ name:'Data Expert',        desc:'Hoofdstuk 3 voltooid.' },                      en:{ name:'Data Expert',         desc:'Chapter 3 completed.' } },
    rep100:           { nl:{ name:'Perfecte CEO',       desc:'Reputatie op 100 gehouden.' },                 en:{ name:'Perfect CEO',         desc:'Reputation kept at 100.' } },
    xp500:            { nl:{ name:'500 XP Elite',       desc:'500 XP bereikt.' },                            en:{ name:'500 XP Elite',        desc:'500 XP reached.' } },
    ch4:              { nl:{ name:'Expert Modus',       desc:'Hoofdstuk 4 voltooid.' },                      en:{ name:'Expert Mode',         desc:'Chapter 4 completed.' } },
    distinct_pro:     { nl:{ name:'DISTINCT Pro',       desc:'DISTINCT query geslaagd.' },                   en:{ name:'DISTINCT Pro',        desc:'DISTINCT query succeeded.' } },
    subquery_pro:     { nl:{ name:'Subquery Tovenaar',  desc:'Subquery in WHERE geslaagd.' },                en:{ name:'Subquery Wizard',     desc:'Subquery in WHERE succeeded.' } },
    alias_pro:        { nl:{ name:'Alias Artiest',      desc:'AS-alias query geslaagd.' },                   en:{ name:'Alias Artist',        desc:'AS alias query succeeded.' } },
    all_done:         { nl:{ name:'Data Legende',       desc:'Alle missies voltooid!' },                     en:{ name:'Data Legend',         desc:'All missions completed!' } },
    ch5:              { nl:{ name:'Data Architect',     desc:'Hoofdstuk 5 voltooid.' },                      en:{ name:'Data Architect',      desc:'Chapter 5 completed.' } },
    inner_join_pro:   { nl:{ name:'JOIN Meester',       desc:'INNER JOIN met ON-syntax geslaagd.' },         en:{ name:'JOIN Master',         desc:'INNER JOIN with ON syntax succeeded.' } },
    left_join_pro:    { nl:{ name:'LEFT JOIN Expert',   desc:'LEFT JOIN met nulls geslaagd.' },              en:{ name:'LEFT JOIN Expert',    desc:'LEFT JOIN with nulls succeeded.' } },
    having_pro:       { nl:{ name:'HAVING Tovenaar',    desc:'GROUP BY + HAVING gecombineerd.' },            en:{ name:'HAVING Wizard',       desc:'GROUP BY + HAVING combined.' } },
    ddl_architect:    { nl:{ name:'Database Architect', desc:'CREATE TABLE én ALTER TABLE uitgevoerd.' },    en:{ name:'Database Architect',  desc:'CREATE TABLE and ALTER TABLE executed.' } },
    xp1000:           { nl:{ name:'1000 XP Legende',   desc:'1000 XP bereikt.' },                           en:{ name:'1000 XP Legend',      desc:'1000 XP reached.' } },
    tut_complete:     { nl:{ name:'Tutorial Meester',   desc:'Alle tutoriallessen voltooid.' },              en:{ name:'Tutorial Master',     desc:'All tutorial lessons completed.' } },
    sql_polyglot:     { nl:{ name:'SQL Polyglot',       desc:'SELECT, INSERT, UPDATE en DELETE gebruikt in missies.' }, en:{ name:'SQL Polyglot', desc:'SELECT, INSERT, UPDATE and DELETE used in missions.' } },
    no_hint_ch1:      { nl:{ name:'Geen hints nodig',   desc:'Hoofdstuk 1 voltooid zonder één hint te gebruiken.' }, en:{ name:'No hints needed', desc:'Chapter 1 completed without using a single hint.' } },
    speedster:        { nl:{ name:'Snelheidsduivel',    desc:'Een missie met 25+ snelheidsbonus voltooid.' }, en:{ name:'Speed Freak',        desc:'A mission completed with 25+ speed bonus.' } },
    rep_recovered:    { nl:{ name:'Comeback',           desc:'Reputatie hersteld van onder 50% naar boven 80%.' }, en:{ name:'Comeback',         desc:'Reputation recovered from below 50% to above 80%.' } },
    like_pro:         { nl:{ name:'Patroonzoeker',      desc:'LIKE-query met wildcard geslaagd.' },          en:{ name:'Pattern Finder',      desc:'LIKE query with wildcard succeeded.' } },
    between_pro:      { nl:{ name:'Bereikfilter',       desc:'BETWEEN-query geslaagd.' },                   en:{ name:'Range Filter',        desc:'BETWEEN query succeeded.' } },
    null_hunter:      { nl:{ name:'NULL Hunter',        desc:'IS NULL query geslaagd.' },                   en:{ name:'NULL Hunter',         desc:'IS NULL query succeeded.' } },
    anti_join_pro:    { nl:{ name:'Anti-Join Expert',   desc:'LEFT JOIN + IS NULL anti-join geslaagd.' },    en:{ name:'Anti-Join Expert',    desc:'LEFT JOIN + IS NULL anti-join succeeded.' } },
    not_in_pro:       { nl:{ name:'NOT IN Specialist',  desc:'NOT IN subquery geslaagd.' },                 en:{ name:'NOT IN Specialist',   desc:'NOT IN subquery succeeded.' } },
    case_when_pro:    { nl:{ name:'Label Artiest',      desc:'CASE WHEN query geslaagd.' },                  en:{ name:'Label Artist',        desc:'CASE WHEN query succeeded.' } },
  },

  // ══ OFFICES ══════════════════════════════════════════════════════
  offices: {
    0:    { nl:{ name:'Thuiskantoor',         desc:'Vanuit je slaapkamer. De droom is groot.' },                          en:{ name:'Home Office',           desc:'From your bedroom. The dream is big.' } },
    150:  { nl:{ name:'Gehuurd Kantoor',      desc:'Een echt kantoor in de stad.' },                                      en:{ name:'Rented Office',         desc:'A real office in the city.' } },
    350:  { nl:{ name:'DataShop HQ',          desc:'10 medewerkers, investeerders kijken toe.' },                         en:{ name:'DataShop HQ',           desc:'10 employees, investors are watching.' } },
    650:  { nl:{ name:'Glazen Wolkenkrabber', desc:'30e verdieping, je bent een succesverhaal.' },                        en:{ name:'Glass Skyscraper',      desc:'30th floor, you are a success story.' } },
    1000: { nl:{ name:'Global DataShop',      desc:'Internationaal bedrijf. Forbes schrijft over jou.' },                 en:{ name:'Global DataShop',       desc:'International company. Forbes writes about you.' } },
    1500: { nl:{ name:'DataShop Universe',    desc:'Jij bent de standaard. Harvard doceert over jou.' },                 en:{ name:'DataShop Universe',     desc:'You are the standard. Harvard lectures about you.' } },
  },

  // ══ RANKS ═══════════════════════════════════════════════════════
  ranks: {
    0:    { nl:'Startup CEO',                 en:'Startup CEO' },
    150:  { nl:'Junior Data Analist',         en:'Junior Data Analyst' },
    350:  { nl:'SQL Specialist',              en:'SQL Specialist' },
    650:  { nl:'Senior Data Engineer',        en:'Senior Data Engineer' },
    1000: { nl:'Chief Data Officer',          en:'Chief Data Officer' },
    1500: { nl:'Data Architect — Legende',    en:'Data Architect — Legend' },
  },

  // ══ CONCEPT INTROS ═══════════════════════════════════════════════
  concepts: {
    select: {
      nl:{ title:'SELECT — Gegevens opvragen',
           body:'Met <strong>SELECT</strong> haal je rijen op uit een tabel. De basisvorm is:<br><code>SELECT kolom1, kolom2 FROM tabel WHERE conditie</code><br>Gebruik <code>*</code> voor alle kolommen.',
           tip:'De volgorde is altijd: SELECT → FROM → WHERE → ORDER BY → LIMIT' },
      en:{ title:'SELECT — Querying data',
           body:'With <strong>SELECT</strong> you retrieve rows from a table. The basic form is:<br><code>SELECT column1, column2 FROM table WHERE condition</code><br>Use <code>*</code> for all columns.',
           tip:'The order is always: SELECT → FROM → WHERE → ORDER BY → LIMIT' },
    },
    insert: {
      nl:{ title:'INSERT — Nieuwe rij toevoegen',
           body:'Met <strong>INSERT INTO</strong> voeg je een nieuwe rij toe.<br><code>INSERT INTO tabel (kolom1, kolom2) VALUES (waarde1, waarde2)</code><br>Tekst staat altijd tussen enkele aanhalingstekens.',
           tip:'Vermeld de kolomnamen expliciet — dan hoef je de volgorde in de tabel niet te kennen.' },
      en:{ title:'INSERT — Adding a new row',
           body:'With <strong>INSERT INTO</strong> you add a new row.<br><code>INSERT INTO table (column1, column2) VALUES (value1, value2)</code><br>Text always goes between single quotes.',
           tip:'State the column names explicitly — then you don\'t need to know the order in the table.' },
    },
    update: {
      nl:{ title:'UPDATE — Bestaande rij wijzigen',
           body:'Met <strong>UPDATE … SET … WHERE</strong> pas je bestaande rijen aan.<br><code>UPDATE tabel SET kolom = nieuwewaarde WHERE conditie</code>',
           tip:'⚠️ Altijd WHERE gebruiken! Zonder WHERE pas je ALLE rijen tegelijk aan.' },
      en:{ title:'UPDATE — Modifying an existing row',
           body:'With <strong>UPDATE … SET … WHERE</strong> you modify existing rows.<br><code>UPDATE table SET column = newvalue WHERE condition</code>',
           tip:'⚠️ Always use WHERE! Without WHERE you update ALL rows at once.' },
    },
    delete: {
      nl:{ title:'DELETE — Rij(en) verwijderen',
           body:'Met <strong>DELETE FROM … WHERE</strong> verwijder je rijen.<br><code>DELETE FROM tabel WHERE conditie</code>',
           tip:'⚠️ DELETE is onomkeerbaar. Overweeg UPDATE SET actief = 0 als alternatief.' },
      en:{ title:'DELETE — Removing row(s)',
           body:'With <strong>DELETE FROM … WHERE</strong> you remove rows.<br><code>DELETE FROM table WHERE condition</code>',
           tip:'⚠️ DELETE is irreversible. Consider UPDATE SET actief = 0 as an alternative.' },
    },
    ddl: {
      nl:{ title:'DDL — Database structuur aanpassen',
           body:'DDL-commando\'s (Data Definition Language) wijzigen de <em>structuur</em> van de database.<br><code>CREATE TABLE naam (kolom datatype, ...)</code><br><code>ALTER TABLE naam ADD COLUMN kolom datatype</code>',
           tip:'Bestaande rijen krijgen automatisch NULL voor een nieuwe kolom via ALTER TABLE.' },
      en:{ title:'DDL — Modifying database structure',
           body:'DDL commands (Data Definition Language) change the <em>structure</em> of the database.<br><code>CREATE TABLE name (column datatype, ...)</code><br><code>ALTER TABLE name ADD COLUMN column datatype</code>',
           tip:'Existing rows automatically get NULL for a new column via ALTER TABLE.' },
    },
    like: {
      nl:{ title:'LIKE — Zoeken op patroon',
           body:'Met <strong>LIKE</strong> filter je op een tekstpatroon.<br><code>WHERE naam LIKE \'%Jan%\'</code> — bevat "Jan"<br><code>WHERE naam LIKE \'J%\'</code> — begint met J',
           tip:'% staat voor nul of meer willekeurige tekens. _ staat voor precies één teken.' },
      en:{ title:'LIKE — Searching by pattern',
           body:'With <strong>LIKE</strong> you filter by a text pattern.<br><code>WHERE naam LIKE \'%Jan%\'</code> — contains "Jan"<br><code>WHERE naam LIKE \'J%\'</code> — starts with J',
           tip:'% represents zero or more characters. _ represents exactly one character.' },
    },
    between: {
      nl:{ title:'BETWEEN — Bereikfilter',
           body:'Met <strong>BETWEEN a AND b</strong> filter je op een bereik — inclusief de grenzen zelf.<br><code>WHERE prijs BETWEEN 10 AND 50</code>',
           tip:'BETWEEN a AND b is gelijk aan: WHERE kolom >= a AND kolom <= b' },
      en:{ title:'BETWEEN — Range filter',
           body:'With <strong>BETWEEN a AND b</strong> you filter by a range — including the boundaries.<br><code>WHERE prijs BETWEEN 10 AND 50</code>',
           tip:'BETWEEN a AND b is equivalent to: WHERE column >= a AND column <= b' },
    },
    isnull: {
      nl:{ title:'IS NULL — Ontbrekende waarden',
           body:'NULL is de <em>afwezigheid</em> van een waarde. Je kan er NIET op vergelijken met =.<br><code>WHERE kolom IS NULL</code> — geen waarde ingevuld<br>❌ <code>WHERE kolom = NULL</code> werkt nooit!',
           tip:'Anti-join: LEFT JOIN + WHERE rechtertabel.id IS NULL → vindt rijen die NIET in de rechtertabel staan.' },
      en:{ title:'IS NULL — Missing values',
           body:'NULL is the <em>absence</em> of a value. You CANNOT compare it with =.<br><code>WHERE column IS NULL</code> — no value filled in<br>❌ <code>WHERE column = NULL</code> never works!',
           tip:'Anti-join: LEFT JOIN + WHERE righttable.id IS NULL → finds rows NOT in the right table.' },
    },
    casewhen: {
      nl:{ title:'CASE WHEN — Conditionele labels',
           body:'Met <strong>CASE WHEN</strong> maak je een nieuwe kolom op basis van condities.<br><code>CASE WHEN stock = 0 THEN \'Uitverkocht\' WHEN stock &lt; 5 THEN \'Bijna op\' ELSE \'Op voorraad\' END AS status</code>',
           tip:'Sluit altijd af met END. Geef de kolom een naam via AS.' },
      en:{ title:'CASE WHEN — Conditional labels',
           body:'With <strong>CASE WHEN</strong> you create a new column based on conditions.<br><code>CASE WHEN stock = 0 THEN \'Out of stock\' WHEN stock &lt; 5 THEN \'Low\' ELSE \'In stock\' END AS status</code>',
           tip:'Always end with END. Give the column a name via AS.' },
    },
  },
};

// ── NARRATIVE ACCESSOR ────────────────────────────────────────────
// n('new_customer', 'title')   → scenario title in current lang
// n('new_customer', 'story')   → scenario story in current lang
// nCh(0, 'title')              → chapter title in current lang
// nAch('first_insert', 'name') → achievement name in current lang
// nRank(350)                   → rank title in current lang
// nOffice(350, 'name')         → office name in current lang
// nConcept('select', 'body')   → concept body in current lang

function n(id, field) {
  const entry = NARRATIVE.scenarios[id];
  if (!entry) return '';
  const lang = (LANG === 'en' && entry.en) ? 'en' : 'nl';
  return entry[lang]?.[field] ?? entry.nl?.[field] ?? '';
}

function nCh(id, field) {
  const entry = NARRATIVE.chapters[id];
  if (!entry) return '';
  const lang = (LANG === 'en' && entry.en) ? 'en' : 'nl';
  return entry[lang]?.[field] ?? entry.nl?.[field] ?? '';
}

function nAch(id, field) {
  const entry = NARRATIVE.achievements[id];
  if (!entry) return '';
  const lang = (LANG === 'en' && entry.en) ? 'en' : 'nl';
  return entry[lang]?.[field] ?? entry.nl?.[field] ?? '';
}

function nRank(min) {
  const entry = NARRATIVE.ranks[min];
  if (!entry) return '';
  return (LANG === 'en' ? entry.en : entry.nl) ?? entry.nl ?? '';
}

function nOffice(min, field) {
  const entry = NARRATIVE.offices[min];
  if (!entry) return '';
  const lang = (LANG === 'en' && entry.en) ? 'en' : 'nl';
  return entry[lang]?.[field] ?? entry.nl?.[field] ?? '';
}

function nConcept(type, field) {
  const entry = NARRATIVE.concepts[type];
  if (!entry) return '';
  const lang = (LANG === 'en' && entry.en) ? 'en' : 'nl';
  return entry[lang]?.[field] ?? entry.nl?.[field] ?? '';
}

// ── TUTORIAL MODULE CONTENT ───────────────────────────────────────
NARRATIVE.tut = {
  select_basics: {
    nl: { title: 'SELECT — Gegevens opvragen' },
    en: { title: 'SELECT — Querying Data' },
    lessons: [
      {
        nl: {
          title: 'Je eerste SELECT',
          intro: 'SQL staat voor <strong>Structured Query Language</strong>. Met <strong>SELECT</strong> haal je gegevens op uit een tabel — net als een zoekopdracht in de database.<br><br>Elke SQL-query begint met twee verplichte onderdelen: <code>SELECT</code> zegt <em>welke kolommen</em> je wilt zien, en <code>FROM</code> zegt <em>uit welke tabel</em>. De volgorde is altijd: SELECT eerst, dan FROM.<br><br>💡 <strong>Tip:</strong> Met <code>SELECT *</code> haal je alle kolommen op. Wil je alleen specifieke kolommen, dan schrijf je ze op, gescheiden door komma\'s.',
          concept: { title: 'De basisstructuur', text: 'SELECT kolommen FROM tabel;\n\nMet SELECT kies je welke kolommen je wilt zien. Met FROM zeg je uit welke tabel.' },
          examples: [
            { label: 'Alle klanten (alle kolommen)', code: 'SELECT *\nFROM klant', result: 'Geeft alle rijen + kolommen van de klant-tabel' },
            { label: 'Alleen naam en stad', code: 'SELECT naam, stad\nFROM klant', result: 'Enkel de kolommen naam en stad' },
          ],
          exercise: { task: 'Haal de naam en email op van alle klanten.', hint: 'Gebruik: SELECT naam, email FROM klant' },
        },
        en: {
          title: 'Your first SELECT',
          intro: 'SQL stands for <strong>Structured Query Language</strong>. With <strong>SELECT</strong> you retrieve data from a table — like a search query in the database.<br><br>Every SQL query starts with two required parts: <code>SELECT</code> says <em>which columns</em> you want to see, and <code>FROM</code> says <em>from which table</em>. The order is always: SELECT first, then FROM.<br><br>💡 <strong>Tip:</strong> With <code>SELECT *</code> you retrieve all columns. For specific columns, list them separated by commas.',
          concept: { title: 'The basic structure', text: 'SELECT columns FROM table;\n\nSELECT chooses which columns you want. FROM specifies the table.' },
          examples: [
            { label: 'All customers (all columns)', code: 'SELECT *\nFROM klant', result: 'Returns all rows + columns from the customer table' },
            { label: 'Only name and city', code: 'SELECT naam, stad\nFROM klant', result: 'Only the naam and stad columns' },
          ],
          exercise: { task: 'Retrieve the name and email of all customers.', hint: 'Use: SELECT naam, email FROM klant' },
        },
      },
      {
        nl: {
          title: 'WHERE — Filteren',
          intro: 'Met <strong>WHERE</strong> filter je de resultaten. Zo zie je enkel de rijen die aan een bepaalde voorwaarde voldoen.<br><br>Zonder WHERE geeft SQL <em>alle</em> rijen terug. Met WHERE zeg je: "geef me alleen rijen waarbij kolom X gelijk is aan waarde Y". Je kan vergelijken met <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, of tekst zoeken met <code>LIKE</code>.<br><br>💡 <strong>Tip:</strong> Meerdere voorwaarden combineer je met <code>AND</code> (beide moeten kloppen) of <code>OR</code> (één volstaat).',
          concept: { title: 'Filteroperatoren', text: '= (gelijk)   !=  (niet gelijk)\n> (groter)   <   (kleiner)\n>= (groter of gelijk)   <= (kleiner of gelijk)\nLIKE \'%tekst%\'  (bevat tekst)' },
          examples: [
            { label: 'Klanten uit Gent', code: "SELECT naam, stad\nFROM klant\nWHERE stad = 'Gent'", result: 'Alleen klanten met stad = Gent' },
            { label: 'Producten onder €30', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs < 30', result: 'Alle producten goedkoper dan €30' },
          ],
          exercise: { task: 'Zoek alle producten met een prijs hoger dan €50.', hint: 'SELECT naam, prijs FROM product WHERE prijs > 50' },
        },
        en: {
          title: 'WHERE — Filtering',
          intro: 'With <strong>WHERE</strong> you filter the results. You only see the rows that meet a certain condition.<br><br>Without WHERE SQL returns <em>all</em> rows. With WHERE you say: "give me only rows where column X equals value Y". You can compare with <code>=</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, or search text with <code>LIKE</code>.<br><br>💡 <strong>Tip:</strong> Combine multiple conditions with <code>AND</code> (both must match) or <code>OR</code> (one is enough).',
          concept: { title: 'Filter operators', text: '= (equal)   !=  (not equal)\n> (greater)   <   (less)\n>= (greater or equal)   <= (less or equal)\nLIKE \'%text%\'  (contains text)' },
          examples: [
            { label: 'Customers from Gent', code: "SELECT naam, stad\nFROM klant\nWHERE stad = 'Gent'", result: 'Only customers with stad = Gent' },
            { label: 'Products under €30', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs < 30', result: 'All products cheaper than €30' },
          ],
          exercise: { task: 'Find all products with a price higher than €50.', hint: 'SELECT naam, prijs FROM product WHERE prijs > 50' },
        },
      },
      {
        nl: {
          title: 'ORDER BY & LIMIT',
          intro: 'Met <strong>ORDER BY</strong> sorteer je de resultaten op een kolom. Met <strong>LIMIT</strong> beperk je het aantal teruggegeven rijen.<br><br>Standaard sorteert ORDER BY van laag naar hoog (ASC). Voeg <code>DESC</code> toe voor hoog naar laag. LIMIT is handig als je alleen de top-N resultaten wil zien — denk aan "de 5 duurste producten" of "de 3 nieuwste bestellingen".<br><br>💡 <strong>Tip:</strong> ORDER BY en LIMIT staan altijd op het einde van de query, ná WHERE en GROUP BY.',
          concept: { title: 'Sorteren en beperken', text: 'ORDER BY kolom ASC   -- laag → hoog (standaard)\nORDER BY kolom DESC  -- hoog → laag\nLIMIT n              -- enkel de eerste n rijen' },
          examples: [
            { label: 'Duurste producten eerst', code: 'SELECT naam, prijs\nFROM product\nORDER BY prijs DESC', result: 'Producten van duur naar goedkoop' },
            { label: 'Top 3 duurste producten', code: 'SELECT naam, prijs\nFROM product\nORDER BY prijs DESC\nLIMIT 3', result: 'Alleen de 3 duurste producten' },
          ],
          exercise: { task: 'Toon de 5 goedkoopste producten (naam en prijs).', hint: 'SELECT naam, prijs FROM product ORDER BY prijs ASC LIMIT 5' },
        },
        en: {
          title: 'ORDER BY & LIMIT',
          intro: 'With <strong>ORDER BY</strong> you sort results by a column. With <strong>LIMIT</strong> you restrict the number of rows returned.<br><br>By default ORDER BY sorts low to high (ASC). Add <code>DESC</code> for high to low. LIMIT is useful when you only want the top-N results — e.g. "the 5 most expensive products" or "the 3 latest orders".<br><br>💡 <strong>Tip:</strong> ORDER BY and LIMIT always go at the end of the query, after WHERE and GROUP BY.',
          concept: { title: 'Sorting and limiting', text: 'ORDER BY column ASC   -- low → high (default)\nORDER BY column DESC  -- high → low\nLIMIT n              -- only the first n rows' },
          examples: [
            { label: 'Most expensive products first', code: 'SELECT naam, prijs\nFROM product\nORDER BY prijs DESC', result: 'Products from expensive to cheap' },
            { label: 'Top 3 most expensive products', code: 'SELECT naam, prijs\nFROM product\nORDER BY prijs DESC\nLIMIT 3', result: 'Only the 3 most expensive products' },
          ],
          exercise: { task: 'Show the 5 cheapest products (name and price).', hint: 'SELECT naam, prijs FROM product ORDER BY prijs ASC LIMIT 5' },
        },
      },
    ],
  },

  insert_update_delete: {
    nl: { title: 'INSERT, UPDATE & DELETE' },
    en: { title: 'INSERT, UPDATE & DELETE' },
    lessons: [
      {
        nl: {
          title: 'INSERT — Nieuwe rij toevoegen',
          intro: 'Met <strong>INSERT INTO</strong> voeg je nieuwe gegevens toe aan een tabel. Je specificeert welke kolommen je invult en welke waarden je invoegt.<br><br>De kolomnamen en de waarden moeten in <em>dezelfde volgorde</em> staan. Tekst staat altijd tussen enkele aanhalingstekens <code>\'zo\'</code>. Getallen schrijf je zonder aanhalingstekens.<br><br>💡 <strong>Tip:</strong> Kolommen die je weglaat krijgen hun standaardwaarde (of NULL). Kolommen die verplicht zijn (NOT NULL) moet je altijd invullen.',
          concept: { title: 'INSERT INTO ... VALUES', text: 'INSERT INTO tabel (kolom1, kolom2)\nVALUES (waarde1, waarde2);\n\nLetop: tekst staat tussen enkelvoudige aanhalingstekens.' },
          examples: [
            { label: 'Nieuw product toevoegen', code: "INSERT INTO product (naam, prijs, stock, categorie)\nVALUES ('Laptop Stand', 34.99, 15, 'Accessoires')", result: 'Voegt een nieuw product toe aan de database' },
            { label: 'Nieuwe klant registreren', code: "INSERT INTO klant (naam, email, stad, actief)\nVALUES ('Lien Claes', 'lien@mail.be', 'Gent', 1)", result: 'Lien Claes wordt toegevoegd als actieve klant' },
          ],
          exercise: { task: "Voeg een product 'Webcam Pro' toe met prijs 89.99, stock 10, categorie 'Elektronica'.", hint: "INSERT INTO product (naam, prijs, stock, categorie) VALUES ('Webcam Pro', 89.99, 10, 'Elektronica')" },
        },
        en: {
          title: 'INSERT — Adding a new row',
          intro: 'With <strong>INSERT INTO</strong> you add new data to a table. You specify which columns to fill and which values to insert.<br><br>The column names and values must be in the <em>same order</em>. Text always goes between single quotes <code>\'like this\'</code>. Numbers are written without quotes.<br><br>💡 <strong>Tip:</strong> Columns you omit get their default value (or NULL). Columns that are required (NOT NULL) must always be filled in.',
          concept: { title: 'INSERT INTO ... VALUES', text: 'INSERT INTO table (column1, column2)\nVALUES (value1, value2);\n\nNote: text goes between single quotes.' },
          examples: [
            { label: 'Add a new product', code: "INSERT INTO product (naam, prijs, stock, categorie)\nVALUES ('Laptop Stand', 34.99, 15, 'Accessoires')", result: 'Adds a new product to the database' },
            { label: 'Register a new customer', code: "INSERT INTO klant (naam, email, stad, actief)\nVALUES ('Lien Claes', 'lien@mail.be', 'Gent', 1)", result: 'Lien Claes is added as an active customer' },
          ],
          exercise: { task: "Add a product 'Webcam Pro' with price 89.99, stock 10, category 'Elektronica'.", hint: "INSERT INTO product (naam, prijs, stock, categorie) VALUES ('Webcam Pro', 89.99, 10, 'Elektronica')" },
        },
      },
      {
        nl: {
          title: 'UPDATE — Gegevens wijzigen',
          intro: '<strong>UPDATE</strong> past bestaande rijen aan. <span class="u-err-text">Gebruik ALTIJD WHERE</span> — anders pas je elke rij in de tabel aan!<br><br>De structuur is: <code>UPDATE tabel SET kolom = nieuwewaarde WHERE voorwaarde</code>. Je kan meerdere kolommen tegelijk aanpassen door ze te scheiden met komma\'s: <code>SET naam = \'Nieuw\', prijs = 9.99</code>.<br><br>⚠️ <strong>Gevaar:</strong> <code>UPDATE product SET prijs = 0</code> zonder WHERE zet alle prijzen naar nul. Test eerst met SELECT + dezelfde WHERE om te controleren welke rijen je aanpast.',
          concept: { title: 'UPDATE ... SET ... WHERE', text: 'UPDATE tabel\nSET kolom = nieuwewaarde\nWHERE voorwaarde;\n\n⚠️ Zonder WHERE: ALLE rijen worden aangepast!' },
          examples: [
            { label: 'Prijs aanpassen', code: 'UPDATE product\nSET prijs = 44.99\nWHERE product_id = 2', result: 'Enkel product 2 krijgt de nieuwe prijs' },
            { label: 'Meerdere kolommen', code: "UPDATE bestelling\nSET status = 'geleverd'\nWHERE bestelling_id = 4", result: 'Status van bestelling 4 wordt geleverd' },
          ],
          exercise: { task: 'Zet de stock van product_id 3 op 50.', hint: 'UPDATE product SET stock = 50 WHERE product_id = 3' },
          warn: '⚠️ Vergeet WHERE nooit bij UPDATE! UPDATE product SET prijs = 0 (zonder WHERE) zet alle prijzen op nul!',
        },
        en: {
          title: 'UPDATE — Modifying data',
          intro: '<strong>UPDATE</strong> modifies existing rows. <span class="u-err-text">ALWAYS use WHERE</span> — otherwise you update every row in the table!<br><br>The structure is: <code>UPDATE table SET column = newvalue WHERE condition</code>. Update multiple columns at once by separating them with commas: <code>SET naam = \'New\', prijs = 9.99</code>.<br><br>⚠️ <strong>Danger:</strong> <code>UPDATE product SET prijs = 0</code> without WHERE sets all prices to zero. Test with SELECT + the same WHERE first to check which rows you are modifying.',
          concept: { title: 'UPDATE ... SET ... WHERE', text: 'UPDATE table\nSET column = newvalue\nWHERE condition;\n\n⚠️ Without WHERE: ALL rows are updated!' },
          examples: [
            { label: 'Update price', code: 'UPDATE product\nSET prijs = 44.99\nWHERE product_id = 2', result: 'Only product 2 gets the new price' },
            { label: 'Multiple columns', code: "UPDATE bestelling\nSET status = 'geleverd'\nWHERE bestelling_id = 4", result: "Order 4's status becomes 'geleverd'" },
          ],
          exercise: { task: 'Set the stock of product_id 3 to 50.', hint: 'UPDATE product SET stock = 50 WHERE product_id = 3' },
          warn: '⚠️ Never forget WHERE with UPDATE! UPDATE product SET prijs = 0 (without WHERE) sets all prices to zero!',
        },
      },
      {
        nl: {
          title: 'DELETE — Rijen verwijderen',
          intro: '<strong>DELETE FROM</strong> verwijdert rijen uit een tabel. Net als UPDATE: <span class="u-err-text">altijd WHERE gebruiken</span>, anders verwijder je alles!<br><br>DELETE is <em>onomkeerbaar</em> — eenmaal uitgevoerd, zijn de gegevens weg. In productiedatabases werk je daarom altijd met een backup of transactie vooraleer je iets verwijdert.<br><br>💡 <strong>GDPR-tip:</strong> Voor klantgegevens is het vaak veiliger om te "deactiveren" (<code>UPDATE SET actief = 0</code>) dan echt te verwijderen. Zo bewaar je historiek en voldoe je toch aan privacywetgeving.',
          concept: { title: 'DELETE FROM ... WHERE', text: 'DELETE FROM tabel\nWHERE voorwaarde;\n\n⚠️ DELETE FROM tabel (zonder WHERE) verwijdert ALLE rijen!' },
          examples: [
            { label: 'Review verwijderen', code: 'DELETE FROM review\nWHERE review_id = 3', result: 'Enkel review 3 wordt verwijderd' },
            { label: 'GDPR-tip: deactiveer i.p.v. deleten', code: 'UPDATE klant\nSET actief = 0\nWHERE klant_id = 4', result: 'Veiliger: klant blijft in systeem maar is inactief' },
          ],
          exercise: { task: 'Verwijder alle reviews met een score lager dan 2.', hint: 'DELETE FROM review WHERE score < 2' },
          warn: '⚠️ DELETE is onomkeerbaar! Overweeg UPDATE SET actief = 0 als alternatief voor klantgegevens (GDPR).',
        },
        en: {
          title: 'DELETE — Removing rows',
          intro: '<strong>DELETE FROM</strong> removes rows from a table. Like UPDATE: <span class="u-err-text">always use WHERE</span>, otherwise you delete everything!<br><br>DELETE is <em>irreversible</em> — once executed, the data is gone. In production databases always use a backup or transaction before deleting anything.<br><br>💡 <strong>GDPR tip:</strong> For customer data it is often safer to "deactivate" (<code>UPDATE SET actief = 0</code>) than to truly delete. That way you keep history while complying with privacy law.',
          concept: { title: 'DELETE FROM ... WHERE', text: 'DELETE FROM table\nWHERE condition;\n\n⚠️ DELETE FROM table (without WHERE) deletes ALL rows!' },
          examples: [
            { label: 'Delete a review', code: 'DELETE FROM review\nWHERE review_id = 3', result: 'Only review 3 is deleted' },
            { label: 'GDPR tip: deactivate instead of delete', code: 'UPDATE klant\nSET actief = 0\nWHERE klant_id = 4', result: 'Safer: customer stays in system but is inactive' },
          ],
          exercise: { task: 'Delete all reviews with a score lower than 2.', hint: 'DELETE FROM review WHERE score < 2' },
          warn: '⚠️ DELETE is irreversible! Consider UPDATE SET actief = 0 as an alternative for customer data (GDPR).',
        },
      },
    ],
  },

  aggregaten: {
    nl: { title: 'Aggregatiefuncties' },
    en: { title: 'Aggregate Functions' },
    lessons: [
      {
        nl: {
          title: 'COUNT, SUM, AVG',
          intro: '<strong>Aggregatiefuncties</strong> berekenen iets over meerdere rijen tegelijk — totalen, gemiddeldes, aantallen. Ze zijn essentieel voor rapporten en analyses.<br><br>In plaats van individuele rijen terug te geven, <em>vat</em> een aggregatiefunctie alle rijen samen tot één waarde. <code>COUNT(*)</code> telt rijen, <code>SUM(kolom)</code> telt op, <code>AVG(kolom)</code> berekent het gemiddelde, <code>MAX</code> en <code>MIN</code> geven de grootste/kleinste waarde.<br><br>💡 <strong>Tip:</strong> Aggregatiefuncties negeren NULL-waarden (behalve COUNT(*)). <code>COUNT(*)</code> telt alle rijen inclusief NULL; <code>COUNT(kolom)</code> telt alleen rijen mét een waarde.',
          concept: { title: 'De vijf aggregatiefuncties', text: 'COUNT(*) — aantal rijen\nSUM(kolom) — optelling\nAVG(kolom) — gemiddelde\nMAX(kolom) — grootste waarde\nMIN(kolom) — kleinste waarde' },
          examples: [
            { label: 'Hoeveel klanten?', code: 'SELECT COUNT(*)\nFROM klant', result: 'Geeft het totale aantal klanten terug' },
            { label: 'Gemiddelde prijs', code: 'SELECT AVG(prijs)\nFROM product', result: 'De gemiddelde verkoopprijs van alle producten' },
          ],
          exercise: { task: 'Bereken de totale stock van alle producten samen (SUM).', hint: 'SELECT SUM(stock) FROM product' },
        },
        en: {
          title: 'COUNT, SUM, AVG',
          intro: '<strong>Aggregate functions</strong> calculate something over multiple rows at once — totals, averages, counts. They are essential for reports and analyses.<br><br>Instead of returning individual rows, an aggregate function <em>summarises</em> all rows into a single value. <code>COUNT(*)</code> counts rows, <code>SUM(column)</code> adds up, <code>AVG(column)</code> calculates the average, <code>MAX</code> and <code>MIN</code> return the largest/smallest value.<br><br>💡 <strong>Tip:</strong> Aggregate functions ignore NULL values (except COUNT(*)). <code>COUNT(*)</code> counts all rows including NULL; <code>COUNT(column)</code> only counts rows with a value.',
          concept: { title: 'The five aggregate functions', text: 'COUNT(*) — number of rows\nSUM(column) — sum\nAVG(column) — average\nMAX(column) — largest value\nMIN(column) — smallest value' },
          examples: [
            { label: 'How many customers?', code: 'SELECT COUNT(*)\nFROM klant', result: 'Returns the total number of customers' },
            { label: 'Average price', code: 'SELECT AVG(prijs)\nFROM product', result: 'The average selling price of all products' },
          ],
          exercise: { task: 'Calculate the total stock of all products combined (SUM).', hint: 'SELECT SUM(stock) FROM product' },
        },
      },
      {
        nl: {
          title: 'GROUP BY',
          intro: '<strong>GROUP BY</strong> groepeert rijen op basis van een kolom, zodat je aggregatiefuncties per groep kunt berekenen — bijv. hoeveel bestellingen per status.<br><br>Zonder GROUP BY geeft een aggregatiefunctie één getal over de hele tabel. <em>Met</em> GROUP BY krijg je een getal per unieke waarde in de groepeerkolom. Stel je voor: tabel met 100 bestellingen → <code>GROUP BY status</code> maakt groepjes per status, en COUNT(*) telt per groepje.<br><br>💡 <strong>Regel:</strong> Elke kolom in SELECT die geen aggregatiefunctie is, moet ook in GROUP BY staan.',
          concept: { title: 'GROUP BY — aggregeren per groep', text: 'SELECT kolom, COUNT(*)\nFROM tabel\nGROUP BY kolom;\n\nElke unieke waarde in de GROUP BY-kolom wordt één resultaatrij.' },
          examples: [
            { label: 'Producten per categorie', code: 'SELECT categorie, COUNT(*)\nFROM product\nGROUP BY categorie', result: 'Eén rij per categorie met het aantal producten' },
            { label: 'Totale stock per categorie', code: 'SELECT categorie, SUM(stock)\nFROM product\nGROUP BY categorie', result: 'Totale voorraad per productcategorie' },
          ],
          exercise: { task: 'Toon het aantal bestellingen per status.', hint: 'SELECT status, COUNT(*) FROM bestelling GROUP BY status' },
        },
        en: {
          title: 'GROUP BY',
          intro: '<strong>GROUP BY</strong> groups rows based on a column, so you can calculate aggregate functions per group — e.g. how many orders per status.<br><br>Without GROUP BY an aggregate function returns one number for the whole table. <em>With</em> GROUP BY you get one number per unique value in the grouping column. Imagine: table with 100 orders → <code>GROUP BY status</code> creates groups per status, and COUNT(*) counts per group.<br><br>💡 <strong>Rule:</strong> Every column in SELECT that is not an aggregate function must also be in GROUP BY.',
          concept: { title: 'GROUP BY — aggregate per group', text: 'SELECT column, COUNT(*)\nFROM table\nGROUP BY column;\n\nEach unique value in the GROUP BY column becomes one result row.' },
          examples: [
            { label: 'Products per category', code: 'SELECT categorie, COUNT(*)\nFROM product\nGROUP BY categorie', result: 'One row per category with the product count' },
            { label: 'Total stock per category', code: 'SELECT categorie, SUM(stock)\nFROM product\nGROUP BY categorie', result: 'Total inventory per product category' },
          ],
          exercise: { task: 'Show the number of orders per status.', hint: 'SELECT status, COUNT(*) FROM bestelling GROUP BY status' },
        },
      },
      {
        nl: {
          title: 'HAVING',
          intro: '<strong>HAVING</strong> filtert na GROUP BY — het is de WHERE voor groepen. Gebruik HAVING wanneer je op een aggregaatwaarde wilt filteren.<br><br>Het verschil is het <em>moment</em> van filteren: WHERE filtert individuele rijen vóórdat ze gegroepeerd worden. HAVING filtert de gevormde groepen ná de groepering. Je kan dus niet schrijven <code>WHERE COUNT(*) > 5</code> — dat moet <code>HAVING COUNT(*) > 5</code> zijn.<br><br>💡 <strong>Volgorde:</strong> <code>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT</code>',
          concept: { title: 'WHERE vs HAVING', text: 'WHERE  → filtert individuele rijen VÓÓR groepering\nHAVING → filtert groepen NÁ groepering\n\nHAVING COUNT(*) > 2 : enkel groepen met meer dan 2 rijen' },
          examples: [
            { label: 'Klanten met >1 bestelling', code: 'SELECT klant_id, COUNT(*)\nFROM bestelling\nGROUP BY klant_id\nHAVING COUNT(*) > 1', result: 'Enkel klanten die meer dan één keer bestelden' },
            { label: 'Categorieën met hoge gemiddelde prijs', code: 'SELECT categorie, AVG(prijs)\nFROM product\nGROUP BY categorie\nHAVING AVG(prijs) > 30', result: 'Enkel categorieën waarvan de gemiddelde prijs > €30' },
          ],
          exercise: { task: 'Toon categorieën met meer dan 2 producten.', hint: 'SELECT categorie, COUNT(*) FROM product GROUP BY categorie HAVING COUNT(*) > 2' },
        },
        en: {
          title: 'HAVING',
          intro: '<strong>HAVING</strong> filters after GROUP BY — it is the WHERE for groups. Use HAVING when you want to filter on an aggregate value.<br><br>The difference is the <em>moment</em> of filtering: WHERE filters individual rows before they are grouped. HAVING filters the formed groups after grouping. So you cannot write <code>WHERE COUNT(*) > 5</code> — it must be <code>HAVING COUNT(*) > 5</code>.<br><br>💡 <strong>Order:</strong> <code>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT</code>',
          concept: { title: 'WHERE vs HAVING', text: 'WHERE  → filters individual rows BEFORE grouping\nHAVING → filters groups AFTER grouping\n\nHAVING COUNT(*) > 2 : only groups with more than 2 rows' },
          examples: [
            { label: 'Customers with >1 order', code: 'SELECT klant_id, COUNT(*)\nFROM bestelling\nGROUP BY klant_id\nHAVING COUNT(*) > 1', result: 'Only customers who ordered more than once' },
            { label: 'Categories with high average price', code: 'SELECT categorie, AVG(prijs)\nFROM product\nGROUP BY categorie\nHAVING AVG(prijs) > 30', result: 'Only categories with average price > €30' },
          ],
          exercise: { task: 'Show categories with more than 2 products.', hint: 'SELECT categorie, COUNT(*) FROM product GROUP BY categorie HAVING COUNT(*) > 2' },
        },
      },
    ],
  },

  joins: {
    nl: { title: 'JOINs — Tabellen koppelen' },
    en: { title: 'JOINs — Linking Tables' },
    lessons: [
      {
        nl: {
          title: 'Waarom JOINs?',
          intro: 'Een goede database <strong>splitst gegevens over meerdere tabellen</strong> — klanten, producten, bestellingen apart. Met een <strong>JOIN</strong> combineer je die tabellen in één query.<br><br>Stel je voor: een bestellingtabel heeft een klant_id maar niet de naam van de klant. Die naam staat in de klanttabel. Met JOIN combineer je die twee: je zegt aan SQL "haal de rij op in klanttabel waarvan het klant_id overeenkomt met het klant_id in de bestellingtabel".<br><br>💡 <strong>Terminologie:</strong> Primary Key (PK) = het unieke ID van een rij in een tabel. Foreign Key (FK) = een kolom die verwijst naar de PK van een andere tabel.',
          concept: { title: 'Primaire en vreemde sleutels', text: 'PK (Primary Key) = uniek ID per rij (bv. klant_id)\nFK (Foreign Key) = verwijzing naar PK van andere tabel\n\nbestelling.klant_id → klant.klant_id\nbestelling.product_id → product.product_id' },
          examples: [
            { label: 'Impliciete JOIN (oud stijl)', code: 'SELECT k.naam, b.datum\nFROM klant k, bestelling b\nWHERE k.klant_id = b.klant_id', result: 'Klantnamen met hun besteldatum' },
            { label: 'INNER JOIN (ANSI standaard)', code: 'SELECT k.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Hetzelfde resultaat, modernere syntax' },
          ],
          exercise: { task: 'Haal klantnaam en besteldatum op via een INNER JOIN.', hint: 'SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id' },
        },
        en: {
          title: 'Why JOINs?',
          intro: 'A good database <strong>splits data across multiple tables</strong> — customers, products, orders separately. With a <strong>JOIN</strong> you combine those tables in one query.<br><br>Imagine: an orders table has a klant_id but not the customer name. That name is in the customer table. With JOIN you combine the two: you tell SQL "get the row in the customer table whose klant_id matches the klant_id in the orders table".<br><br>💡 <strong>Terminology:</strong> Primary Key (PK) = the unique ID of a row in a table. Foreign Key (FK) = a column that refers to the PK of another table.',
          concept: { title: 'Primary and foreign keys', text: 'PK (Primary Key) = unique ID per row (e.g. klant_id)\nFK (Foreign Key) = reference to PK of another table\n\nbestelling.klant_id → klant.klant_id\nbestelling.product_id → product.product_id' },
          examples: [
            { label: 'Implicit JOIN (old style)', code: 'SELECT k.naam, b.datum\nFROM klant k, bestelling b\nWHERE k.klant_id = b.klant_id', result: 'Customer names with their order date' },
            { label: 'INNER JOIN (ANSI standard)', code: 'SELECT k.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Same result, more modern syntax' },
          ],
          exercise: { task: 'Retrieve customer name and order date via an INNER JOIN.', hint: 'SELECT klant.naam, bestelling.datum FROM klant INNER JOIN bestelling ON klant.klant_id = bestelling.klant_id' },
        },
      },
      {
        nl: {
          title: 'INNER JOIN vs LEFT JOIN',
          intro: '<strong>INNER JOIN</strong> geeft alleen rijen die in beide tabellen een overeenkomst hebben. <strong>LEFT JOIN</strong> geeft alle rijen uit de linker tabel, ook als er geen overeenkomst is in de rechter tabel.<br><br>Denk aan twee cirkels (Venn-diagram): INNER JOIN geeft het <em>snijpunt</em> — alleen wat in beide tabellen matcht. LEFT JOIN geeft de <em>volledige linker cirkel</em> — alle rijen links, met rechts NULL als er geen match is.<br><br>💡 <strong>Wanneer welke?</strong> INNER JOIN voor verplichte relaties (een bestelling heeft altijd een klant). LEFT JOIN als de relatie optioneel is (een klant heeft misschien geen bestelling).',
          concept: { title: 'JOIN-types vergelijken', text: 'INNER JOIN → snijpunt (alleen matches)\nLEFT JOIN  → alle links, rechts NULL bij geen match\nRIGHT JOIN → alle rechts, links NULL bij geen match' },
          examples: [
            { label: 'INNER JOIN: alleen klanten die besteld hebben', code: 'SELECT k.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Klanten zonder bestelling verschijnen NIET' },
            { label: 'LEFT JOIN: alle klanten, ook zonder bestelling', code: 'SELECT k.naam, b.datum\nFROM klant k\nLEFT JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Klanten zonder bestelling krijgen datum = NULL' },
          ],
          exercise: { task: 'Gebruik LEFT JOIN om alle klanten te zien, ook wie nog nooit bestelde.', hint: 'SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id' },
        },
        en: {
          title: 'INNER JOIN vs LEFT JOIN',
          intro: '<strong>INNER JOIN</strong> only returns rows that have a match in both tables. <strong>LEFT JOIN</strong> returns all rows from the left table, even when there is no match in the right table.<br><br>Think of two circles (Venn diagram): INNER JOIN gives the <em>intersection</em> — only what matches in both tables. LEFT JOIN gives the <em>full left circle</em> — all rows on the left, with NULL on the right if there is no match.<br><br>💡 <strong>When to use which?</strong> INNER JOIN for mandatory relationships (an order always has a customer). LEFT JOIN when the relationship is optional (a customer may have no orders).',
          concept: { title: 'Comparing JOIN types', text: 'INNER JOIN → intersection (only matches)\nLEFT JOIN  → all left, right NULL when no match\nRIGHT JOIN → all right, left NULL when no match' },
          examples: [
            { label: 'INNER JOIN: only customers who ordered', code: 'SELECT k.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Customers without an order do NOT appear' },
            { label: 'LEFT JOIN: all customers, even without orders', code: 'SELECT k.naam, b.datum\nFROM klant k\nLEFT JOIN bestelling b\n  ON k.klant_id = b.klant_id', result: 'Customers without an order get datum = NULL' },
          ],
          exercise: { task: 'Use LEFT JOIN to see all customers, including those who never ordered.', hint: 'SELECT klant.naam, bestelling.datum FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id' },
        },
      },
      {
        nl: {
          title: 'Drie tabellen joinen',
          intro: 'Je kunt meerdere JOINs <strong>ketenen</strong> om drie of meer tabellen samen te brengen. Elke JOIN koppelt één extra tabel aan het tussenresultaat.<br><br>Je bouwt stap voor stap: eerst combineer je tabel 1 + tabel 2, dan voeg je tabel 3 toe aan dat tussenresultaat. SQL voert dit intern van links naar rechts uit. Vergeet niet aliassen te gebruiken (<code>k</code>, <code>b</code>, <code>p</code>) — dat maakt lange queries veel leesbaarder.<br><br>💡 <strong>Tip:</strong> Schrijf altijd de ON-conditie direct na elke JOIN. Zo zie je meteen welke kolommen de tabellen koppelen.',
          concept: { title: 'Meerdere JOINs ketenen', text: 'FROM tabel1\nINNER JOIN tabel2 ON tabel1.fk = tabel2.pk\nINNER JOIN tabel3 ON tabel2.fk = tabel3.pk\n\nElke JOIN voegt één tabel toe aan het resultaat.' },
          examples: [
            { label: 'Klant + bestelling + product', code: 'SELECT k.naam, p.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id\nINNER JOIN product p\n  ON b.product_id = p.product_id', result: 'Wie heeft welk product op welke datum besteld' },
          ],
          exercise: { task: 'Combineer klant, bestelling en product: toon klantnaam, productnaam en datum.', hint: 'FROM klant INNER JOIN bestelling ON ... INNER JOIN product ON ...' },
        },
        en: {
          title: 'Joining three tables',
          intro: 'You can <strong>chain</strong> multiple JOINs to bring together three or more tables. Each JOIN attaches one extra table to the intermediate result.<br><br>You build step by step: first combine table 1 + table 2, then add table 3 to that intermediate result. SQL processes this internally from left to right. Remember to use aliases (<code>k</code>, <code>b</code>, <code>p</code>) — they make long queries much more readable.<br><br>💡 <strong>Tip:</strong> Always write the ON condition immediately after each JOIN. That way you can instantly see which columns link the tables.',
          concept: { title: 'Chaining multiple JOINs', text: 'FROM table1\nINNER JOIN table2 ON table1.fk = table2.pk\nINNER JOIN table3 ON table2.fk = table3.pk\n\nEach JOIN adds one table to the result.' },
          examples: [
            { label: 'Customer + order + product', code: 'SELECT k.naam, p.naam, b.datum\nFROM klant k\nINNER JOIN bestelling b\n  ON k.klant_id = b.klant_id\nINNER JOIN product p\n  ON b.product_id = p.product_id', result: 'Who ordered which product on which date' },
          ],
          exercise: { task: 'Combine customer, order and product: show customer name, product name and date.', hint: 'FROM klant INNER JOIN bestelling ON ... INNER JOIN product ON ...' },
        },
      },
    ],
  },

  advanced: {
    nl: { title: 'Gevorderde technieken' },
    en: { title: 'Advanced Techniques' },
    lessons: [
      {
        nl: {
          title: 'DISTINCT en aliassen (AS)',
          intro: '<strong>DISTINCT</strong> verwijdert duplicaten uit je resultaat. <strong>AS</strong> geeft een kolom of tabel een andere naam — handig voor leesbaarheid.<br><br>Zonder DISTINCT kan een kolom dezelfde waarde meerdere keren tonen (bv. "Gent" voor elke klant uit Gent). Met DISTINCT krijg je elke waarde maar één keer. AS (alias) hernoem je een kolom in het resultaat — ideaal als de echte kolomnaam technisch of onduidelijk is.<br><br>💡 <strong>Tip:</strong> Tabelaliassen (bv. <code>FROM klant AS k</code>) laten je schrijven <code>k.naam</code> i.p.v. <code>klant.naam</code>. Bij JOINs bijna onmisbaar.',
          concept: { title: 'DISTINCT en AS', text: 'SELECT DISTINCT kolom → unieke waarden\nSELECT kolom AS "Nieuwe Naam" → kolomalias\nFROM tabel AS t → tabelindexalias (afkorting)' },
          examples: [
            { label: 'Unieke steden', code: 'SELECT DISTINCT stad\nFROM klant', result: 'Elke stad slechts één keer in de lijst' },
            { label: 'Leesbare kolomnamen', code: 'SELECT naam AS product,\n       prijs AS verkoopprijs\nFROM product\nORDER BY verkoopprijs DESC', result: 'Kolommen heten nu "product" en "verkoopprijs"' },
          ],
          exercise: { task: 'Toon unieke categorieën uit de product-tabel.', hint: 'SELECT DISTINCT categorie FROM product' },
        },
        en: {
          title: 'DISTINCT and aliases (AS)',
          intro: '<strong>DISTINCT</strong> removes duplicates from your result. <strong>AS</strong> gives a column or table a different name — useful for readability.<br><br>Without DISTINCT a column can show the same value multiple times (e.g. "Gent" for every customer from Gent). With DISTINCT you get each value only once. AS (alias) renames a column in the result — ideal when the real column name is technical or unclear.<br><br>💡 <strong>Tip:</strong> Table aliases (e.g. <code>FROM klant AS k</code>) let you write <code>k.naam</code> instead of <code>klant.naam</code>. Almost indispensable with JOINs.',
          concept: { title: 'DISTINCT and AS', text: 'SELECT DISTINCT column → unique values\nSELECT column AS "New Name" → column alias\nFROM table AS t → table alias (abbreviation)' },
          examples: [
            { label: 'Unique cities', code: 'SELECT DISTINCT stad\nFROM klant', result: 'Each city only once in the list' },
            { label: 'Readable column names', code: 'SELECT naam AS product,\n       prijs AS verkoopprijs\nFROM product\nORDER BY verkoopprijs DESC', result: 'Columns are now named "product" and "verkoopprijs"' },
          ],
          exercise: { task: 'Show unique categories from the product table.', hint: 'SELECT DISTINCT categorie FROM product' },
        },
      },
      {
        nl: {
          title: 'Subqueries',
          intro: 'Een <strong>subquery</strong> is een query binnen een query — tussen haakjes. De binnenste query wordt eerst uitgevoerd, het resultaat wordt gebruikt in de buitenste query.<br><br>Je kan een subquery gebruiken in WHERE (<code>WHERE prijs &gt; (SELECT AVG...)</code>), in FROM als tijdelijke tabel, of in SELECT als berekende waarde. De database voert altijd <em>de binnenste query eerst</em> uit, dan pas de buitenste.<br><br>💡 <strong>Wanneer subquery vs JOIN?</strong> Een subquery is eenvoudiger te lezen bij eenvoudige vergelijkingen. Voor grote datasets zijn JOINs doorgaans sneller. Beide zijn correct.',
          concept: { title: 'Subquery in WHERE', text: 'SELECT naam FROM product\nWHERE prijs > (\n  SELECT AVG(prijs) FROM product\n);\n\nDe subquery berekent eerst het gemiddelde. Daarna filtert de buitenste query.' },
          examples: [
            { label: 'Producten boven gemiddelde prijs', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs > (\n  SELECT AVG(prijs) FROM product\n)', result: 'Enkel producten die duurder zijn dan het gemiddelde' },
            { label: 'Klanten die ooit besteld hebben', code: 'SELECT naam\nFROM klant\nWHERE klant_id IN (\n  SELECT klant_id FROM bestelling\n)', result: 'Klanten die minstens één bestelling hebben' },
          ],
          exercise: { task: 'Geef alle producten waarvan de stock hoger is dan de gemiddelde stock.', hint: 'WHERE stock > (SELECT AVG(stock) FROM product)' },
        },
        en: {
          title: 'Subqueries',
          intro: 'A <strong>subquery</strong> is a query within a query — between parentheses. The inner query is executed first, its result is used in the outer query.<br><br>You can use a subquery in WHERE (<code>WHERE prijs &gt; (SELECT AVG...)</code>), in FROM as a temporary table, or in SELECT as a calculated value. The database always executes <em>the inner query first</em>, then the outer one.<br><br>💡 <strong>Subquery vs JOIN?</strong> A subquery is simpler to read for simple comparisons. For large datasets JOINs are generally faster. Both are correct.',
          concept: { title: 'Subquery in WHERE', text: 'SELECT naam FROM product\nWHERE prijs > (\n  SELECT AVG(prijs) FROM product\n);\n\nThe subquery calculates the average first. Then the outer query filters.' },
          examples: [
            { label: 'Products above average price', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs > (\n  SELECT AVG(prijs) FROM product\n)', result: 'Only products more expensive than the average' },
            { label: 'Customers who ever ordered', code: 'SELECT naam\nFROM klant\nWHERE klant_id IN (\n  SELECT klant_id FROM bestelling\n)', result: 'Customers with at least one order' },
          ],
          exercise: { task: 'Return all products whose stock is higher than the average stock.', hint: 'WHERE stock > (SELECT AVG(stock) FROM product)' },
        },
      },
      {
        nl: {
          title: 'CREATE TABLE & ALTER TABLE',
          intro: '<strong>CREATE TABLE</strong> maakt een nieuwe tabel aan. <strong>ALTER TABLE</strong> voegt een kolom toe aan een bestaande tabel. Dit zijn DDL-commando\'s (Data Definition Language).',
          concept: { title: 'DDL — Database structuur aanpassen', text: 'CREATE TABLE naam (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  kolom VARCHAR(100) NOT NULL\n);\n\nALTER TABLE naam\nADD COLUMN extra VARCHAR(50);' },
          examples: [
            { label: 'Nieuwe tabel aanmaken', code: 'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  land VARCHAR(80)\n)', result: 'Een nieuwe tabel "leverancier" wordt aangemaakt' },
            { label: 'Kolom toevoegen', code: 'ALTER TABLE klant\nADD COLUMN telefoon VARCHAR(20)', result: 'Alle klanten krijgen een telefoon-veld (NULL)' },
          ],
          exercise: { task: 'Maak een tabel "categorie" aan met categorie_id (PK, AUTO_INCREMENT) en naam (VARCHAR(80), NOT NULL).', hint: 'CREATE TABLE categorie (categorie_id INT PRIMARY KEY AUTO_INCREMENT, naam VARCHAR(80) NOT NULL)' },
        },
        en: {
          title: 'CREATE TABLE & ALTER TABLE',
          intro: '<strong>CREATE TABLE</strong> creates a new table. <strong>ALTER TABLE</strong> adds a column to an existing table. These are DDL commands (Data Definition Language).',
          concept: { title: 'DDL — Modifying database structure', text: 'CREATE TABLE name (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  column VARCHAR(100) NOT NULL\n);\n\nALTER TABLE name\nADD COLUMN extra VARCHAR(50);' },
          examples: [
            { label: 'Create a new table', code: 'CREATE TABLE leverancier (\n  leverancier_id INT PRIMARY KEY AUTO_INCREMENT,\n  naam VARCHAR(100) NOT NULL,\n  land VARCHAR(80)\n)', result: 'A new table "leverancier" is created' },
            { label: 'Add a column', code: 'ALTER TABLE klant\nADD COLUMN telefoon VARCHAR(20)', result: 'All customers get a telefoon field (NULL)' },
          ],
          exercise: { task: 'Create a table "categorie" with categorie_id (PK, AUTO_INCREMENT) and naam (VARCHAR(80), NOT NULL).', hint: 'CREATE TABLE categorie (categorie_id INT PRIMARY KEY AUTO_INCREMENT, naam VARCHAR(80) NOT NULL)' },
        },
      },
    ],
  },

  null_case: {
    nl: { title: 'NULL-waarden & CASE WHEN' },
    en: { title: 'NULL Values & CASE WHEN' },
    lessons: [
      {
        nl: {
          title: 'NULL — de afwezigheid van data',
          intro: '<strong>NULL</strong> is geen nul, geen lege string — het is de <em>afwezigheid van een waarde</em>. NULL vergelijken met <code>= NULL</code> werkt nooit. Je moet altijd <strong>IS NULL</strong> of <strong>IS NOT NULL</strong> gebruiken.<br><br>Dit is één van de meest verwarrende onderdelen van SQL. De reden: NULL is onbekend, en onbekend = onbekend is... ook onbekend (niet true). Daarom heeft SQL speciale operatoren nodig: <code>IS NULL</code> en <code>IS NOT NULL</code>.<br><br>💡 <strong>Praktisch:</strong> NULL kan in elke kolom voorkomen tenzij de kolom NOT NULL is gedefinieerd. Controleer altijd of je data NULL-waarden kan bevatten voordat je filtert of berekent.',
          concept: { title: 'NULL correct gebruiken', text: 'WHERE kolom IS NULL        -- heeft geen waarde\nWHERE kolom IS NOT NULL   -- heeft wél een waarde\n\nLet op: WHERE kolom = NULL geeft altijd GEEN resultaten!' },
          examples: [
            { label: 'Klanten zonder stad', code: 'SELECT naam\nFROM klant\nWHERE stad IS NULL', result: 'Enkel klanten waarbij stad niet ingevuld is' },
            { label: 'Producten met stock ingevuld', code: 'SELECT naam, stock\nFROM product\nWHERE stock IS NOT NULL', result: 'Alle producten met een ingevuld stockgetal' },
          ],
          exercise: { task: 'Zoek klanten waarbij het emailadres IS NULL.', hint: 'SELECT naam FROM klant WHERE email IS NULL' },
        },
        en: {
          title: 'NULL — the absence of data',
          intro: '<strong>NULL</strong> is not zero, not an empty string — it is the <em>absence of a value</em>. Comparing NULL with <code>= NULL</code> never works. You must always use <strong>IS NULL</strong> or <strong>IS NOT NULL</strong>.<br><br>This is one of the most confusing parts of SQL. The reason: NULL is unknown, and unknown = unknown is... also unknown (not true). That is why SQL needs special operators: <code>IS NULL</code> and <code>IS NOT NULL</code>.<br><br>💡 <strong>Practical:</strong> NULL can appear in any column unless the column is defined NOT NULL. Always check whether your data can contain NULL values before filtering or calculating.',
          concept: { title: 'Using NULL correctly', text: 'WHERE kolom IS NULL        -- has no value\nWHERE kolom IS NOT NULL   -- has a value\n\nNote: WHERE kolom = NULL NEVER returns results!' },
          examples: [
            { label: 'Customers without a city', code: 'SELECT naam\nFROM klant\nWHERE stad IS NULL', result: 'Only customers where stad is not filled in' },
            { label: 'Products with stock filled in', code: 'SELECT naam, stock\nFROM product\nWHERE stock IS NOT NULL', result: 'All products with a stock number filled in' },
          ],
          exercise: { task: 'Find customers where the email address IS NULL.', hint: 'SELECT naam FROM klant WHERE email IS NULL' },
        },
      },
      {
        nl: {
          title: 'CASE WHEN — conditionele waarden',
          intro: '<strong>CASE WHEN</strong> werkt als een if/else binnen SQL. Je kan er een nieuwe kolom mee berekenen op basis van een conditie — ideaal voor labels, categorieën of tekstuele weergaven.<br><br>CASE WHEN controleert condities van boven naar beneden en stopt bij de eerste die klopt. Als geen enkele conditie klopt, geeft ELSE de standaardwaarde — zonder ELSE geeft SQL NULL terug. Je kan CASE WHEN gebruiken in SELECT, ORDER BY en zelfs in GROUP BY.<br><br>💡 <strong>Gebruik:</strong> Perfect om cijfers om te zetten naar leesbare tekst (0 → "Inactief"), of om data te categoriseren voor rapporten.',
          concept: { title: 'CASE WHEN structuur', text: "CASE\n  WHEN conditie1 THEN waarde1\n  WHEN conditie2 THEN waarde2\n  ELSE standaardwaarde\nEND AS kolomnaam" },
          examples: [
            { label: 'Stockstatus tonen', code: "SELECT naam,\n  CASE\n    WHEN stock = 0 THEN 'Uitverkocht'\n    WHEN stock < 5 THEN 'Bijna op'\n    ELSE 'Op voorraad'\n  END AS status\nFROM product", result: 'Elke product krijgt een leesbare statuslabel' },
            { label: 'Klant actief/inactief label', code: "SELECT naam,\n  CASE WHEN actief = 1 THEN 'Actief' ELSE 'Inactief' END AS status\nFROM klant", result: 'Toont een leesbaar label i.p.v. 0 of 1' },
          ],
          exercise: { task: "Schrijf een SELECT op product die naast naam en prijs een kolom 'prijsklasse' toont: 'Goedkoop' als prijs < 20, 'Gemiddeld' als prijs < 100, anders 'Duur'.", hint: "SELECT naam, prijs, CASE WHEN prijs < 20 THEN 'Goedkoop' WHEN prijs < 100 THEN 'Gemiddeld' ELSE 'Duur' END AS prijsklasse FROM product" },
        },
        en: {
          title: 'CASE WHEN — conditional values',
          intro: '<strong>CASE WHEN</strong> works like an if/else inside SQL. You can use it to calculate a new column based on a condition — ideal for labels, categories or textual displays.<br><br>CASE WHEN checks conditions from top to bottom and stops at the first one that matches. If no condition matches, ELSE provides the default value — without ELSE SQL returns NULL. You can use CASE WHEN in SELECT, ORDER BY and even GROUP BY.<br><br>💡 <strong>Usage:</strong> Perfect for converting numbers to readable text (0 → "Inactive"), or for categorising data for reports.',
          concept: { title: 'CASE WHEN structure', text: "CASE\n  WHEN condition1 THEN value1\n  WHEN condition2 THEN value2\n  ELSE defaultvalue\nEND AS columnname" },
          examples: [
            { label: 'Show stock status', code: "SELECT naam,\n  CASE\n    WHEN stock = 0 THEN 'Uitverkocht'\n    WHEN stock < 5 THEN 'Bijna op'\n    ELSE 'Op voorraad'\n  END AS status\nFROM product", result: 'Each product gets a readable status label' },
            { label: 'Customer active/inactive label', code: "SELECT naam,\n  CASE WHEN actief = 1 THEN 'Actief' ELSE 'Inactief' END AS status\nFROM klant", result: 'Shows a readable label instead of 0 or 1' },
          ],
          exercise: { task: "Write a SELECT on product that shows naam and prijs plus a column 'prijsklasse': 'Goedkoop' if prijs < 20, 'Gemiddeld' if prijs < 100, otherwise 'Duur'.", hint: "SELECT naam, prijs, CASE WHEN prijs < 20 THEN 'Goedkoop' WHEN prijs < 100 THEN 'Gemiddeld' ELSE 'Duur' END AS prijsklasse FROM product" },
        },
      },
    ],
  },

  filters_advanced: {
    nl: { title: 'Geavanceerde filters' },
    en: { title: 'Advanced Filters' },
    lessons: [
      {
        nl: {
          title: 'LIKE — Zoeken op patroon',
          intro: '<strong>LIKE</strong> laat je zoeken op een tekstpatroon. Gebruik <code>%</code> als wildcard voor nul of meer tekens, en <code>_</code> voor precies één teken. Perfect voor zoekvelden en e-mailfilters.<br><br><code>%</code> staat voor nul of meer willekeurige tekens: <code>LIKE \'%Jan%\'</code> vindt "Jan", "Januari", "DeJan", enz. <code>_</code> staat voor precies één teken: <code>LIKE \'_at\'</code> vindt "bat", "cat", "hat" maar niet "brat".<br><br>💡 <strong>Tip:</strong> LIKE is in MySQL niet hoofdlettergevoelig. Wil je exact matchen, gebruik dan <code>= \'waarde\'</code> in plaats van LIKE — dat is ook sneller.',
          concept: { title: 'LIKE wildcards', text: "WHERE naam LIKE '%Jan%'   -- bevat 'Jan'\nWHERE email LIKE '%@gmail%' -- Gmail-adressen\nWHERE naam LIKE 'A%'      -- begint met A\nWHERE naam LIKE '_an%'    -- tweede letter = a, n, ...\n\n💡 LIKE is case-insensitief in MySQL." },
          examples: [
            { label: 'Klanten met naam die begint met J', code: "SELECT naam, email\nFROM klant\nWHERE naam LIKE 'J%'", result: 'Jana Pieters, Jonas De Smedt, ...' },
            { label: 'Gmail-adressen vinden', code: "SELECT naam, email\nFROM klant\nWHERE email LIKE '%@gmail%'", result: 'Alle klanten met een gmail-adres' },
          ],
          exercise: { task: "Zoek alle producten waarvan de naam het woord 'USB' bevat.", hint: "SELECT naam FROM product WHERE naam LIKE '%USB%'" },
        },
        en: {
          title: 'LIKE — Pattern search',
          intro: '<strong>LIKE</strong> lets you search on a text pattern. Use <code>%</code> as wildcard for zero or more characters, and <code>_</code> for exactly one character. Perfect for search fields and email filters.<br><br><code>%</code> stands for zero or more arbitrary characters: <code>LIKE \'%Jan%\'</code> finds "Jan", "January", "DeJan", etc. <code>_</code> stands for exactly one character: <code>LIKE \'_at\'</code> finds "bat", "cat", "hat" but not "brat".<br><br>💡 <strong>Tip:</strong> LIKE is case-insensitive in MySQL. For exact matching, use <code>= \'value\'</code> instead of LIKE — it is also faster.',
          concept: { title: 'LIKE wildcards', text: "WHERE naam LIKE '%Jan%'   -- contains 'Jan'\nWHERE email LIKE '%@gmail%' -- Gmail addresses\nWHERE naam LIKE 'A%'      -- starts with A\nWHERE naam LIKE '_an%'    -- second letter = a, n, ...\n\n💡 LIKE is case-insensitive in MySQL." },
          examples: [
            { label: 'Customers with name starting with J', code: "SELECT naam, email\nFROM klant\nWHERE naam LIKE 'J%'", result: 'Jana Pieters, Jonas De Smedt, ...' },
            { label: 'Find Gmail addresses', code: "SELECT naam, email\nFROM klant\nWHERE email LIKE '%@gmail%'", result: 'All customers with a gmail address' },
          ],
          exercise: { task: "Find all products whose name contains the word 'USB'.", hint: "SELECT naam FROM product WHERE naam LIKE '%USB%'" },
        },
      },
      {
        nl: {
          title: 'BETWEEN — Bereikfilter',
          intro: '<strong>BETWEEN a AND b</strong> filtert rijen waarvan een waarde binnen een bereik valt — inclusief de grenzen zelf. Handig voor prijsranges, datums en stockniveaus.<br><br>BETWEEN is een kortere notatie voor <code>WHERE prijs &gt;= 10 AND prijs &lt;= 50</code>. Let op: BETWEEN is <em>inclusief</em> — zowel de onder- als bovengrens worden meegenomen.<br><br>💡 <strong>Tip voor datums:</strong> Gebruik de ISO-notatie <code>\'YYYY-MM-DD\'</code>: <code>WHERE datum BETWEEN \'2024-01-01\' AND \'2024-12-31\'</code>. Gebruik NOT BETWEEN om rijen buiten een bereik te vinden.',
          concept: { title: 'BETWEEN — inclusief bereik', text: 'WHERE prijs BETWEEN 10 AND 50\n-- is gelijk aan: WHERE prijs >= 10 AND prijs <= 50\n\nWerkt ook voor tekst (alfabetisch) en datums:\nWHERE datum BETWEEN \'2024-01-01\' AND \'2024-12-31\'' },
          examples: [
            { label: 'Producten tussen €20 en €80', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs BETWEEN 20 AND 80', result: 'Producten in het middensegment' },
            { label: 'Bestellingen in een periode', code: "SELECT *\nFROM bestelling\nWHERE datum BETWEEN '2024-11-01' AND '2024-12-31'", result: 'Bestellingen in de laatste twee maanden van 2024' },
          ],
          exercise: { task: 'Geef alle producten met een prijs tussen €10 en €50 (inclusief).', hint: 'SELECT naam, prijs FROM product WHERE prijs BETWEEN 10 AND 50' },
        },
        en: {
          title: 'BETWEEN — Range filter',
          intro: '<strong>BETWEEN a AND b</strong> filters rows whose value falls within a range — inclusive of the boundaries themselves. Useful for price ranges, dates and stock levels.<br><br>BETWEEN is shorthand for <code>WHERE prijs &gt;= 10 AND prijs &lt;= 50</code>. Note: BETWEEN is <em>inclusive</em> — both the lower and upper bound are included.<br><br>💡 <strong>Tip for dates:</strong> Use ISO notation <code>\'YYYY-MM-DD\'</code>: <code>WHERE datum BETWEEN \'2024-01-01\' AND \'2024-12-31\'</code>. Use NOT BETWEEN to find rows outside a range.',
          concept: { title: 'BETWEEN — inclusive range', text: 'WHERE prijs BETWEEN 10 AND 50\n-- equivalent to: WHERE prijs >= 10 AND prijs <= 50\n\nAlso works for text (alphabetically) and dates:\nWHERE datum BETWEEN \'2024-01-01\' AND \'2024-12-31\'' },
          examples: [
            { label: 'Products between €20 and €80', code: 'SELECT naam, prijs\nFROM product\nWHERE prijs BETWEEN 20 AND 80', result: 'Products in the mid-range segment' },
            { label: 'Orders within a period', code: "SELECT *\nFROM bestelling\nWHERE datum BETWEEN '2024-11-01' AND '2024-12-31'", result: 'Orders in the last two months of 2024' },
          ],
          exercise: { task: 'Return all products with a price between €10 and €50 (inclusive).', hint: 'SELECT naam, prijs FROM product WHERE prijs BETWEEN 10 AND 50' },
        },
      },
      {
        nl: {
          title: 'IS NULL — Ontbrekende data vinden',
          intro: 'Wanneer een cel geen waarde heeft, is die <strong>NULL</strong>. Je kan NOOIT vergelijken met <code>= NULL</code> — gebruik altijd <strong>IS NULL</strong> of <strong>IS NOT NULL</strong>. Dit is een van de meest gemaakte fouten in SQL!',
          concept: { title: 'NULL correct gebruiken', text: "WHERE kolom IS NULL        -- ontbreekt\nWHERE kolom IS NOT NULL   -- is ingevuld\n\n❌ WHERE kolom = NULL  -- werkt NOOIT!\n✅ WHERE kolom IS NULL  -- correct\n\nAnti-join patroon: LEFT JOIN + IS NULL\n→ vind records die in de andere tabel NIET voorkomen" },
          examples: [
            { label: 'Klanten zonder stad', code: 'SELECT naam\nFROM klant\nWHERE stad IS NULL', result: 'Klanten waarbij de stad niet ingevuld is' },
            { label: 'Anti-join: klanten die nooit bestelden', code: 'SELECT klant.naam\nFROM klant\nLEFT JOIN bestelling\n  ON klant.klant_id = bestelling.klant_id\nWHERE bestelling.klant_id IS NULL', result: 'Klanten zonder één bestelling — via LEFT JOIN + IS NULL' },
          ],
          exercise: { task: 'Vind alle klanten die nog nooit besteld hebben via LEFT JOIN + IS NULL.', hint: 'SELECT klant.naam FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE bestelling.klant_id IS NULL' },
        },
        en: {
          title: 'IS NULL — Finding missing data',
          intro: 'When a cell has no value, it is <strong>NULL</strong>. You can NEVER compare with <code>= NULL</code> — always use <strong>IS NULL</strong> or <strong>IS NOT NULL</strong>. This is one of the most common mistakes in SQL!',
          concept: { title: 'Using NULL correctly', text: "WHERE kolom IS NULL        -- missing\nWHERE kolom IS NOT NULL   -- filled in\n\n❌ WHERE kolom = NULL  -- NEVER works!\n✅ WHERE kolom IS NULL  -- correct\n\nAnti-join pattern: LEFT JOIN + IS NULL\n→ find records that do NOT exist in the other table" },
          examples: [
            { label: 'Customers without a city', code: 'SELECT naam\nFROM klant\nWHERE stad IS NULL', result: 'Customers where stad is not filled in' },
            { label: 'Anti-join: customers who never ordered', code: 'SELECT klant.naam\nFROM klant\nLEFT JOIN bestelling\n  ON klant.klant_id = bestelling.klant_id\nWHERE bestelling.klant_id IS NULL', result: 'Customers with no orders — via LEFT JOIN + IS NULL' },
          ],
          exercise: { task: 'Find all customers who have never ordered using LEFT JOIN + IS NULL.', hint: 'SELECT klant.naam FROM klant LEFT JOIN bestelling ON klant.klant_id = bestelling.klant_id WHERE bestelling.klant_id IS NULL' },
        },
      },
      {
        nl: {
          title: 'NOT IN — Uitsluiten via een lijst',
          intro: '<strong>NOT IN</strong> sluit rijen uit waarvan de waarde in een bepaalde lijst of subquery staat. Het is het omgekeerde van IN — ideaal om "alles behalve X" te selecteren.<br><br>Met <code>IN (\'Gent\', \'Brussel\')</code> filter je op specifieke waarden. <code>NOT IN</code> doet het tegenovergestelde. Je kan ook een subquery gebruiken: <code>NOT IN (SELECT klant_id FROM bestelling)</code> geeft alle klanten die nooit besteld hebben.<br><br>⚠️ <strong>Let op:</strong> Als de lijst of subquery een NULL-waarde bevat, geeft NOT IN nooit resultaten terug! Combineer dan met <code>IS NOT NULL</code> in de subquery.',
          concept: { title: 'IN vs NOT IN', text: "WHERE stad IN ('Gent','Brussel')      -- alleen deze steden\nWHERE stad NOT IN ('Gent','Brussel')  -- alles behalve deze\n\nMet subquery:\nWHERE klant_id NOT IN (SELECT klant_id FROM bestelling)\n→ klanten die nooit besteld hebben" },
          examples: [
            { label: 'Klanten niet uit Gent of Brussel', code: "SELECT naam, stad\nFROM klant\nWHERE stad NOT IN ('Gent', 'Brussel')", result: 'Alle klanten buiten Gent en Brussel' },
            { label: 'Producten zonder review', code: 'SELECT naam\nFROM product\nWHERE product_id NOT IN (\n  SELECT product_id FROM review\n)', result: 'Producten die nog nooit beoordeeld werden' },
          ],
          exercise: { task: "Toon producten die NIET in de categorie 'Elektronica' zitten via NOT IN.", hint: "SELECT naam, categorie FROM product WHERE categorie NOT IN ('Elektronica')" },
        },
        en: {
          title: 'NOT IN — Excluding via a list',
          intro: '<strong>NOT IN</strong> excludes rows whose value appears in a certain list or subquery. It is the opposite of IN — ideal for selecting "everything except X".<br><br>With <code>IN (\'Gent\', \'Brussel\')</code> you filter on specific values. <code>NOT IN</code> does the opposite. You can also use a subquery: <code>NOT IN (SELECT klant_id FROM bestelling)</code> returns all customers who never ordered.<br><br>⚠️ <strong>Note:</strong> If the list or subquery contains a NULL value, NOT IN never returns results! Combine with <code>IS NOT NULL</code> in the subquery.',
          concept: { title: 'IN vs NOT IN', text: "WHERE stad IN ('Gent','Brussel')      -- only these cities\nWHERE stad NOT IN ('Gent','Brussel')  -- everything except these\n\nWith subquery:\nWHERE klant_id NOT IN (SELECT klant_id FROM bestelling)\n→ customers who never ordered" },
          examples: [
            { label: 'Customers not from Gent or Brussel', code: "SELECT naam, stad\nFROM klant\nWHERE stad NOT IN ('Gent', 'Brussel')", result: 'All customers outside Gent and Brussel' },
            { label: 'Products without a review', code: 'SELECT naam\nFROM product\nWHERE product_id NOT IN (\n  SELECT product_id FROM review\n)', result: 'Products that have never been reviewed' },
          ],
          exercise: { task: "Show products that are NOT in the 'Elektronica' category using NOT IN.", hint: "SELECT naam, categorie FROM product WHERE categorie NOT IN ('Elektronica')" },
        },
      },
    ],
  },
};

// ── TUTORIAL ACCESSOR ──────────────────────────────────────────────
function nTut(modId, lesIdx, field, subField) {
  const mod = NARRATIVE.tut[modId];
  if (!mod) return '';
  // Module-level fields (title)
  if (lesIdx === null || lesIdx === undefined) {
    const lang = (LANG === 'en' && mod.en) ? 'en' : 'nl';
    return mod[lang]?.[field] ?? mod.nl?.[field] ?? '';
  }
  const lesson = mod.lessons?.[lesIdx];
  if (!lesson) return '';
  const lang = (LANG === 'en' && lesson.en) ? 'en' : 'nl';
  const lessonData = lesson[lang] ?? lesson.nl ?? {};
  if (subField !== undefined) {
    return lessonData[field]?.[subField] ?? '';
  }
  return lessonData[field] ?? '';
}
