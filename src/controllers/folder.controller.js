import { asyncHandler } from "../helpers/asyncHandler.js";
import { FolderService } from "../services/folder.service.js";
import { ServerError } from "../helpers/serverError.js";
import { Validator } from "../validator/validator.js";

export class FolderController {
    constructor() {
        this.service = new FolderService();
    }

    /**
     * Create a new folder
     * @param {Object} req - Express request
     * @param {Object} req.body - Request body
     * @param {string} [req.body.name] - Folder name (default: 'New Folder')
     * @param {string} [req.body.parentId] - Parent folder ID (default: null for root)
     * @param {Object} res - Express response
     */
    create = asyncHandler(async (req, res) => {
        Validator.of(req.body.name, "name")
            .optional()
            .string()
            .max(100)
            .nonEmpty();

        Validator.of(req.body.parentId, "parentId")
            .optional()
            .uuid();

        const { name = 'New Folder', parentId = null } = req.body;

        const folder = await this.service.create(name, parentId);
        res.status(201).json({ id: folder.id, name: folder.name });
    });

    /**
     * Get folder details by ID
     * @param {Object} req - Express request
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.id - Folder ID
     * @param {Object} res - Express response
     */
    get = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id")
            .uuid();

        const folder = await this.service.get(req.params.id);
        res.json(folder);
    });

    /**
     * Update folder details
     * @param {Object} req - Express request
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.id - Folder ID to update
     * @param {Object} req.body - Request body
     * @param {string} [req.body.name] - New folder name
     * @param {string} [req.body.parentId] - New parent folder ID
     * @param {Object} res - Express response
     */
    update = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id")
            .uuid();

        Validator.of(req.body.name, "name")
            .optional()
            .string()
            .max(100)
            .nonEmpty();

        Validator.of(req.body.parentId, "parentId")
            .optional()
            .uuid();

        const updates = {};
        if (req.body.name !== undefined) updates.name = req.body.name;
        if (req.body.parentId !== undefined) updates.parentId = req.body.parentId;

        if (Object.keys(updates).length === 0) {
            throw new ServerError("No updates provided", 400);
        }

        const folder = await this.service.update(req.params.id, updates);
        res.json(folder);
    });

    /**
     * Delete a folder
     * @param {Object} req - Express request
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.id - Folder ID to delete
     * @param {Object} res - Express response
     */
    delete = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id")
            .uuid();

        await this.service.delete(req.params.id);
        res.status(204).send();
    });

    /**
     * List folders within a parent folder
     * @param {Object} req - Express request
     * @param {Object} req.query - Query parameters
     * @param {string} [req.query.parentId] - Parent folder ID (null for root)
     * @param {Object} res - Express response
     */
    list = asyncHandler(async (req, res) => {
        Validator.of(req.query.parentId, "parentId")
            .optional()
            .uuid();

        const parentId = req.query.parentId || null;
        const folders = await this.service.list(parentId);
        res.json(folders);
    });

    /**
     * Get folder path (breadcrumb)
     * @param {Object} req - Express request
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.id - Folder ID
     * @param {Object} res - Express response
     */
    getPath = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id")
            .uuid();

        const path = await this.service.getPath(req.params.id);
        res.json({
            path: "/" + path.map(folder => folder.name).join('/'),
            folders: path
        });
    });
}