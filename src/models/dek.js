import { DataTypes } from "sequelize";
import { database } from "../data/database.js";

export const DEK = database.define(
    'DEK',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        key: {
            type: DataTypes.BLOB,
            allowNull: false,
            comment: "la dek cifrata con la kek"
        },
        kekId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: "Identificatore della KEK usata per cifrare questa DEK",
            defaultValue: 'default' // Esempio: 'kek-v1', 'kek-v2'
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: "Versione della DEK per rotazione"
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: "Indica se la chiave è attiva"
        },
    },
    {
        tableName: 'dek',
        timestamps: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    }
);