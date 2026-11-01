/* HOLM HP/HC — carte heures creuses / heures pleines — https://github.com/kaaribou/holm-tarif — licence MIT */
(() => {
  // ---- HOLM i18n : textes écrits en français, traduits à l'affichage (en, de, es, it, nl, pt, pl) ----
  // Langue : option `language` de la carte, sinon celle du profil Home Assistant ; anglais si la langue n'est pas traduite.
  const HOLM_LANGS = ["en", "de", "es", "it", "nl", "pt", "pl"];
  const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski" };
  const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", it: "it-IT", nl: "nl-NL", pt: "pt-PT", pl: "pl-PL" };
  const I18N = {
    "Automatique (profil)": ["Automatic (profile)", "Automatisch (Profil)", "Automático (perfil)", "Automatica (profilo)", "Automatisch (profiel)", "Automático (perfil)", "Automatycznie (profil)"],
    "Langue": ["Language", "Sprache", "Idioma", "Lingua", "Taal", "Idioma", "Język"],
    "Titre": ["Title", "Titel", "Título", "Titolo", "Titel", "Título", "Tytuł"],
    "Titre (optionnel)": ["Title (optional)", "Titel (optional)", "Título (opcional)", "Titolo (facoltativo)", "Titel (optioneel)", "Título (opcional)", "Tytuł (opcjonalnie)"],
    "Nom": ["Name", "Name", "Nombre", "Nome", "Naam", "Nome", "Nazwa"],
    "Nom affiché": ["Display name", "Anzeigename", "Nombre mostrado", "Nome visualizzato", "Weergavenaam", "Nome apresentado", "Wyświetlana nazwa"],
    "Icône": ["Icon", "Symbol", "Icono", "Icona", "Pictogram", "Ícone", "Ikona"],
    "Couleur": ["Colour", "Farbe", "Color", "Colore", "Kleur", "Cor", "Kolor"],
    "Couleurs": ["Colours", "Farben", "Colores", "Colori", "Kleuren", "Cores", "Kolory"],
    "Entité": ["Entity", "Entität", "Entidad", "Entità", "Entiteit", "Entidade", "Encja"],
    "Entités": ["Entities", "Entitäten", "Entidades", "Entità", "Entiteiten", "Entidades", "Encje"],
    "Chargement…": ["Loading…", "Wird geladen…", "Cargando…", "Caricamento…", "Laden…", "A carregar…", "Ładowanie…"],
    "Erreur": ["Error", "Fehler", "Error", "Errore", "Fout", "Erro", "Błąd"],
    "Fermer": ["Close", "Schließen", "Cerrar", "Chiudi", "Sluiten", "Fechar", "Zamknij"],
    "Annuler": ["Cancel", "Abbrechen", "Cancelar", "Annulla", "Annuleren", "Cancelar", "Anuluj"],
    "Enregistrer": ["Save", "Speichern", "Guardar", "Salva", "Opslaan", "Guardar", "Zapisz"],
    "Supprimer": ["Delete", "Löschen", "Eliminar", "Elimina", "Verwijderen", "Eliminar", "Usuń"],
    "Ajouter": ["Add", "Hinzufügen", "Añadir", "Aggiungi", "Toevoegen", "Adicionar", "Dodaj"],
    "Monter": ["Move up", "Nach oben", "Subir", "Sposta su", "Omhoog", "Mover para cima", "W górę"],
    "Descendre": ["Move down", "Nach unten", "Bajar", "Sposta giù", "Omlaag", "Mover para baixo", "W dół"],
    "Afficher le cadre de la carte": ["Show the card frame", "Kartenrahmen anzeigen", "Mostrar el marco de la tarjeta", "Mostra la cornice della scheda", "Kaartkader tonen", "Mostrar a moldura do cartão", "Pokaż ramkę karty"],
    "Indisponible": ["Unavailable", "Nicht verfügbar", "No disponible", "Non disponibile", "Niet beschikbaar", "Indisponível", "Niedostępne"],
    "Aujourd'hui": ["Today", "Heute", "Hoy", "Oggi", "Vandaag", "Hoje", "Dziś"],
    "Hier": ["Yesterday", "Gestern", "Ayer", "Ieri", "Gisteren", "Ontem", "Wczoraj"],
    "Demain": ["Tomorrow", "Morgen", "Mañana", "Domani", "Morgen", "Amanhã", "Jutro"],
    "Batterie": ["Battery", "Batterie", "Batería", "Batteria", "Batterij", "Bateria", "Bateria"],
    "Aucune donnée sur cette période.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "No hay datos en este periodo.", "Nessun dato per questo periodo.", "Geen gegevens voor deze periode.", "Sem dados neste período.", "Brak danych w tym okresie."],
    "à l'instant": ["just now", "gerade eben", "ahora mismo", "proprio ora", "zojuist", "agora mesmo", "przed chwilą"],
    "il y a {n} min": ["{n} min ago", "vor {n} Min.", "hace {n} min", "{n} min fa", "{n} min geleden", "há {n} min", "{n} min temu"],
    "il y a {n} h": ["{n} h ago", "vor {n} Std.", "hace {n} h", "{n} h fa", "{n} u geleden", "há {n} h", "{n} godz. temu"],
    "il y a {n} j": ["{n} d ago", "vor {n} T.", "hace {n} d", "{n} g fa", "{n} d geleden", "há {n} d", "{n} dni temu"],
    "Prix, taxes et abonnement": ["Prices, taxes and subscription", "Preise, Steuern und Grundgebühr", "Precios, impuestos y término fijo", "Prezzi, tasse e quota fissa", "Prijzen, belastingen en vastrecht", "Preços, impostos e assinatura", "Ceny, podatki i opłata stała"],
    "Tempo · jours Bleus": ["Tempo · Blue days", "Tempo · blaue Tage", "Tempo · días azules", "Tempo · giorni blu", "Tempo · blauwe dagen", "Tempo · dias azuis", "Tempo · dni niebieskie"],
    "Tempo · jours Blancs": ["Tempo · White days", "Tempo · weiße Tage", "Tempo · días blancos", "Tempo · giorni bianchi", "Tempo · witte dagen", "Tempo · dias brancos", "Tempo · dni białe"],
    "Tempo · jours Rouges": ["Tempo · Red days", "Tempo · rote Tage", "Tempo · días rojos", "Tempo · giorni rossi", "Tempo · rode dagen", "Tempo · dias vermelhos", "Tempo · dni czerwone"],
    "Heures creuses": ["Off-peak hours", "Niedertarif", "Horas valle", "Fuori punta", "Daluren", "Horas de vazio", "Poza szczytem"],
    "Heures pleines": ["Peak hours", "Hochtarif", "Horas punta", "Ore di punta", "Piekuren", "Horas cheias", "Szczyt"],
    "Bleu · heures creuses": ["Blue · off-peak", "Blau · Niedertarif", "Azul · valle", "Blu · fuori punta", "Blauw · dal", "Azul · vazio", "Niebieski · poza szczytem"],
    "Bleu · heures pleines": ["Blue · peak", "Blau · Hochtarif", "Azul · punta", "Blu · punta", "Blauw · piek", "Azul · cheias", "Niebieski · szczyt"],
    "Blanc · heures creuses": ["White · off-peak", "Weiß · Niedertarif", "Blanco · valle", "Bianco · fuori punta", "Wit · dal", "Branco · vazio", "Biały · poza szczytem"],
    "Blanc · heures pleines": ["White · peak", "Weiß · Hochtarif", "Blanco · punta", "Bianco · punta", "Wit · piek", "Branco · cheias", "Biały · szczyt"],
    "Rouge · heures creuses": ["Red · off-peak", "Rot · Niedertarif", "Rojo · valle", "Rosso · fuori punta", "Rood · dal", "Vermelho · vazio", "Czerwony · poza szczytem"],
    "Rouge · heures pleines": ["Red · peak", "Rot · Hochtarif", "Rojo · punta", "Rosso · punta", "Rood · piek", "Vermelho · cheias", "Czerwony · szczyt"],
    "Abonnement": ["Subscription", "Grundgebühr", "Término fijo", "Quota fissa", "Vastrecht", "Assinatura", "Opłata stała"],
    "€/mois": ["€/month", "€/Monat", "€/mes", "€/mese", "€/maand", "€/mês", "€/mies."],
    "CSPE / accise": ["CSPE / excise", "CSPE / Verbrauchsteuer", "CSPE / impuesto especial", "CSPE / accisa", "CSPE / accijns", "CSPE / imposto especial", "CSPE / akcyza"],
    "Rachat du surplus": ["Surplus buy-back", "Einspeisevergütung", "Venta de excedentes", "Cessione del surplus", "Teruglevering overschot", "Venda do excedente", "Odkup nadwyżki"],
    "Taxe sur la revente": ["Tax on resale", "Steuer auf Einspeisung", "Impuesto sobre la venta", "Tassa sulla vendita", "Belasting op teruglevering", "Imposto sobre a venda", "Podatek od sprzedaży"],
    "Intégration HOLM HP/HC introuvable : choisissez son capteur « Heures creuses ».": ["HOLM HP/HC integration not found: choose its “Off-peak hours” sensor.", "Integration HOLM HP/HC nicht gefunden: Wählen Sie ihren Sensor „Niedertarif“.", "No se encuentra la integración HOLM HP/HC: elige su sensor «Horas valle».", "Integrazione HOLM HP/HC non trovata: scegli il suo sensore «Fuori punta».", "Integratie HOLM HP/HC niet gevonden: kies de sensor ‘Daluren’.", "Integração HOLM HP/HC não encontrada: escolha o seu sensor «Horas de vazio».", "Nie znaleziono integracji HOLM HP/HC: wybierz jej czujnik „Poza szczytem”."],
    "{p} dans {d}": ["{p} in {d}", "{p} in {d}", "{p} en {d}", "{p} tra {d}", "{p} over {d}", "{p} dentro de {d}", "{p} za {d}"],
    "(à {t})": ["(at {t})", "(um {t})", "(a las {t})", "(alle {t})", "(om {t})", "(às {t})", "(o {t})"],
    "Réglages : heures creuses et tarifs": ["Settings: off-peak hours and prices", "Einstellungen: Niedertarif und Preise", "Ajustes: horas valle y precios", "Impostazioni: fuori punta e prezzi", "Instellingen: daluren en prijzen", "Definições: horas de vazio e preços", "Ustawienia: godziny poza szczytem i ceny"],
    "Jour {c}": ["{c} day", "Tag {c}", "Día {c}", "Giorno {c}", "Dag {c}", "Dia {c}", "Dzień {c}"],
    "Bleu": ["Blue", "Blau", "Azul", "Blu", "Blauw", "Azul", "Niebieski"],
    "Blanc": ["White", "Weiß", "Blanco", "Bianco", "Wit", "Branco", "Biały"],
    "Rouge": ["Red", "Rot", "Rojo", "Rosso", "Rood", "Vermelho", "Czerwony"],
    "Heures creuses : {r}": ["Off-peak hours: {r}", "Niedertarif: {r}", "Horas valle: {r}", "Fuori punta: {r}", "Daluren: {r}", "Horas de vazio: {r}", "Poza szczytem: {r}"],
    "Toucher pour modifier": ["Tap to edit", "Zum Bearbeiten tippen", "Toca para editar", "Tocca per modificare", "Tik om te bewerken", "Toque para editar", "Dotknij, aby edytować"],
    "de": ["from", "von", "de", "da", "van", "de", "od"],
    "à": ["to", "bis", "a", "a", "tot", "a", "do"],
    "Supprimer cette plage": ["Delete this range", "Dieses Zeitfenster löschen", "Eliminar esta franja", "Elimina questa fascia", "Dit tijdvak verwijderen", "Eliminar este intervalo", "Usuń ten przedział"],
    "Ajouter une plage": ["Add a range", "Zeitfenster hinzufügen", "Añadir una franja", "Aggiungi una fascia", "Tijdvak toevoegen", "Adicionar um intervalo", "Dodaj przedział"],
    "Relié à {e} : cette entrée est mise à jour aussi": ["Linked to {e}: this input is updated too", "Verknüpft mit {e}: Dieser Wert wird ebenfalls aktualisiert", "Vinculado a {e}: esta entrada también se actualiza", "Collegato a {e}: anche questo valore viene aggiornato", "Gekoppeld aan {e}: deze invoer wordt ook bijgewerkt", "Ligado a {e}: esta entrada também é atualizada", "Powiązane z {e}: ta wartość też jest aktualizowana"],
    "relié": ["linked", "verknüpft", "vinculado", "collegato", "gekoppeld", "ligado", "powiązane"],
    "Couleur du jour : {s}": ["Day colour: {s}", "Tagesfarbe: {s}", "Color del día: {s}", "Colore del giorno: {s}", "Dagkleur: {s}", "Cor do dia: {s}", "Kolor dnia: {s}"],
    "aucune source (réglage de l'intégration)": ["no source (integration setting)", "keine Quelle (Einstellung der Integration)", "ninguna fuente (ajuste de la integración)", "nessuna fonte (impostazione dell'integrazione)", "geen bron (instelling van de integratie)", "nenhuma fonte (definição da integração)", "brak źródła (ustawienie integracji)"],
    "Chaque plage doit avoir une heure de début et une heure de fin différentes.": ["Each range needs different start and end times.", "Jedes Zeitfenster braucht unterschiedliche Start- und Endzeiten.", "Cada franja debe tener una hora de inicio y de fin distintas.", "Ogni fascia deve avere un'ora di inizio e di fine diverse.", "Elk tijdvak moet een verschillende begin- en eindtijd hebben.", "Cada intervalo deve ter horas de início e de fim diferentes.", "Każdy przedział musi mieć różne godziny początku i końca."],
    "Un prix ne peut pas être négatif.": ["A price can't be negative.", "Ein Preis kann nicht negativ sein.", "Un precio no puede ser negativo.", "Un prezzo non può essere negativo.", "Een prijs kan niet negatief zijn.", "Um preço não pode ser negativo.", "Cena nie może być ujemna."],
    "Enregistrement…": ["Saving…", "Wird gespeichert…", "Guardando…", "Salvataggio…", "Opslaan…", "A guardar…", "Zapisywanie…"],
    "Enregistrement impossible : {e}": ["Couldn't save: {e}", "Speichern nicht möglich: {e}", "No se pudo guardar: {e}", "Salvataggio impossibile: {e}", "Opslaan mislukt: {e}", "Não foi possível guardar: {e}", "Nie można zapisać: {e}"],
    "Toujours": ["Always", "Immer", "Siempre", "Sempre", "Altijd", "Sempre", "Zawsze"],
    "En heures creuses seulement": ["Off-peak hours only", "Nur im Niedertarif", "Solo en horas valle", "Solo fuori punta", "Alleen in daluren", "Só em horas de vazio", "Tylko poza szczytem"],
    "En heures pleines seulement": ["Peak hours only", "Nur im Hochtarif", "Solo en horas punta", "Solo nelle ore di punta", "Alleen in piekuren", "Só em horas cheias", "Tylko w szczycie"],
    "Jamais (fond du thème)": ["Never (theme background)", "Nie (Theme-Hintergrund)", "Nunca (fondo del tema)", "Mai (sfondo del tema)", "Nooit (themaachtergrond)", "Nunca (fundo do tema)", "Nigdy (tło motywu)"],
    "Option Tempo": ["Tempo option", "Tempo-Option", "Opción Tempo", "Opzione Tempo", "Tempo-optie", "Opção Tempo", "Opcja Tempo"],
    "Couleur du jour Tempo": ["Tempo day colour", "Tempo-Tagesfarbe", "Color del día Tempo", "Colore del giorno Tempo", "Tempo-dagkleur", "Cor do dia Tempo", "Kolor dnia Tempo"],
    "Heures creuses / heures pleines": ["Off-peak / peak hours", "Nieder- / Hochtarif", "Horas valle / punta", "Fuori punta / punta", "Dal- / piekuren", "Horas de vazio / cheias", "Poza szczytem / szczyt"],
    "Capteur « Heures creuses » (automatique si vide)": ["“Off-peak hours” sensor (automatic if empty)", "Sensor „Niedertarif“ (automatisch wenn leer)", "Sensor «Horas valle» (automático si está vacío)", "Sensore «Fuori punta» (automatico se vuoto)", "Sensor ‘Daluren’ (automatisch indien leeg)", "Sensor «Horas de vazio» (automático se vazio)", "Czujnik „Poza szczytem” (automatycznie, jeśli puste)"],
    "Titre (sinon Heures creuses / Heures pleines)": ["Title (otherwise Off-peak / Peak hours)", "Titel (sonst Niedertarif / Hochtarif)", "Título (si no, Horas valle / punta)", "Titolo (altrimenti Fuori punta / Punta)", "Titel (anders Daluren / Piekuren)", "Título (senão Horas de vazio / cheias)", "Tytuł (w przeciwnym razie Poza szczytem / Szczyt)"],
    "Fond coloré": ["Coloured background", "Farbiger Hintergrund", "Fondo de color", "Sfondo colorato", "Gekleurde achtergrond", "Fundo colorido", "Kolorowe tło"],
    "Afficher les tarifs et l'abonnement": ["Show prices and subscription", "Preise und Grundgebühr anzeigen", "Mostrar los precios y el término fijo", "Mostra prezzi e quota fissa", "Prijzen en vastrecht tonen", "Mostrar os preços e a assinatura", "Pokaż ceny i opłatę stałą"],
    "Barre d'avancement de la période": ["Period progress bar", "Fortschrittsbalken der Periode", "Barra de progreso del periodo", "Barra di avanzamento della fascia", "Voortgangsbalk van de periode", "Barra de progresso do período", "Pasek postępu okresu"],
    "Bouton Réglages (administrateurs)": ["Settings button (administrators)", "Einstellungs-Taste (Administratoren)", "Botón Ajustes (administradores)", "Pulsante Impostazioni (amministratori)", "Knop Instellingen (beheerders)", "Botão Definições (administradores)", "Przycisk Ustawienia (administratorzy)"],
    "Couleur — heures creuses": ["Colour — off-peak hours", "Farbe — Niedertarif", "Color — horas valle", "Colore — fuori punta", "Kleur — daluren", "Cor — horas de vazio", "Kolor — poza szczytem"],
    "Couleur — heures pleines": ["Colour — peak hours", "Farbe — Hochtarif", "Color — horas punta", "Colore — punta", "Kleur — piekuren", "Cor — horas cheias", "Kolor — szczyt"],
    "Couleur de la carte en Tempo": ["Card colour with Tempo", "Kartenfarbe bei Tempo", "Color de la tarjeta en Tempo", "Colore della scheda con Tempo", "Kaartkleur bij Tempo", "Cor do cartão em Tempo", "Kolor karty w Tempo"],
    "Couleur — jour Bleu": ["Colour — Blue day", "Farbe — blauer Tag", "Color — día azul", "Colore — giorno blu", "Kleur — blauwe dag", "Cor — dia azul", "Kolor — dzień niebieski"],
    "Couleur — jour Blanc": ["Colour — White day", "Farbe — weißer Tag", "Color — día blanco", "Colore — giorno bianco", "Kleur — witte dag", "Cor — dia branco", "Kolor — dzień biały"],
    "Couleur — jour Rouge": ["Colour — Red day", "Farbe — roter Tag", "Color — día rojo", "Colore — giorno rosso", "Kleur — rode dag", "Cor — dia vermelho", "Kolor — dzień czerwony"],
    "Heures creuses / heures pleines : période, tarif en cours, prochaine bascule, tarifs et réglages.": ["Off-peak / peak hours: period, current price, next switch, prices and settings.", "Nieder- / Hochtarif: Periode, aktueller Preis, nächster Wechsel, Preise und Einstellungen.", "Horas valle / punta: periodo, precio actual, próximo cambio, precios y ajustes.", "Fuori punta / punta: fascia, prezzo attuale, prossimo cambio, prezzi e impostazioni.", "Dal- / piekuren: periode, huidige prijs, volgende wissel, prijzen en instellingen.", "Horas de vazio / cheias: período, preço atual, próxima mudança, preços e definições.", "Poza szczytem / szczyt: okres, bieżąca cena, następna zmiana, ceny i ustawienia."],
    "Heures Creuses": ["Off-peak hours", "Niedertarif", "Horas valle", "Fuori punta", "Daluren", "Horas de vazio", "Poza szczytem"],
    "Heures Pleines": ["Peak hours", "Hochtarif", "Horas punta", "Ore di punta", "Piekuren", "Horas cheias", "Szczyt"]
  };
  let LANG = "fr", NUMLOC = "fr-FR";
  const langOf = (hass, c) => { const l = String((c && c.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || "en").toLowerCase().split(/[-_]/)[0]; return l === "fr" || HOLM_LANGS.includes(l) ? l : "en"; };
  const setLang = (hass, c) => { LANG = langOf(hass, c); const p = hass && hass.locale && hass.locale.language; NUMLOC = !(c && c.language) && p && p.toLowerCase().startsWith(LANG) ? p : LOCALES[LANG]; return LANG; };
  const _ = (s, v) => { let o = LANG === "fr" ? s : ((I18N[s] && I18N[s][HOLM_LANGS.indexOf(LANG)]) || s); if (v) for (const k in v) o = o.split("{" + k + "}").join(v[k]); return o; };
  // champ « Langue » pour les éditeurs visuels (ha-form)
  const langField = () => ({ name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: _("Automatique (profil)") }, ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))] } } });
  // traduit les titres de sections et les libellés d'options d'un schéma ha-form (écrits en français)
  const locSchema = (sc) => (sc || []).map((x) => { const o = { ...x }; if (o.title) o.title = _(o.title); if (o.schema) o.schema = locSchema(o.schema);
    if (o.selector && o.selector.select && o.name !== "language") o.selector = { ...o.selector, select: { ...o.selector.select, options: (o.selector.select.options || []).map((op) => (typeof op === "string" ? op : { ...op, label: _(op.label) })) } };
    if (o.name === "language" && o.selector && o.selector.select) o.selector = { ...o.selector, select: { ...o.selector.select, options: o.selector.select.options.map((op) => (op.value ? op : { ...op, label: _("Automatique (profil)") })) } };
    return o; });
  const VERSION = "1.2.0";
  const fmt = (v, d = 4) => (v === null || v === undefined || isNaN(Number(v)) ? "—" : Number(v).toLocaleString(NUMLOC, { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d }));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hex2rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return undefined; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (a) => (Array.isArray(a) ? "#" + a.map((v) => Number(v).toString(16).padStart(2, "0")).join("") : a);
  const DEF = { hc: "#2e7d32", hp: "#e64a19", bleu: "#2f6fd6", blanc: "#8d99a8", rouge: "#d8433b" };
  const TCOL = { Bleu: "bleu", Blanc: "blanc", Rouge: "rouge" };
  // Tempo : lignes de prix par couleur
  const TROWS = ["bleu", "blanc", "rouge"].flatMap((c) => [[`prix_${c}_hc`, `${c[0].toUpperCase() + c.slice(1)} · heures creuses`, "€/kWh", 4, "mdi:circle", c, true],
    [`prix_${c}_hp`, `${c[0].toUpperCase() + c.slice(1)} · heures pleines`, "€/kWh", 4, "mdi:circle", c, false]]);
  const GROUPS = { base: _("Prix, taxes et abonnement"), tempo_bleu: _("Tempo · jours Bleus"), tempo_blanc: _("Tempo · jours Blancs"), tempo_rouge: _("Tempo · jours Rouges") };
  // attribut du capteur Tarif actuel -> libellé, unité affichée, décimales, icône
  const ROWS = [
    ["prix_hc", _("Heures creuses"), "€/kWh", 4, "mdi:leaf"],
    ["prix_hp", _("Heures pleines"), "€/kWh", 4, "mdi:fire"],
    ["abonnement_mensuel", _("Abonnement"), _("€/mois"), 2, "mdi:calendar-month"],
    ["cspe", _("CSPE / accise"), "€/kWh", 5, "mdi:bank-outline"],
    ["tcfe", "TCFE", "€/kWh", 5, "mdi:bank-outline"],
    ["prix_rachat", _("Rachat du surplus"), "€/kWh", 4, "mdi:solar-power-variant"],
    ["taxe_revente", _("Taxe sur la revente"), "€/kWh", 4, "mdi:percent-outline"],
  ];

  // plages « 14:58-16:58, 23:28-05:28 » -> début de la période en cours (barre d'avancement)
  const parseRanges = (t) => String(t || "").split(",").map((p) => p.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/)).filter(Boolean)
    .map((m) => [(+m[1] * 60 + +m[2]) % 1440, (+m[3] * 60 + +m[4]) % 1440]);
  const inHC = (min, rs) => rs.some(([a, b]) => (a < b ? min >= a && min < b : min >= a || min < b));
  const periodStart = (now, rs) => {
    const cur = inHC(now.getHours() * 60 + now.getMinutes(), rs);
    for (let back = 1; back <= 2880; back++) {
      const t = new Date(now.getTime() - back * 60000);
      if (inHC(t.getHours() * 60 + t.getMinutes(), rs) !== cur) return new Date(t.getTime() + 60000);
    }
    return null;
  };

  class HolmTarifCard extends HTMLElement {
    static getConfigElement() { return document.createElement("holm-tarif-card-editor"); }
    static getStubConfig(hass) { return { entity: HolmTarifCard.findEntity(hass) || "" }; }
    static findEntity(hass) {
      if (!hass) return null;
      return Object.keys(hass.states).find((e) => e.startsWith("binary_sensor.") && hass.states[e].attributes.plages_hc !== undefined && hass.states[e].attributes.prochaine_periode !== undefined) || null;
    }
    setConfig(c) {
      this._c = { show_details: false, show_progress: true, show_settings: true, background: "always", color_mode: "tempo", ...c };
      this._c.colors = { ...DEF, ...(c.colors || {}) };
      if (this.shadowRoot) this._render();
    }
    set hass(h) {
      this._hass = h;
      { const _l = setLang(h, this._c); if (this._lang && _l !== this._lang) this._key = ""; this._lang = _l; }
      if (!this.shadowRoot) { this.attachShadow({ mode: "open" }); this._build(); }
      const ent = this._entity(), st = ent && h.states[ent], ps = this._priceSensor();
      const tom = h.states["sensor.tempo_couleur_demain"];
      const key = [st && st.state, st && st.attributes.prochaine_bascule, st && st.attributes.tarif, st && st.attributes.plages_hc, st && st.attributes.couleur, tom && tom.state, ps && JSON.stringify(ps.attributes)].join("|");
      if (key !== this._key) { this._key = key; this._render(); }
    }
    connectedCallback() { this._tick = setInterval(() => this._render(), 30000); }
    disconnectedCallback() { clearInterval(this._tick); }
    getCardSize() { return this._c && this._c.show_details ? 5 : 2; }
    getGridOptions() { return { columns: 6, min_columns: 4, rows: "auto" }; }
    _entity() { return this._c.entity || HolmTarifCard.findEntity(this._hass); }
    _priceSensor() {
      const h = this._hass; if (!h) return null;
      const id = Object.keys(h.states).find((e) => e.startsWith("sensor.") && h.states[e].attributes.reglages !== undefined && h.states[e].attributes.prix_hc !== undefined);
      return id ? h.states[id] : null;
    }
    _admin() { return !!(this._hass && this._hass.user && this._hass.user.is_admin); }
    _build() {
      this.shadowRoot.innerHTML = `<style>${HolmTarifCard.css()}</style><ha-card><div class="bg"></div>
        <div class="main" id="main"></div><div class="det" id="det"></div><div class="set" id="set"></div></ha-card>`;
      const r = this.shadowRoot;
      r.getElementById("main").addEventListener("click", (e) => {
        if (e.target.closest(".gear")) { e.stopPropagation(); return this._openSettings(); }
        const ent = this._entity(); if (!ent) return;
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: ent }, bubbles: true, composed: true }));
      });
      r.getElementById("det").addEventListener("click", (e) => {
        const row = e.target.closest("[data-k]"); if (!row || e.target.closest("input,button")) return;
        this._edit(row);
      });
      // les touches tapées dans la carte ne doivent pas déclencher les raccourcis du tableau de bord
      ["keydown", "keyup"].forEach((ev) => r.getElementById("set").addEventListener(ev, (e) => e.stopPropagation()));
    }
    _render() {
      if (!this.shadowRoot || !this._c || !this._hass) return;
      setLang(this._hass, this._c);
      const card = this.shadowRoot.querySelector("ha-card"), main = this.shadowRoot.getElementById("main"), det = this.shadowRoot.getElementById("det");
      const ent = this._entity(), st = ent && this._hass.states[ent];
      if (!st) { main.innerHTML = `<div class="miss">${_("Intégration HOLM HP/HC introuvable : choisissez son capteur « Heures creuses ».")}</div>`; det.innerHTML = ""; return; }
      const a = st.attributes, hc = st.state === "on";
      const tday = TCOL[a.couleur] || null, tomSt = this._hass.states["sensor.tempo_couleur_demain"], ttom = tomSt ? TCOL[tomSt.state] || null : null;
      const col = tday && this._c.color_mode === "tempo" ? this._c.colors[tday] : hc ? this._c.colors.hc : this._c.colors.hp;
      const bg = this._c.background, filled = bg === "always" || (bg === "hc" && hc) || (bg === "hp" && !hc);
      card.style.setProperty("--c", col);
      card.classList.toggle("hc", hc);
      card.classList.toggle("filled", filled);
      const next = a.prochaine_bascule ? new Date(a.prochaine_bascule) : null, now = new Date();
      let label = "";
      if (next) {
        const mins = Math.max(0, Math.ceil((next - now) / 60000));
        const hh = String(next.getHours()).padStart(2, "0"), mm = String(next.getMinutes()).padStart(2, "0");
        const dur = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
        label = `${_("{p} dans {d}", { p: esc(_(a.prochaine_periode || "")), d: dur })} <span class="at">${_("(à {t})", { t: `${hh}h${mm}` })}</span>`;
      }
      let prog = "";
      if (this._c.show_progress && next && a.source !== "compteur") {
        const start = periodStart(now, parseRanges(a.plages_hc));
        if (start && next > start) prog = `<div class="bar"><i style="width:${Math.min(100, Math.max(0, ((now - start) / (next - start)) * 100)).toFixed(1)}%"></i></div>`;
      }
      const gear = this._c.show_settings && this._admin() ? `<button class="gear" title="${_("Réglages : heures creuses et tarifs")}"><ha-icon icon="mdi:cog-outline"></ha-icon></button>` : "";
      const tempo = a.couleur !== undefined ? `<div class="tp"><span class="tc"><i style="background:${tday ? this._c.colors[tday] : "transparent"}"></i>${_("Jour {c}", { c: esc(_(a.couleur)) })}</span>${ttom ? `<span class="tc dim">${_("Demain")} <i style="background:${this._c.colors[ttom]}"></i>${esc(_(tomSt.state))}</span>` : ""}</div>` : "";
      card.classList.toggle("tblanc", tday === "blanc" && this._c.color_mode === "tempo");
      main.innerHTML = `<div class="ico"><ha-icon icon="${hc ? "mdi:leaf-circle-outline" : "mdi:fire-circle"}"></ha-icon></div>
        <div class="txt">${tempo}<div class="nm">${esc(this._c.name || (hc ? _("Heures creuses") : _("Heures pleines")))}</div>
        <div class="pr">${fmt(a.tarif)} <small>€/kWh</small></div><div class="lb">${label}</div>${prog}</div>${gear}`;
      if (!this._c.show_details) { det.innerHTML = ""; det.style.display = "none"; return; }
      det.style.display = "";
      if (this._editing) return;
      const ps = this._priceSensor(), pa = (ps && ps.attributes) || {}, ents = pa.reglages || {};
      const can = this._admin();
      det.innerHTML = `<div class="rng"><ha-icon icon="mdi:clock-outline"></ha-icon>${_("Heures creuses : {r}", { r: esc(a.plages_hc || "—") })}</div>
        ${(pa.prix_bleu_hc !== undefined ? [...TROWS, ...ROWS.slice(2)] : ROWS).filter(([k]) => pa[k] !== undefined && pa[k] !== null).map(([k, l, u, d, ic, tc, thc]) => {
          const cur = tc ? tc === tday && thc === hc : (k === "prix_hc" && hc) || (k === "prix_hp" && !hc);
          return `<div class="row${cur ? " cur" : ""}${can ? " ed" : ""}" data-k="${k}" data-ent="${esc(ents[k] || "")}" ${can ? `title="${_("Toucher pour modifier")}"` : ""}>
          <ha-icon icon="${ic}" ${tc ? `style="color:${this._c.colors[tc]}"` : ""}></ha-icon><span class="l">${_(l)}</span><span class="v">${fmt(pa[k], d)} <small>${_(u)}</small></span>${can ? '<ha-icon class="pen" icon="mdi:pencil-outline"></ha-icon>' : ""}</div>`; }).join("")}`;
    }
    // modification rapide d'un prix (entités « nombre » de l'intégration)
    _edit(row) {
      if (!this._admin()) return;
      const ent = row.dataset.ent, st = ent && this._hass.states[ent]; if (!st) return;
      this._editing = true;
      const v = row.querySelector(".v");
      v.innerHTML = `<input type="number" step="any" min="0" value="${esc(st.state)}"><button class="ok">OK</button>`;
      const inp = v.querySelector("input");
      inp.focus(); inp.select();
      const done = (save) => {
        if (!this._editing) return;
        this._editing = false;
        const n = parseFloat(String(inp.value).replace(",", "."));
        if (save && !isNaN(n) && n >= 0 && String(n) !== st.state) this._hass.callService("number", "set_value", { entity_id: ent, value: n });
        this._key = ""; this._render();
      };
      inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
      inp.addEventListener("blur", () => setTimeout(() => done(true), 150));
      v.querySelector(".ok").addEventListener("click", (e) => { e.stopPropagation(); done(true); });
    }
    // ---- réglages : plages heures creuses, prix, taxes, abonnement ----
    async _openSettings() {
      const box = this.shadowRoot.getElementById("set");
      if (box.classList.contains("on")) return this._closeSettings();
      box.classList.add("on");
      box.innerHTML = `<div class="sh">${_("Chargement…")}</div>`;
      try { this._cfg = await this._hass.callWS({ type: "holm_tarif/get" }); }
      catch (e) { box.innerHTML = `<div class="sh err">${esc(e.message || e)}</div>`; return; }
      this._draft = { ranges: this._cfg.ranges.map((r) => [...r]), prices: Object.fromEntries(this._cfg.prices.map((p) => [p.key, p.value])) };
      this._drawSettings();
    }
    _closeSettings() { const box = this.shadowRoot.getElementById("set"); box.classList.remove("on"); box.innerHTML = ""; }
    _drawSettings(msg = "") {
      const box = this.shadowRoot.getElementById("set"), d = this._draft;
      box.innerHTML = `
        <div class="sh"><ha-icon icon="mdi:clock-outline"></ha-icon>${_("Heures creuses")}</div>
        <div class="rgs">${d.ranges.map(([a, b], i) => `<div class="rg" data-i="${i}"><span>${_("de")}</span><input type="time" data-f="0" value="${a}"><span>${_("à")}</span><input type="time" data-f="1" value="${b}">
          <button class="ib del" title="${_("Supprimer cette plage")}" ${d.ranges.length < 2 ? "disabled" : ""}><ha-icon icon="mdi:close"></ha-icon></button></div>`).join("")}</div>
        <button class="add"><ha-icon icon="mdi:plus"></ha-icon>${_("Ajouter une plage")}</button>
        ${((list) => Object.keys(GROUPS).filter((g) => list.some((p) => (p.group || "base") === g)).map((g) => `
        <div class="sh"><ha-icon icon="${g === "base" ? "mdi:cash-multiple" : "mdi:circle"}" ${g !== "base" ? `style="color:${this._c.colors[g.slice(6)]}"` : ""}></ha-icon>${_(GROUPS[g])}</div>
        <div class="pgs">${list.filter((p) => (p.group || "base") === g).map((p) => `<label class="pg"><span>${esc(g === "base" ? p.name : p.name.replace(/^Prix Tempo \S+ /, ""))}${p.link ? `<i title="${_("Relié à {e} : cette entrée est mise à jour aussi", { e: esc(p.link) })}">${_("relié")}</i>` : ""}</span>
          <span class="in"><input type="number" step="any" min="0" data-k="${p.key}" value="${d.prices[p.key] ?? ""}"><small>${p.unit === "EUR" ? _("€/mois") : "€/kWh"}</small></span></label>`).join("")}</div>`).join(""))(
          // en Tempo, les prix HC / HP simples ne servent pas : on ne montre que les prix Tempo
          this._cfg.tariff === "tempo" ? this._cfg.prices.filter((p) => !["price_hc", "price_hp"].includes(p.key)) : this._cfg.prices)}
        ${this._cfg.tempo ? `<div class="tsrc">${_("Couleur du jour : {s}", { s: esc(this._cfg.tempo.source || _("aucune source (réglage de l'intégration)")) })}</div>` : ""}
        ${msg ? `<div class="msg">${esc(msg)}</div>` : ""}
        <div class="acts"><button class="cancel">${_("Annuler")}</button><button class="save"><ha-icon icon="mdi:content-save-outline"></ha-icon>${_("Enregistrer")}</button></div>`;
      box.querySelectorAll(".rg input").forEach((inp) => inp.addEventListener("change", () => { d.ranges[+inp.closest(".rg").dataset.i][+inp.dataset.f] = inp.value; }));
      box.querySelectorAll(".rg .del").forEach((b) => b.addEventListener("click", () => { d.ranges.splice(+b.closest(".rg").dataset.i, 1); this._drawSettings(); }));
      box.querySelector(".add").addEventListener("click", () => { d.ranges.push(["12:00", "14:00"]); this._drawSettings(); });
      box.querySelectorAll(".pg input").forEach((inp) => inp.addEventListener("input", () => { const n = parseFloat(String(inp.value).replace(",", ".")); d.prices[inp.dataset.k] = isNaN(n) ? null : n; }));
      box.querySelector(".cancel").addEventListener("click", () => this._closeSettings());
      box.querySelector(".save").addEventListener("click", () => this._saveSettings());
    }
    async _saveSettings() {
      const d = this._draft;
      if (d.ranges.some(([a, b]) => !a || !b || a === b)) return this._drawSettings(_("Chaque plage doit avoir une heure de début et une heure de fin différentes."));
      const prices = {};
      for (const p of this._cfg.prices) { const v = d.prices[p.key]; if (v !== null && v !== undefined && v !== p.value) { if (v < 0) return this._drawSettings(_("Un prix ne peut pas être négatif.")); prices[p.key] = v; } }
      const same = JSON.stringify(d.ranges) === JSON.stringify(this._cfg.ranges);
      const btn = this.shadowRoot.querySelector(".set .save"); if (btn) { btn.disabled = true; btn.textContent = _("Enregistrement…"); }
      try {
        await this._hass.callWS({ type: "holm_tarif/set", ...(same ? {} : { ranges: d.ranges }), ...(Object.keys(prices).length ? { prices } : {}) });
        this._closeSettings();
      } catch (e) { this._drawSettings(_("Enregistrement impossible : {e}", { e: e.message || e })); }
    }
    static css() {
      return `
      :host { display:block; }
      ha-card { display:block; position:relative; overflow:hidden; --c:#607d8b; transition: box-shadow .5s; }
      .bg { position:absolute; inset:0; opacity:0; pointer-events:none; transition: opacity .5s, background .5s;
        background: linear-gradient(135deg, color-mix(in srgb, var(--c) 78%, #000) 0%, var(--c) 55%, color-mix(in srgb, var(--c) 70%, #fff) 100%); }
      ha-card.filled { color:#fff; box-shadow: 0 0 14px color-mix(in srgb, var(--c) 50%, transparent); }
      ha-card.filled .bg { opacity:1; }
      .main, .det, .set { position:relative; }
      .main { display:flex; align-items:center; gap:12px; padding:10px 14px; cursor:pointer; }
      .ico ha-icon { --mdc-icon-size:34px; display:block; color: var(--c); }
      ha-card.filled .ico ha-icon { color: rgba(255,255,255,.88); }
      ha-card.hc .ico ha-icon { animation: sway 6s ease-in-out infinite; }
      ha-card:not(.hc) .ico ha-icon { animation: flick 2.4s ease-in-out infinite; }
      @keyframes sway { 50% { transform: rotate(-8deg); } }
      @keyframes flick { 50% { transform: scale(1.06); filter: brightness(1.15); } }
      .txt { flex:1; min-width:0; }
      .nm { font-size:11px; font-weight:800; letter-spacing:.5px; text-transform:uppercase; color: var(--c); }
      ha-card.filled .nm { color: inherit; opacity:.92; }
      .pr { font-size:20px; font-weight:800; line-height:1.2; font-variant-numeric: tabular-nums; }
      .pr small { font-size:12px; font-weight:600; opacity:.8; }
      .lb { font-size:11px; opacity:.88; line-height:1.3; }
      .at { opacity:.8; }
      .bar { height:3px; margin-top:6px; border-radius:2px; background: color-mix(in srgb, var(--c) 25%, transparent); overflow:hidden; }
      .bar i { display:block; height:100%; background: var(--c); border-radius:2px; transition: width .6s; }
      ha-card.filled .bar { background: rgba(255,255,255,.25); } ha-card.filled .bar i { background: rgba(255,255,255,.9); }
      .gear { align-self:flex-start; border:0; background:none; color:inherit; opacity:.6; cursor:pointer; padding:2px; border-radius:50%; }
      .gear:hover { opacity:1; background: rgba(127,127,127,.18); }
      .gear ha-icon { --mdc-icon-size:18px; display:block; }
      .det { background: rgba(0,0,0,.14); padding:6px 8px 8px; }
      ha-card.filled .det { background: rgba(0,0,0,.22); }
      .rng { display:flex; align-items:center; gap:6px; font-size:11.5px; opacity:.88; padding:2px 6px 6px; }
      .rng ha-icon { --mdc-icon-size:14px; }
      .row { display:flex; align-items:center; gap:8px; padding:5px 6px; border-radius:8px; font-size:13px; }
      .row.ed { cursor:pointer; } .row.ed:hover { background: rgba(127,127,127,.15); }
      .row.cur { background: rgba(127,127,127,.2); font-weight:700; }
      .row ha-icon { --mdc-icon-size:16px; opacity:.85; }
      .row .l { flex:1; }
      .row .v { font-variant-numeric: tabular-nums; display:flex; align-items:center; gap:4px; }
      .row .v small { opacity:.75; font-size:11px; }
      .row .pen { --mdc-icon-size:14px; opacity:0; } .row:hover .pen { opacity:.7; }
      input { padding:4px 6px; border-radius:6px; border:1px solid rgba(127,127,127,.35); font:inherit; background: var(--card-background-color, #fff); color: var(--primary-text-color, #222); }
      .row input { width:90px; text-align:right; }
      button.ok, .acts button, .add { border:0; border-radius:8px; padding:5px 10px; font:inherit; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }
      button.ok { background:#fff; color:#222; padding:3px 8px; }
      .set { display:none; padding:8px 12px 12px; background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); border-top:1px solid rgba(127,127,127,.25); }
      .set.on { display:block; }
      .sh { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.4px; margin:8px 0 6px; color: var(--c); }
      .sh ha-icon { --mdc-icon-size:16px; } .sh.err { color: var(--error-color, #e53935); text-transform:none; }
      .rg { display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:13px; }
      .rg input { width:96px; }
      .ib { border:0; background:none; color:inherit; cursor:pointer; padding:3px; border-radius:50%; opacity:.7; }
      .ib:disabled { opacity:.25; cursor:default; } .ib ha-icon { --mdc-icon-size:16px; display:block; }
      .add { background: rgba(127,127,127,.15); color:inherit; font-weight:600; font-size:12.5px; }
      .add ha-icon, .acts ha-icon { --mdc-icon-size:16px; }
      .pgs { display:grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap:6px 12px; }
      .pg { display:flex; flex-direction:column; gap:3px; font-size:12px; }
      .pg i { font-style:normal; font-size:10px; margin-left:6px; padding:0 5px; border-radius:6px; background: color-mix(in srgb, var(--c) 25%, transparent); }
      .pg .in { display:flex; align-items:center; gap:6px; } .pg input { width:110px; text-align:right; } .pg small { opacity:.7; }
      .msg { margin-top:8px; font-size:12.5px; color: var(--error-color, #e53935); }
      .acts { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
      .acts .cancel { background: rgba(127,127,127,.15); color:inherit; }
      .acts .save { background: var(--c); color:#fff; }
      .acts button:disabled { opacity:.6; }
      .tp { display:flex; flex-wrap:wrap; gap:4px 10px; margin-bottom:3px; font-size:11px; font-weight:700; }
      .tc { display:inline-flex; align-items:center; gap:5px; } .tc.dim { opacity:.8; font-weight:600; }
      .tc i { width:9px; height:9px; border-radius:50%; box-shadow: 0 0 0 1.5px currentColor; }
      ha-card.tblanc .nm, ha-card.tblanc .sh { color: var(--primary-text-color); }
      ha-card.tblanc.filled .nm { color: inherit; }
      .tsrc { margin-top:8px; font-size:11.5px; opacity:.75; }
      .miss { padding:10px 14px; font-size:13px; color: var(--primary-text-color); }
      @media (prefers-reduced-motion: reduce) { .ico ha-icon { animation:none !important; } }`;
    }
  }

  class HolmTarifCardEditor extends HTMLElement {
    setConfig(c) { this._config = { ...c }; this._update(); }
    set hass(h) { this._hass = h; this._update(); }
    _update() {
      if (!this._hass || !this._config) return;
      { const _l = setLang(this._hass, this._config); if (this._form && _l !== this._lang) { this._form.remove(); this._form = null; } this._lang = _l; }
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.schema = locSchema([
          langField(),
          { name: "entity", selector: { entity: { domain: "binary_sensor" } } },
          { name: "name", selector: { text: {} } },
          { name: "background", selector: { select: { mode: "dropdown", options: [
            { value: "always", label: _("Toujours") }, { value: "hc", label: _("En heures creuses seulement") },
            { value: "hp", label: _("En heures pleines seulement") }, { value: "never", label: _("Jamais (fond du thème)") }] } } },
          { type: "grid", name: "", schema: [{ name: "c_hc", selector: { color_rgb: {} } }, { name: "c_hp", selector: { color_rgb: {} } }] },
          { type: "expandable", title: _("Option Tempo"), icon: "mdi:circle-half-full", flatten: true, schema: [
            { name: "color_mode", selector: { select: { mode: "dropdown", options: [{ value: "tempo", label: _("Couleur du jour Tempo") }, { value: "period", label: _("Heures creuses / heures pleines") }] } } },
            { type: "grid", name: "", schema: [{ name: "c_bleu", selector: { color_rgb: {} } }, { name: "c_blanc", selector: { color_rgb: {} } }, { name: "c_rouge", selector: { color_rgb: {} } }] },
          ] },
          { type: "grid", name: "", schema: [{ name: "show_details", selector: { boolean: {} } }, { name: "show_progress", selector: { boolean: {} } }, { name: "show_settings", selector: { boolean: {} } }] },
        ]);
        const L = { language: _("Langue"), entity: _("Capteur « Heures creuses » (automatique si vide)"), name: _("Titre (sinon Heures creuses / Heures pleines)"), background: _("Fond coloré"),
          show_details: _("Afficher les tarifs et l'abonnement"), show_progress: _("Barre d'avancement de la période"), show_settings: _("Bouton Réglages (administrateurs)"),
          c_hc: _("Couleur — heures creuses"), c_hp: _("Couleur — heures pleines"), color_mode: _("Couleur de la carte en Tempo"),
          c_bleu: _("Couleur — jour Bleu"), c_blanc: _("Couleur — jour Blanc"), c_rouge: _("Couleur — jour Rouge") };
        this._form.computeLabel = (s) => (L[s.name] ? _(L[s.name]) : s.name);
        this._form.addEventListener("value-changed", (ev) => {
          const v = { ...ev.detail.value }, out = { ...this._config }, colors = { ...(this._config.colors || {}) };
          for (const [k, val] of Object.entries(v)) {
            if (k.startsWith("c_")) { if (val) colors[k.slice(2)] = rgb2hex(val); else delete colors[k.slice(2)]; continue; }
            if (val === "" || val === undefined || val === null) delete out[k]; else out[k] = val;
          }
          if (Object.keys(colors).length) out.colors = colors; else delete out.colors;
          if (!out.show_details) delete out.show_details;
          if (out.show_progress !== false) delete out.show_progress;
          if (out.show_settings !== false) delete out.show_settings;
          if (out.background === "always") delete out.background;
          if (out.color_mode === "tempo") delete out.color_mode;
          this._config = out;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: out }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      const c = this._config, d = { show_details: false, show_progress: true, show_settings: true, background: "always", color_mode: "tempo", ...c };
      for (const [k, v] of Object.entries(c.colors || {})) d["c_" + k] = hex2rgb(v);
      delete d.colors;
      this._form.hass = this._hass;
      this._form.data = d;
    }
  }

  if (!customElements.get("holm-tarif-card")) customElements.define("holm-tarif-card", HolmTarifCard);
  if (!customElements.get("holm-tarif-card-editor")) customElements.define("holm-tarif-card-editor", HolmTarifCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-tarif-card"))
    setLang(document.querySelector("home-assistant")?.hass);
    window.customCards.push({ type: "holm-tarif-card", name: "HOLM HP/HC", description: _("Heures creuses / heures pleines : période, tarif en cours, prochaine bascule, tarifs et réglages."), preview: true });
  console.info(`%c HOLM-HP/HC %c ${VERSION} `, "background:#2e7d32;color:#fff;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();
