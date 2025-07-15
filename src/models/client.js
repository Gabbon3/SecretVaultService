import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from 'uuid';
import { database } from "../data/database.js";

export const Client = database.define(
    'Client',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
            comment: "Client ID"
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: "Client name"
        },
        hashedSecret: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: "Hashed secret for the client"
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Indicates if the client is active"
        },
        roles: {
            type: DataTypes.STRING,
            defaultValue: '',
            comment: "Comma-separated roles for the client"
        },
        permissions: {
            type: DataTypes.STRING,
            defaultValue: '',
            comment: "Comma-separated permissions for the client"
        },
        lastUsedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "Last time the client was used"
        }
    },
    {
        tableName: 'client',
        timestamps: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            {
                fields: ['name'],
                unique: true
            },
            {
                fields: ['isActive']
            }
        ]
    }
);