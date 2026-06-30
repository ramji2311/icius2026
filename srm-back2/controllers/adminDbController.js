import {
    getAdminModel,
    listAdminCollectionsMeta,
    isValidObjectIdString
} from '../config/adminDbRegistry.js';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/** GET /api/admin/db/meta */
export const getDbMeta = async (req, res) => {
    try {
        const collections = listAdminCollectionsMeta();
        const counts = await Promise.all(
            collections.map(async ({ key, label }) => {
                const Model = getAdminModel(key);
                const count = await Model.countDocuments();
                return { key, label, count };
            })
        );
        return res.json({ success: true, collections: counts });
    } catch (error) {
        console.error('adminDb getDbMeta:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to load database meta'
        });
    }
};

/** GET /api/admin/db/:collectionKey */
export const listDocuments = async (req, res) => {
    try {
        const { collectionKey } = req.params;
        const Model = getAdminModel(collectionKey);
        if (!Model) {
            return res.status(404).json({ success: false, message: 'Unknown collection' });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        let limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;
        const skip = (page - 1) * limit;

        const sortField = req.query.sort === 'createdAt' ? 'createdAt' : 'updatedAt';
        const sortDir = req.query.order === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortDir };

        const [total, documents] = await Promise.all([
            Model.countDocuments({}),
            Model.find({}).sort(sort).skip(skip).limit(limit).lean()
        ]);

        return res.json({
            success: true,
            collectionKey,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
            documents
        });
    } catch (error) {
        console.error('adminDb listDocuments:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to list documents'
        });
    }
};

/** GET /api/admin/db/:collectionKey/:id */
export const getDocument = async (req, res) => {
    try {
        const { collectionKey, id } = req.params;
        const Model = getAdminModel(collectionKey);
        if (!Model) {
            return res.status(404).json({ success: false, message: 'Unknown collection' });
        }
        if (!isValidObjectIdString(id)) {
            return res.status(400).json({ success: false, message: 'Invalid id' });
        }

        const doc = await Model.findById(id).lean();
        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        return res.json({ success: true, document: doc });
    } catch (error) {
        console.error('adminDb getDocument:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get document'
        });
    }
};

function sanitizePayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {};
    }
    const o = { ...body };
    delete o._id;
    delete o.__v;
    return o;
}

/** POST /api/admin/db/:collectionKey */
export const createDocument = async (req, res) => {
    try {
        const { collectionKey } = req.params;
        const Model = getAdminModel(collectionKey);
        if (!Model) {
            return res.status(404).json({ success: false, message: 'Unknown collection' });
        }

        const payload = sanitizePayload(req.body);
        const doc = await Model.create(payload);
        return res.status(201).json({ success: true, document: doc.toObject() });
    } catch (error) {
        console.error('adminDb createDocument:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Create failed'
        });
    }
};

/** PUT /api/admin/db/:collectionKey/:id */
export const updateDocument = async (req, res) => {
    try {
        const { collectionKey, id } = req.params;
        const Model = getAdminModel(collectionKey);
        if (!Model) {
            return res.status(404).json({ success: false, message: 'Unknown collection' });
        }
        if (!isValidObjectIdString(id)) {
            return res.status(400).json({ success: false, message: 'Invalid id' });
        }

        const payload = sanitizePayload(req.body);

        // Use $set so only supplied fields are changed (no full-document replace).
        // runValidators: false lets admins patch individual fields without
        // triggering conditional validators (e.g. required password when isGoogleAuth
        // or null enum fields like userType).
        const doc = await Model.findByIdAndUpdate(
            id,
            { $set: payload },
            { new: true, runValidators: false }
        ).lean();

        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        return res.json({ success: true, document: doc });
    } catch (error) {
        console.error('adminDb updateDocument:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Update failed'
        });
    }
};

/** DELETE /api/admin/db/:collectionKey/:id */
export const deleteDocument = async (req, res) => {
    try {
        const { collectionKey, id } = req.params;
        const Model = getAdminModel(collectionKey);
        if (!Model) {
            return res.status(404).json({ success: false, message: 'Unknown collection' });
        }
        if (!isValidObjectIdString(id)) {
            return res.status(400).json({ success: false, message: 'Invalid id' });
        }

        if (collectionKey === 'users') {
            const existing = await Model.findById(id).lean();
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }
            if (existing.role === 'Admin') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete Admin user documents from the database browser.'
                });
            }
            const actorId = req.user?.userId != null ? String(req.user.userId) : null;
            if (actorId && String(existing._id) === actorId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account from the database browser.'
                });
            }
        }

        const doc = await Model.findByIdAndDelete(id).lean();
        if (!doc) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        return res.json({ success: true, deleted: doc });
    } catch (error) {
        console.error('adminDb deleteDocument:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Delete failed'
        });
    }
};
