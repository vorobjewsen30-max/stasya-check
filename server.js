const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Файл для хранения данных
const DATA_FILE = path.join(__dirname, 'data.json');
const VERIFICATION_CODE = 'STASYADOGGER';

// Загрузка данных из файла
function loadChannels() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    
    // Возвращаем данные по умолчанию если файла нет
    return [
        { id: 1, name: "Официальный канал Telegram", url: "@telegram", category: "news", official: true },
        { id: 2, name: "Stasya Games", url: "@stasya_games", category: "news", official: true },
        { id: 3, name: "Фотографии Стаси", url: "@postistasi", category: "other", official: true },
    ];
}

// Сохранение данных в файл
function saveChannels(channels) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(channels, null, 2));
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Инициализация данных
let channels = loadChannels();

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.get('/api/check/:username', (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        console.log('Checking channel:', username);
        
        const channel = channels.find(c => {
            const channelUsername = c.url.startsWith('@') ? c.url.substring(1).toLowerCase() : c.url.toLowerCase();
            return channelUsername === username;
        });
        
        if (channel) {
            console.log('Channel found:', channel.name);
            res.json({
                id: channel.id,
                name: channel.name,
                url: channel.url,
                official: channel.official,
                category: channel.category
            });
        } else {
            console.log('Channel not found:', username);
            res.status(404).json({
                message: 'Канал не найден в базе данных'
            });
        }
    } catch (error) {
        console.error('Error in /api/check:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.get('/api/channels', (req, res) => {
    try {
        console.log('Fetching all channels');
        res.json(channels);
    } catch (error) {
        console.error('Error in /api/channels:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/channels', (req, res) => {
    try {
        console.log('Adding channel:', req.body);
        const { name, url, category, official = false, verificationCode } = req.body;
        
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
        
        // Проверяем код подтверждения
        let isOfficial = false;
        if (verificationCode && verificationCode === VERIFICATION_CODE) {
            isOfficial = true;
            console.log('Channel verified as official');
        }
        
        // Создаем новый канал
        const newChannel = {
            id: channels.length > 0 ? Math.max(...channels.map(c => c.id)) + 1 : 1,
            name: name,
            url: url,
            category: category || 'other',
            official: isOfficial,
            createdAt: new Date().toISOString()
        };
        
        channels.push(newChannel);
        saveChannels(channels); // Сохраняем в файл
        console.log('Channel added successfully:', newChannel);
        
        res.status(201).json(newChannel);
    } catch (error) {
        console.error('Error in /api/channels POST:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

// Получить информацию о верификации (для админа)
app.get('/api/admin/info', (req, res) => {
    res.json({
        totalChannels: channels.length,
        officialChannels: channels.filter(c => c.official).length,
        verificationInstructions: "Для верификации канала свяжитесь с администратором"
    });
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступен по адресу: http://0.0.0.0:${PORT}`);
    console.log(`Всего каналов в базе: ${channels.length}`);
});
