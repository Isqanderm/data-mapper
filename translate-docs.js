#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Full sentence translations (must come before word translations)
const sentenceTranslations = {
  // Full sentences and phrases
  'The `om-data-mapper` validation module provides a high-performance, class-validator-compatible API for validating objects using decorators.': 'Модуль валидации `om-data-mapper` предоставляет высокопроизводительный API, совместимый с class-validator, для валидации объектов с использованием декораторов.',
  "It's designed as a **drop-in replacement** for `class-validator` with **10x better performance** through JIT compilation.": 'Он разработан как **прямая замена** для `class-validator` с **производительностью в 10 раз выше** благодаря JIT-компиляции.',
  'The `om-data-mapper` transformer module provides two powerful APIs for transforming objects:': 'Модуль трансформации `om-data-mapper` предоставляет два мощных API для трансформации объектов:',
  '**No additional dependencies required** - unlike class-validator, you don\'t need `reflect-metadata`.': '**Не требуются дополнительные зависимости** - в отличие от class-validator, вам не нужен `reflect-metadata`.',
  '**No additional dependencies required** - unlike class-transformer, you don\'t need `reflect-metadata`.': '**Не требуются дополнительные зависимости** - в отличие от class-transformer, вам не нужен `reflect-metadata`.',
  'Asynchronously validates an object.': 'Асинхронно валидирует объект.',
  'Synchronously validates an object.': 'Синхронно валидирует объект.',
  'Validates and throws an error if validation fails.': 'Валидирует и выбрасывает ошибку, если валидация не удалась.',
  'Validates an array of objects.': 'Валидирует массив объектов.',
  'Supports async custom validators.': 'Поддерживает асинхронные пользовательские валидаторы.',
  'Does not support async validators.': 'Не поддерживает асинхронные валидаторы.',
  'Synchronous version of': 'Синхронная версия',
  'Marks property as optional - skips validation if undefined.': 'Помечает свойство как необязательное - пропускает валидацию, если undefined.',
  'Checks if value is defined (not undefined).': 'Проверяет, определено ли значение (не undefined).',
  'Checks if value is not empty.': 'Проверяет, что значение не пустое.',
  'Class decorator that marks a class as a mapper.': 'Декоратор класса, который помечает класс как маппер.',
  'Maps a property from a source path.': 'Отображает свойство из исходного пути.',
  'Maps a property using a custom transformation function.': 'Отображает свойство с использованием пользовательской функции трансформации.',
  'Transforms the value after mapping.': 'Трансформирует значение после отображения.',
  'Sets a default value if the source value is undefined or null.': 'Устанавливает значение по умолчанию, если исходное значение undefined или null.',
  'Conditionally maps a property based on a condition function.': 'Условно отображает свойство на основе функции условия.',
  'Ignores the property during transformation.': 'Игнорирует свойство во время трансформации.',
  'Both APIs use JIT compilation for maximum performance.': 'Оба API используют JIT-компиляцию для максимальной производительности.',
  'Modern, high-performance API using TC39 Stage 3 decorators (Recommended)': 'Современный, высокопроизводительный API, использующий декораторы TC39 Stage 3 (Рекомендуется)',
  'Drop-in replacement for class-transformer with 10x better performance': 'Прямая замена для class-transformer с производительностью в 10 раз выше',
};

