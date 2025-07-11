import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from 'uuid';
import { database } from "../data/database.js";

export const Secret = database.define(
    'Secret',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        data: {
            type: DataTypes.BLOB,
            allowNull: false,
            comment: "Questi dati sono cifrati"
        }
    },
    {
        tableName: 'secret',
        timestamps: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    }
);