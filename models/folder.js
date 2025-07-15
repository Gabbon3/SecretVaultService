import { DataTypes } from "sequelize";
import { v7 as uuidv7 } from "uuid";
import { database } from "../data/database.js";

export const Folder = database.define(
    "Folder",
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
        parentId: {
            type: DataTypes.UUID,
            allowNull: true,
            defaultValue: null,
            comment: "Null = cartella root"
        }
    },
    {
        tableName: "folder",
        timestamps: true,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    }
);
