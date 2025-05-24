# 📖 Bíblia API

Uma API simples construída com Node.js e SQLite para acessar textos bíblicos.

## 🚀 Executando com Docker

### Usando imagem do Docker Hub:

```bash
docker run -p 3000:3000 edilsonss123/bible-api
```

## 🚀 Executando Localmente

```bash
npm install
node index.js
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📘 Endpoints da API

### 🔹 `GET /next-verse/:id`

Retorna o versículo com `id` informado e os próximos, dependendo da configuração.

#### Parâmetros:
- `id`: número do versículo
- `findEnd`: `true` para buscar até o ponto final ou limite de 150 caracteres

#### Exemplo:
```http
GET /next-verse/1?findEnd=true
```

#### Resposta:
```json
{
  "book": "Gênesis",
  "chapter": 1,
  "chapterVerseRange": "1:1-3",
  "verses": [
    { "verse": 1, "text": "No princípio criou Deus..." },
    ...
  ],
  "nextId": 4
}
```

---

### 🔹 `GET /verses/:book/:chapter/:range`

Busca um ou mais versículos a partir do nome do livro, capítulo e intervalo.

#### Parâmetros:
- `book`: nome do livro (ex: `Genesis`, `lucas`)
- `chapter`: número do capítulo
- `range`: intervalo de versículos (`1`, `1-5`)

#### ❗ Intervalos incompletos como `3-` são **inválidos**.

#### Exemplos válidos:
```http
GET /verses/Gênesis/1/1
GET /verses/Lucas/1/1-5
```

#### Resposta:
```json
{
  "book": "Lucas",
  "chapter": 1,
  "verseRange": "1-5",
  "verses": [
    {
      "id": 1,
      "book": "Lucas",
      "chapter": 1,
      "verse": 1,
      "text": "Havendo muitos empreendido..."
    },
    ...
  ]
}
```

---

## 📝 Licença

MIT