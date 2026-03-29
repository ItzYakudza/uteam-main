require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Game = require('./src/models/Game');
    const count = await Game.countDocuments();
    console.log('Total games count:', count);
    
    const games = await Game.find({}).lean();
    
    console.log('\n=== GAMES IN DATABASE ===\n');
    if (games.length === 0) {
        console.log('NO GAMES FOUND!');
    }
    games.forEach(game => {
        console.log('Title:', game.title);
        console.log('Status:', game.status);
        console.log('Archive:', game.gameArchive);
        console.log('External URL:', game.externalDownloadUrl || 'none');
        console.log('Cover:', game.coverImage);
        console.log('Icon:', game.gameIcon || 'none');
        console.log('---');
    });
    
    await mongoose.disconnect();
}

main().catch(console.error);
