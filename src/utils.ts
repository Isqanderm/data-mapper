export type PathObject = { path: string };

type PathChunk = { type: 'key' | 'index' | 'array' | 'args_index'; part: string };

/**
 * Разбирает строковый путь в последовательность токенов:
 * — ключи (word),
 * — wildcard-массивы ([]),
 * — числовые индексы ([0]),
 * — аргументные индексы ($0).
 */
export function parsePath(path: string): PathChunk[] {
  const tokenRegex = /(\[\]|\[\d+\]|\$\d+|[a-zA-Z$_][\w$]*)/g;
  const parts = path.match(tokenRegex) || [];
  return parts.map(part => {
    if (part === '[]') {
      return { type: 'array', part };
    }
    if (/^\[\d+\]$/.test(part)) {
      return { type: 'index', part: part.slice(1, -1) };
    }
    if (/^\$\d+$/.test(part)) {
      return { type: 'args_index', part: part.slice(1) };
    }
    return { type: 'key', part };
  });
}

/**
 * Преобразует строковый путь в массив PathObject,
 * разделяя по wildcard-массиву '[]'.
 * Для ключей и индексов добавляет '?.' после первого сегмента.
 */
export function getValueByPath(path: string): PathObject[] {
  const chunks = parsePath(path);
  const result: PathObject[] = [];
  let currentPath = '';

  const pushCurrent = (): void => {
    if (currentPath) {
      result.push({ path: currentPath });
      currentPath = '';
    }
  };

  for (const chunk of chunks) {
    switch (chunk.type) {
      case 'array':
        // wildcard: завершить текущий сегмент
        pushCurrent();
        break;

      case 'key':
        // первый ключ без '?.', последующие — с опциональным связыванием
        currentPath = currentPath
          ? `${currentPath}?.${chunk.part}`
          : chunk.part;
        break;

      case 'index':
      case 'args_index':
        // числовой или аргументный индекс: первый раз без '?.', далее — с
        currentPath = currentPath
          ? `${currentPath}?.[${chunk.part}]`
          : `[${chunk.part}]`;
        break;
    }
  }

  // добавить остаток пути
  pushCurrent();

  return result;
}
