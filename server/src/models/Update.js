/**
 * Update Model
 * Stores client application update information
 */

const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        unique: true
    },
    downloadUrl: {
        type: String,
        required: true
    },
    releaseNotes: {
        type: String,
        default: 'Bug fixes and performance improvements.'
    },
    mandatory: {
        type: Boolean,
        default: false
    },
    size: {
        type: Number,
        default: 0
    },
    isLatest: {
        type: Boolean,
        default: true
    },
    releaseDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// При создании новой версии, убираем isLatest у предыдущих
updateSchema.pre('save', async function(next) {
    if (this.isLatest) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isLatest: false }
        );
    }
    next();
});

module.exports = mongoose.model('Update', updateSchema);
