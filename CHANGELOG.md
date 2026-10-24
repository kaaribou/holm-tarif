# Changelog

## 1.1.0
- **Option Tempo (EDF)** ([#1](https://github.com/kaaribou/holm-tarif/issues/1)) : option tarifaire *Tempo* à côté de *Heures creuses / heures pleines*.
  - Couleur du jour et de demain : `sensor.tempo_couleur_aujourdhui` / `sensor.tempo_couleur_demain`, d'après l'intégration RTE Tempo (trouvée automatiquement) ou l'entité de votre choix ; dernière couleur connue conservée si la source est indisponible.
  - 6 prix Tempo (`number.tarif_prix_bleu_hc` … `number.tarif_prix_rouge_hp`), réglables dans Home Assistant et dans la carte.
  - `sensor.tarif_actuel` = prix de la couleur et de la période en cours (même entity_id : historique et tableau Énergie conservés) ; attribut `couleur` et évènement `holm_tarif_changement` au changement de couleur.
  - Carte HOLM HP/HC : couleur du jour et de demain, couleur de la carte selon le jour (`color_mode`), prix par couleur dans les détails et les réglages.
- Sans l'option Tempo, rien ne change ; en la désactivant, ses entités sont retirées.

## 1.0.0
Première version.

- **Heures creuses / heures pleines** à partir de vos plages horaires (plusieurs plages, y compris à cheval sur minuit), ou de la période donnée par votre compteur Linky.
- **Prix, taxes et abonnement portés par l'intégration** (entités `number.tarif_…`), saisis à l'installation ; les entrées existantes peuvent être reliées et restent synchronisées dans les deux sens.
- Entités : `binary_sensor.heures_creuses`, `sensor.mode_heure`, `sensor.tarif_actuel`, `sensor.prochain_changement_de_mode`, `sensor.prochaine_bascule`, `sensor.abonnement_par_jour`, et l'évènement `holm_tarif_changement` à chaque bascule.
- Reprise des anciens capteurs modèles sous le même nom (historique conservé).
- **Carte HOLM HP/HC** : période en cours (vert / orange, fond coloré au choix), tarif, prochaine bascule avec barre d'avancement, tarifs et abonnement, et partie **Réglages** (plages et prix, administrateurs).
