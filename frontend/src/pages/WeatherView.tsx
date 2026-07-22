// Lisää importtiin:
//   import { useTranslation } from 'react-i18next';
// Komponentin sisällä:
//   const { t } = useTranslation();
//
// Korvaukset:
//   <Alert ...>Ei säädataa saatavilla.</Alert>
//     → <Alert ...>{t('noWeatherAvailable')}</Alert>
//
//   label="Keskilämpötila"        → label={t('avgTemp')}
//   label="Lämpötila max"         → label={t('maxTemp')}
//   label="Lämpötila min"         → label={t('minTemp')}
//   label="Sademäärä"             → label={t('precipitation')}
//   label="Auringonsäteily"       → label={t('radiation')}
//   label="Evapotranspiraatio (ET₀)" → label={t('et0')}
//   label="Kosteus"               → label={t('humidity')}
//   label="Tuuli max"             → label={t('maxWind')}
