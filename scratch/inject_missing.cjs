const fs = require('fs');

const esAdditions = {
  "statsDisabledMsg": { "message": "Las estadísticas locales están desactivadas. Habilita la opción en Privacidad para ver tus sitios más usados." },
  "enableInPrivacy": { "message": "Habilitar en Privacidad" },
  "showViewButtonTitle": { "message": "Mostrar botón de Vista" },
  "showViewButtonDesc": { "message": "Muestra el botón para cambiar el modo de vista de la carpeta." },
  "showSortButtonTitle": { "message": "Mostrar botón de Ordenar" },
  "showSortButtonDesc": { "message": "Muestra el botón para ordenar los marcadores de la carpeta." }
};

const enAdditions = {
  "statsDisabledMsg": { "message": "Local statistics are disabled. Enable this option in Privacy to see your most used sites." },
  "enableInPrivacy": { "message": "Enable in Privacy" },
  "showViewButtonTitle": { "message": "Show View button" },
  "showViewButtonDesc": { "message": "Shows the button to change the folder's view mode." },
  "showSortButtonTitle": { "message": "Show Sort button" },
  "showSortButtonDesc": { "message": "Shows the button to sort the bookmarks in the folder." }
};

const ruAdditions = {
  "statsDisabledMsg": { "message": "Локальная статистика отключена. Включите эту опцию в разделе Конфиденциальность, чтобы видеть ваши самые посещаемые сайты." },
  "enableInPrivacy": { "message": "Включить в Конфиденциальности" },
  "showViewButtonTitle": { "message": "Показывать кнопку Вид" },
  "showViewButtonDesc": { "message": "Отображает кнопку для изменения режима просмотра папки." },
  "showSortButtonTitle": { "message": "Показывать кнопку Сортировка" },
  "showSortButtonDesc": { "message": "Отображает кнопку для сортировки закладок в папке." }
};

function inject(lang, additions) {
  const path = `./src/_locales/${lang}/messages.json`;
  const m = JSON.parse(fs.readFileSync(path, 'utf8'));
  Object.assign(m, additions);
  fs.writeFileSync(path, JSON.stringify(m, null, 2), 'utf8');
}

inject('es', esAdditions);
inject('en', enAdditions);
inject('ru', ruAdditions);

console.log("Done");
