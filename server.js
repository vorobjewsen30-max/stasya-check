const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Имитация базы данных (в реальном приложении используйте MongoDB, PostgreSQL и т.д.)
let channels = [
    { id: 1, name: "Официальный канал Telegram", url: "@telegram", category: "news", official: true },
    { id: 2, name: "Новости IT", url: "@it_news", category: "technology", official: false },
    { id: 3, name: "Мемы и юмор", url: "@memes", category: "entertainment", official: false },
    { id: 4, name: "Криптовалюты", url: "@crypto", category: "business", official: true },
    { id: 5, name: "Образовательный канал", url: "@education", category: "education", official: true }
];

// API Routes

// Проверка канала
app.get('/api/check/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    
    const channel = channels.find(c => {
        const channelUsername = c.url.startsWith('@') ? c.url.substring(1).toLowerCase() : c.url.toLowerCase();
        return channelUsername === username;
    });
    
    if (channel) {
        res.json({
            id: channel.id,
            name: channel.name,
            url: channel.url,
            official: channel.official,
            category: channel.category
        });
    } else {
        res.status(404).json({
            message: 'Канал не найден в базе данных'
        });
    }
});

// Получить все каналы
app.get('/api/channels', (req, res) => {
    res.json(channels);
});

// Добавить канал
app.post('/api/channels', (req, res) => {
    const { name, url, category, official = false } = req.body;
    
    if (!name || !url) {
        return res.status(400).json({
            message: 'Название и URL канала обязательны'
        });
    }
    
    // Проверяем, существует ли уже канал с таким URL
    if (channels.some(c => c.url.toLowerCase() === url.toLowerCase())) {
        return res.status(400).json({
            message: 'Канал с таким URL уже существует'
        });
    }
    
    // Создаем новый канал
    const newChannel = {
        id: channels.length > 0 ? Math.max(...channels.map(c => c.id)) + 1 : 1,
        name: name,
        url: url,
        category: category || 'other',
        official: official
    };
    
    channels.push(newChannel);
    
    res.status(201).json(newChannel);
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});