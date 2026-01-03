
import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { KnowledgeFile } from '../models.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        // Fix for Persian filenames: Decode the originalname from latin1 to utf8
        // Multer often treats header bytes as Latin1 by default, garbling UTF-8 characters
        const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        let content = '';
        const buffer = req.file.buffer;
        
        // Simple text extraction
        if (req.file.mimetype === 'application/pdf') {
            try {
                const data = await pdf(buffer);
                content = data.text;
            } catch (err) {
                console.error('PDF Parse Error:', err);
                content = "Could not extract text from PDF.";
            }
        } else if (req.file.mimetype.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            content = buffer.toString('utf-8');
        } else {
            content = `[Binary File: ${fileName}]`;
        }

        // Limit content size for DB to avoid errors if not LONGTEXT
        if(content.length > 50000) content = content.substring(0, 50000) + '... (truncated)';

        const newFile = await KnowledgeFile.create({
            id: Math.random().toString(36).substr(2, 9),
            name: fileName,
            size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toLocaleDateString('fa-IR'),
            content: content
        });

        res.json({
            id: newFile.id,
            name: newFile.name,
            size: newFile.size,
            uploadDate: newFile.uploadDate
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await KnowledgeFile.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
