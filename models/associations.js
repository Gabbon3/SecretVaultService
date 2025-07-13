import './client.js';
import { Secret } from './secret.js';
import { DEK } from './dek.js';

DEK.hasMany(Secret, {
    foreignKey: 'dekId',
});

Secret.belongsTo(DEK, {
    foreignKey: 'dekId',
})