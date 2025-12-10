# Развертывание документации на GitHub Pages

## Автоматическая настройка

Документация автоматически собирается и публикуется при каждом пуше в `main` ветку.

### Шаг 1: Включить GitHub Pages

1. Зайди в Settings репозитория на GitHub
2. В меню слева выбери **Pages**
3. В разделе **Source** выбери:
   - Source: **GitHub Actions**

Всё! Больше ничего настраивать не нужно.

### Шаг 2: Запушить код

```bash
git add .
git commit -m "Add documentation"
git push
```

GitHub Actions автоматически:
1. Установит зависимости через Bun
2. Соберёт документацию (`bun run docs:build`)
3. Опубликует на GitHub Pages

Документация будет доступна по адресу:
```
https://yourusername.github.io/pools/
```

## Локальная разработка

### Запустить dev сервер

```bash
bun run docs:dev
```

Откроется на `http://localhost:5173`

### Собрать документацию

```bash
bun run docs:build
```

Результат будет в `docs/.vitepress/dist/`

### Посмотреть production версию

```bash
bun run docs:preview
```

## Структура документации

```
docs/
├── .vitepress/
│   └── config.ts          # Конфигурация VitePress
├── index.md               # Главная страница
├── guide/
│   ├── installation.md    # Установка
│   └── quick-start.md     # Быстрый старт
├── api/
│   ├── index.md           # Обзор API
│   ├── pool.md            # Pool API
│   ├── pool-query.md      # PoolQuery API
│   ├── pool-binder.md     # PoolBinder API
│   └── selectors.md       # Selectors API
└── examples/
    ├── index.md           # Обзор примеров
    ├── basic.md           # Базовый пример
    ├── proxy-pool.md      # Proxy pool
    ├── map-like.md        # Map-like usage
    └── game-service.md    # Game service
```

## Обновление документации

1. Отредактируй нужные `.md` файлы в `docs/`
2. Проверь локально: `bun run docs:dev`
3. Закоммить и запушить

GitHub Actions автоматически обновит сайт.

## Что использовано

- **VitePress** - современный генератор статических сайтов
- **GitHub Pages** - бесплатный хостинг от GitHub
- **GitHub Actions** - автоматическая сборка и деплой

## Настройка base URL

В файле `docs/.vitepress/config.ts`:

```typescript
export default defineConfig({
  base: '/pools/',  // Имя репозитория
  // ...
});
```

Если у тебя кастомный домен, поменяй на `/`.

## Кастомный домен (опционально)

1. Создай файл `docs/public/CNAME` с доменом:
   ```
   docs.example.com
   ```

2. Настрой DNS:
   ```
   docs  CNAME  yourusername.github.io
   ```

3. В GitHub Settings > Pages укажи свой домен

## Troubleshooting

### Ошибка 404 после публикации

Проверь `base` в `config.ts` - должно совпадать с именем репозитория.

### Не обновляется сайт

1. Проверь GitHub Actions: вкладка **Actions** в репозитории
2. Посмотри логи сборки
3. Проверь что GitHub Pages включен

### Локально всё работает, на GitHub Pages - нет

Проверь пути к ресурсам - они должны быть относительными или использовать `base`.
