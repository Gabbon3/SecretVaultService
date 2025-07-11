import { Sequelize } from 'sequelize';
import { Config } from '../config.js';

export const database = new Sequelize(
    Config.DB_NAME,
    Config.DB_USER,
    Config.DB_PASSWORD,
    {
        host: Config.DB_HOST,
        dialect: 'postgres',
        dialectOptions: {
            useUTC: true,
        },
        logging: false,
        timezone: '+00:00'
    }
);