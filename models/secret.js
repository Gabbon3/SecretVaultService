import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";
import { database } from "../data/database.js";

export const Secret = database.define(
    "Secret",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv7(),
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        lastRotation: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "Data ultima rotazione DEK",
        },
        dekId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: "Versione DEK usata per cifrare",
        },
        folderId: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
            comment: "Se null allora fa parte della cartella root"
        },
        data: {
            type: DataTypes.BLOB,
            allowNull: false,
            comment: "Questi dati sono cifrati",
        },
    },
    {
        tableName: "secret",
        timestamps: true,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    }
);
