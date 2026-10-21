# Changelog

## 1.0.0
Première version.

- **Heures creuses / heures pleines** à partir de vos plages horaires (plusieurs plages, y compris à cheval sur minuit), ou de la période donnée par votre compteur Linky.
- **Prix, taxes et abonnement portés par l'intégration** (entités `number.tarif_…`), saisis à l'installation ; les entrées existantes peuvent être reliées et restent synchronisées dans les deux sens.
- Entités : `binary_sensor.heures_creuses`, `sensor.mode_heure`, `sensor.tarif_actuel`, `sensor.prochain_changement_de_mode`, `sensor.prochaine_bascule`, `sensor.abonnement_par_jour`, et l'évènement `holm_tarif_changement` à chaque bascule.
- Reprise des anciens capteurs modèles sous le même nom (historique conservé).
- **Carte HOLM HP/HC** : période en cours (vert / orange, fond coloré au choix), tarif, prochaine bascule avec barre d'avancement, tarifs et abonnement, et partie **Réglages** (plages et prix, administrateurs).
