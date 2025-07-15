import { Folder } from '../models/folder.js';
import { ServerError } from '../helpers/serverError.js';
import { Op } from 'sequelize';

export class FolderService {
    /**
     * Create a new folder, checking if there's not another one with same name in the same parent
     * @param {string} [name='New Folder'] - folder name 
     * @param {string|null} [parentId=null] - parent uuid folder, default null (root folder)
     * @returns {Promise<Folder>} created folder model
     * @throws {ServerError} If the name is the same of another folder in the same parent
     */
    async create(name = 'New Folder', parentId = null) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new ServerError('Folder name cannot be empty', 400);
        }

        // Check if parent exists (if provided)
        if (parentId) {
            const parentExists = await Folder.findByPk(parentId);
            if (!parentExists) {
                throw new ServerError('Parent folder not found', 404);
            }
        }

        // Check for duplicate name in the same parent
        const existingFolder = await Folder.findOne({
            where: {
                name,
                parentId
            }
        });

        if (existingFolder) {
            throw new ServerError(`A folder with name '${name}' already exists in this location`, 409);
        }

        try {
            const folder = await Folder.create({
                name,
                parentId
            });

            return folder;
        } catch (error) {
            throw new ServerError(`Failed to create folder: ${error.message}`, 500);
        }
    }

    /**
     * Get folder by ID
     * @param {string} folderId - Folder UUID
     * @returns {Promise<Folder>} The requested folder
     * @throws {ServerError} If folder not found
     */
    async get(folderId) {
        if (!folderId) {
            throw new ServerError('Folder ID is required', 400);
        }

        try {
            const folder = await Folder.findByPk(folderId);
            
            if (!folder) {
                throw new ServerError('Folder not found', 404);
            }

            return folder;
        } catch (error) {
            if (error instanceof ServerError) throw error;
            throw new ServerError(`Failed to retrieve folder: ${error.message}`, 500);
        }
    }

    /**
     * Update folder name/parent
     * @param {string} folderId - Folder UUID to update
     * @param {object} updates - Object with updates
     * @param {string} [updates.name] - New folder name
     * @param {string|null} [updates.parentId] - New parent folder ID
     * @returns {Promise<Folder>} Updated folder
     * @throws {ServerError} If folder not found or update would create a duplicate
     */
    async update(folderId, { name, parentId }) {
        if (!folderId) {
            throw new ServerError('Folder ID is required', 400);
        }

        try {
            const folder = await this.get(folderId);

            // Check for circular reference (new parent is a descendant of this folder)
            if (parentId && parentId !== folder.parentId) {
                if (parentId === folderId) {
                    throw new ServerError('A folder cannot be its own parent', 400);
                }

                let currentParentId = parentId;
                while (currentParentId) {
                    const currentParent = await Folder.findByPk(currentParentId);
                    if (!currentParent) break;
                    
                    if (currentParent.id === folderId) {
                        throw new ServerError('Circular folder reference detected', 400);
                    }
                    currentParentId = currentParent.parentId;
                }
            }

            // Check for duplicate name if name or parent is being changed
            if (name || (parentId !== undefined && parentId !== folder.parentId)) {
                const newName = name || folder.name;
                const newParentId = parentId !== undefined ? parentId : folder.parentId;

                const existingFolder = await Folder.findOne({
                    where: {
                        name: newName,
                        parentId: newParentId,
                        id: { [Op.not]: folderId } // Exclude current folder
                    }
                });

                if (existingFolder) {
                    throw new ServerError(`A folder with name '${newName}' already exists in this location`, 409);
                }
            }

            // Apply updates
            if (name !== undefined) folder.name = name;
            if (parentId !== undefined) folder.parentId = parentId;

            await folder.save();
            return folder;
        } catch (error) {
            if (error instanceof ServerError) throw error;
            throw new ServerError(`Failed to update folder: ${error.message}`, 500);
        }
    }

    /**
     * Delete a folder and optionally its contents
     * @param {string} folderId - Folder UUID to delete
     * @returns {Promise<void>}
     * @throws {ServerError} If folder not found or not empty when recursive=false
     */
    async delete(folderId) {
        if (!folderId) {
            throw new ServerError('Folder ID is required', 400);
        }

        try {
            await Folder.destroy({ where: { id: folderId } });
        } catch (error) {
            if (error instanceof ServerError) throw error;
            throw new ServerError(`Failed to delete folder: ${error.message}`, 500);
        }
    }

    /**
     * List folders within a parent folder
     * @param {string|null} [parentId=null] - Parent folder ID (null for root)
     * @returns {Promise<Folder[]>} Array of child folders
     */
    async list(parentId = null) {
        try {
            return await Folder.findAll({
                where: { parentId },
                order: [['name', 'ASC']]
            });
        } catch (error) {
            throw new ServerError(`Failed to list folders: ${error.message}`, 500);
        }
    }

    /**
     * Get the full path of a folder as an array of folders
     * @param {string} folderId - Starting folder ID
     * @returns {Promise<Folder[]>} Array of folders from root to the specified folder
     * @throws {ServerError} If folder not found
     */
    async getPath(folderId) {
        const path = [];
        let currentId = folderId;

        try {
            while (currentId) {
                const folder = await Folder.findByPk(currentId);
                if (!folder) break;

                path.unshift(folder);
                currentId = folder.parentId;
            }

            if (path.length === 0) {
                throw new ServerError('Folder not found', 404);
            }

            return path;
        } catch (error) {
            if (error instanceof ServerError) throw error;
            throw new ServerError(`Failed to get folder path: ${error.message}`, 500);
        }
    }
}