// Translation dictionary for consistent terminology
const translations = {
  // Common terms
  'Overview': 'Обзор',
  'Installation': 'Установка',
  'Quick Start': 'Быстрый старт',
  'Basic Example': 'Базовый пример',
  'Example': 'Пример',
  'Examples': 'Примеры',
  'Import Path': 'Путь импорта',
  'Usage': 'Использование',
  'User Guide': 'Руководство пользователя',
  'Available Decorators': 'Доступные декораторы',
  'Common Validators': 'Общие валидаторы',
  'String Validators': 'Валидаторы строк',
  'Number Validators': 'Валидаторы чисел',
  'Date Validators': 'Валидаторы дат',
  'Array Validators': 'Валидаторы массивов',
  'Type Validators': 'Валидаторы типов',
  'Custom Validators': 'Пользовательские валидаторы',
  'Validation Functions': 'Функции валидации',
  'Validation Options': 'Опции валидации',
  'Validation Groups': 'Группы валидации',
  'Nested Validation': 'Вложенная валидация',
  'Error Messages': 'Сообщения об ошибках',
  'Best Practices': 'Лучшие практики',
  'Migration Guide': 'Руководство по миграции',
  'Migration from class-validator': 'Миграция с class-validator',
  'Migration from class-transformer': 'Миграция с class-transformer',
  'Troubleshooting': 'Устранение неполадок',
  'Performance': 'Производительность',
  'Performance Tips': 'Советы по производительности',
  'Core Decorators': 'Основные декораторы',
  'Transformation Functions': 'Функции трансформации',
  'Common Patterns': 'Распространённые паттерны',
  'Advanced Usage': 'Продвинутое использование',
  'API Reference': 'Справочник API',
  'Decorator API': 'Decorator API',
  'Compatibility API': 'API совместимости',

  // Technical terms
  'validator': 'валидатор',
  'validators': 'валидаторы',
  'validation': 'валидация',
  'decorator': 'декоратор',
  'decorators': 'декораторы',
  'mapper': 'маппер',
  'mappers': 'мапперы',
  'transformer': 'трансформер',
  'transformers': 'трансформеры',
  'transformation': 'трансформация',
  'transformations': 'трансформации',
  'JIT compilation': 'JIT-компиляция',
  'compilation': 'компиляция',
  'compiler': 'компилятор',

  // Common phrases
  'No additional dependencies required': 'Не требуются дополнительные зависимости',
  'drop-in replacement': 'прямая замена',
  'high-performance': 'высокопроизводительный',
  'type-safe': 'типобезопасный',
  'Asynchronously validates': 'Асинхронно валидирует',
  'Synchronously validates': 'Синхронно валидирует',
  'Validates and throws': 'Валидирует и выбрасывает',
  'Validates an array': 'Валидирует массив',
  'Marks property as optional': 'Помечает свойство как необязательное',
  'Checks if value is': 'Проверяет, является ли значение',
  'Checks if value': 'Проверяет, является ли значение',
  'Returns': 'Возвращает',
  'Parameters': 'Параметры',
  'Options': 'Опции',
  'Default': 'По умолчанию',
  'Required': 'Обязательно',
  'Optional': 'Необязательно',
  'Note': 'Примечание',
  'Warning': 'Предупреждение',
  'Important': 'Важно',
  'Tip': 'Совет',

  // Sentences and phrases
  'Validation Module - User Guide': 'Модуль валидации - Руководство пользователя',
  'Transformer Module - User Guide': 'Модуль трансформации - Руководство пользователя',
  'provides a high-performance': 'предоставляет высокопроизводительный',
  'designed as a': 'разработан как',
  'with better performance': 'с лучшей производительностью',
  'through JIT compilation': 'через JIT-компиляцию',
  'using decorators': 'используя декораторы',
  'Class decorator that': 'Декоратор класса, который',
  'Property decorator that': 'Декоратор свойства, который',
  'Maps a property from': 'Отображает свойство из',
  'Maps a property using': 'Отображает свойство используя',
  'Transforms the value': 'Трансформирует значение',
  'Sets a default value': 'Устанавливает значение по умолчанию',
  'Conditionally maps': 'Условно отображает',
  'Ignores the property': 'Игнорирует свойство',
  'For nested objects': 'Для вложенных объектов',
  'For arrays': 'Для массивов',
  'Custom transformation': 'Пользовательская трансформация',
  'Simple mapping': 'Простое отображение',
  'Complex transformations': 'Сложные трансформации',
  'Nested transformations': 'Вложенные трансформации',
  'Array transformations': 'Трансформации массивов',
};

