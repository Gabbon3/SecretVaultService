import './client.js';
import { Secret } from './secret.js';
import { DEK } from './dek.js';
import { Folder } from './folder.js';

// Una DEK cifra n segreti

DEK.hasMany(Secret, {
    foreignKey: 'dekId',
});

Secret.belongsTo(DEK, {
    foreignKey: 'dekId',
});

// Una cartella potrebbe avere n cartelle

Folder.hasMany(Folder, {
    foreignKey: 'parentId',
    onDelete: 'CASCADE'
});

Folder.belongsTo(Folder, {
    foreignKey: 'parentId',
    onDelete: 'CASCADE'
});

// Una cartella ha n segreti

Folder.hasMany(Secret, {
    foreignKey: 'folderId',
    onDelete: 'CASCADE',
});

Secret.belongsTo(Folder, {
    foreignKey: 'folderId',
    onDelete: 'CASCADE'
});