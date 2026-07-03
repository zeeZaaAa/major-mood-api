import mongoose from 'mongoose';
import crypto from 'crypto';

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    tokenHash: {
        type: String,
        required: [true, 'Token hash is required'],
        unique: true
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    userAgent: {
        type: String,
        trim: true
    },
    ipAddress: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'refresh_token'
});


refreshTokenSchema.index({ userId: 1 });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hashToken = function (plainToken) {
    return crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');
};

export default mongoose.model('RefreshToken', refreshTokenSchema);