// Patterns for more complex translations
const patterns = [
  // Headers
  { regex: /^(#{1,6})\s+(.+)$/gm, translate: (match, hashes, text) => `${hashes} ${translateText(text)}` },

  // List items (preserve leading spaces/tabs)
  { regex: /^(\s*[-*+]|\s*\d+\.)\s+(.+)$/gm, translate: (match, bullet, text) => `${bullet} ${translateText(text)}` },
];

function translateText(text) {
  // Don't translate if it's inside code blocks or inline code
  if (text.includes('`')) {
    // Handle inline code - preserve code but translate surrounding text
    return text.replace(/([^`]+)|(`[^`]+`)/g, (match, plainText, code) => {
      if (code) return code; // Keep code unchanged
      return translatePlainText(plainText);
    });
  }

  return translatePlainText(text);
}

function translatePlainText(text) {
  if (!text) return text;

  let translated = text;

  // First, apply full sentence translations
  for (const [english, russian] of Object.entries(sentenceTranslations)) {
    if (translated.includes(english)) {
      translated = translated.replace(english, russian);
    }
  }

  // Then apply word/phrase translations from dictionary
  for (const [english, russian] of Object.entries(translations)) {
    // Case-sensitive replacement
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    translated = translated.replace(regex, russian);
  }

  // Additional context-aware translations
  translated = translated
    // Common sentence patterns
    .replace(/The `([^`]+)` (module|function|decorator|class)/g, (match, code, type) => {
      const typeMap = {
        'module': 'модуль',
        'function': 'функция',
        'decorator': 'декоратор',
        'class': 'класс'
      };
      return `${typeMap[type]} \`${code}\``;
    })
    .replace(/Supports? (async|synchronous) (validators?|operations?)/gi, (match, type, what) => {
      const typeMap = { 'async': 'асинхронные', 'synchronous': 'синхронные' };
      const whatMap = { 'validator': 'валидаторы', 'validators': 'валидаторы', 'operation': 'операции', 'operations': 'операции' };
      return `Поддерживает ${typeMap[type.toLowerCase()]} ${whatMap[what.toLowerCase()]}`;
    })
    .replace(/Does not support/gi, 'Не поддерживает')
    .replace(/If validation fails/gi, 'Если валидация не удалась')
    .replace(/Validation passed/gi, 'Валидация пройдена')
    .replace(/Validation failed/gi, 'Валидация не удалась')
    .replace(/must be/g, 'должно быть')
    .replace(/must have/g, 'должно иметь')
    .replace(/should be/g, 'должно быть')
    .replace(/can be/g, 'может быть')
    .replace(/will be/g, 'будет')
    .replace(/is required/g, 'обязательно')
    .replace(/is optional/g, 'необязательно')
    .replace(/For example/gi, 'Например')
    .replace(/Use this/gi, 'Используйте это')
    .replace(/Use when/gi, 'Использовать когда')
    .replace(/Recommended/gi, 'Рекомендуется')
    .replace(/Not recommended/gi, 'Не рекомендуется')
    .replace(/See also/gi, 'См. также')
    .replace(/Read more/gi, 'Подробнее')
    .replace(/Learn more/gi, 'Узнать больше')
    .replace(/Getting started/gi, 'Начало работы')
    .replace(/How to/gi, 'Как')
    .replace(/Step \d+/g, (match) => match.replace('Step', 'Шаг'))
    .replace(/Version/gi, 'Версия')
    .replace(/Features/gi, 'Возможности')
    .replace(/Benefits/gi, 'Преимущества')
    .replace(/Advantages/gi, 'Преимущества')
    .replace(/Limitations/gi, 'Ограничения')
    .replace(/Known issues/gi, 'Известные проблемы')
    .replace(/Common issues/gi, 'Распространённые проблемы')
    .replace(/Solutions/gi, 'Решения')
    .replace(/Workaround/gi, 'Обходной путь')
    .replace(/Configuration/gi, 'Конфигурация')
    .replace(/Setup/gi, 'Настройка')
    .replace(/Initialize/gi, 'Инициализировать')
    .replace(/Create/gi, 'Создать')
    .replace(/Define/gi, 'Определить')
    .replace(/Implement/gi, 'Реализовать')
    .replace(/Usage with/gi, 'Использование с')
    .replace(/Combining with/gi, 'Комбинирование с')
    .replace(/Works with/gi, 'Работает с')
    .replace(/Compatible with/gi, 'Совместим с')
    .replace(/Requires/gi, 'Требует')
    .replace(/Depends on/gi, 'Зависит от')
    .replace(/Based on/gi, 'Основан на')
    .replace(/Extends/gi, 'Расширяет')
    .replace(/Implements/gi, 'Реализует')
    .replace(/Inherits/gi, 'Наследует')
    .replace(/Overrides/gi, 'Переопределяет');

  return translated;
}

function translateMarkdown(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBlockContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block delimiters
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - add all code block lines unchanged
        result.push(...codeBlockContent);
        result.push(line);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        result.push(line);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Inside code block - check if line is a comment
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        // Translate comments
        codeBlockContent.push(line.replace(/(\/\/|#|\*)\s*(.+)/, (match, commentChar, text) => {
          return `${commentChar} ${translatePlainText(text)}`;
        }));
      } else {
        // Keep code unchanged
        codeBlockContent.push(line);
      }
      continue;
    }

    // Outside code block - translate
    if (line.trim() === '' || line.trim() === '---') {
      // Keep empty lines and horizontal rules
      result.push(line);
    } else {
      result.push(translateText(line));
    }
  }

  return result.join('\n');
}

function translateFile(inputPath, outputPath) {
  console.log(`Translating ${inputPath} -> ${outputPath}`);

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const translated = translateMarkdown(content);
    fs.writeFileSync(outputPath, translated, 'utf-8');
    console.log(`✅ Successfully translated ${path.basename(inputPath)}`);
  } catch (error) {
    console.error(`❌ Error translating ${inputPath}:`, error.message);
    throw error;
  }
}

// Main execution
const docsDir = path.join(__dirname, 'docs');
const docsRuDir = path.join(__dirname, 'docs-ru');

// Ensure docs-ru directory exists
if (!fs.existsSync(docsRuDir)) {
  fs.mkdirSync(docsRuDir, { recursive: true });
}

// Translate the remaining files
const filesToTranslate = [
  'validation-usage.md',
  'transformer-usage.md'
];

console.log('Starting translation of documentation files...\n');

for (const filename of filesToTranslate) {
  const inputPath = path.join(docsDir, filename);
  const outputPath = path.join(docsRuDir, filename);

  if (fs.existsSync(inputPath)) {
    translateFile(inputPath, outputPath);
  } else {
    console.error(`❌ File not found: ${inputPath}`);
  }
}

console.log('\n✅ Translation complete!');

