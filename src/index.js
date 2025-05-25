const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

const db = new sqlite3.Database("./bible.db", err => {
    if (err) {
        console.error("Erro ao abrir o banco:", err.message);
    } else {
        console.log("Banco SQLite conectado.");
    }
});

function getVerseById(id) {
    const query = `
        SELECT v.id, b.name AS book, v.chapter, v.verse, v.text
        FROM verse v
        JOIN book b ON v.book_id = b.id
        WHERE v.id = ?`;

    return new Promise((resolve, reject) => {
        db.get(query, [id], (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

async function getNextVerseSimple(currentId) {
    const nextVerse = await getVerseById(currentId + 1);
    if (!nextVerse) {
        throw new Error("Próximo versículo não encontrado");
    }
    return nextVerse;
}

async function getNextVersesUntilEndOrLimit(currentId, initialChapter) {
    let nextId = currentId + 1;
    const verses = [];
    let totalLength = 0;

    while (true) {
        const verse = await getVerseById(nextId);

        if (!verse) {
            if (verses.length === 0) {
                throw new Error("Nenhum versículo encontrado a partir do ID informado.");
            }
            break;
        }

        if (verse.chapter !== initialChapter) break;

        verses.push(verse);
        totalLength += verse.text.trim().length;

        if (verse.text.trim().endsWith(".")) break;

        nextId++;
    }

    return verses;
}

function buildRangeResponse(initialVerse, verses) {
    const first = initialVerse;
    const last = verses.length ? verses[verses.length - 1] : initialVerse;
    const versiculo = first.verse == last.verse ? first.verse: `${first.verse}-${last.verse}`
    const range = `${first.chapter}:${versiculo}`;
    const nextId = last.id + 1;

    return {
        book: first.book,
        chapter: first.chapter,
        chapterVerseRange: range,
        verses: verses.map(v => ({
            verse: v.verse,
            text: v.text
        })),
        nextId
    };
}

app.get("/:id", async (req, res) => {
    const currentId = Number(req.params.id);
    const findEnd = req.query.findEnd === "true";

    if (Number.isNaN(currentId) || currentId <= 0) {
        return res.status(400).json({ error: "ID inválido" });
    }

    try {
        const initialVerse = await getVerseById(currentId);
        if (!initialVerse) {
            return res.status(404).json({ error: "Versículo inicial não encontrado" });
        }

        let verses = [initialVerse];
        
        if (findEnd) {
            verses = await getNextVersesUntilEndOrLimit(currentId, initialVerse.chapter);
        }
        res.json(buildRangeResponse(initialVerse, verses));
    } catch (error) {
        const statusCode = error.message.includes("não encontrado") ? 404 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

app.get("/verses/:book/:chapter/:range", async (req, res) => {
    const bookName = req.params.book.toLowerCase().trim();
    const chapter = Number(req.params.chapter);
    const range = req.params.range.trim();

    if (!bookName || Number.isNaN(chapter) || !range) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    let verseStart, verseEnd;

    if (range.includes("-")) {
        const parts = range.split("-");
        if (parts.length !== 2) {
            return res.status(400).json({ error: "Range inválido, use formato versiculoStart-versiculoEnd (ex: 1-5)" });
        }
        verseStart = Number(parts[0]);
        verseEnd = Number(parts[1]);
    } else {
        verseStart = verseEnd = Number(range);
    }

    if (
        !bookName ||
        Number.isNaN(chapter) || chapter <= 0 ||
        Number.isNaN(verseStart) || verseStart <= 0 ||
        Number.isNaN(verseEnd) || verseEnd <= 0 ||
        verseEnd < verseStart
    ) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    try {
        const verses = await getVersesByBookChapterRange(bookName, chapter, verseStart, verseEnd);
        if (verses.length === 0) {
            return res.status(404).json({ error: "Versículos não encontrados" });
        }
        res.json({
            book: verses[0].book,
            chapter: chapter,
            verseRange: verseStart === verseEnd ? `${verseStart}` : `${verseStart}-${verseEnd}`,
            verses: verses
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Busca versículos pelo livro, capítulo e intervalo de versículos.
 */
function getVersesByBookChapterRange(bookName, chapter, verseStart, verseEnd) {
    const query = `
        SELECT v.id, b.name AS book, v.chapter, v.verse, v.text
        FROM verse v
        JOIN book b ON v.book_id = b.id
        WHERE LOWER(b.name) = ?
          AND v.chapter = ?
          AND v.verse BETWEEN ? AND ?
        ORDER BY v.verse`;

    return new Promise((resolve, reject) => {
        db.all(query, [bookName, chapter, verseStart, verseEnd], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});
