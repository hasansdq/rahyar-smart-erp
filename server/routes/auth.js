import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { User } from '../models.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { name: username } });
    if (!user) return res.status(400).json({ message: 'کاربری با این نام یافت نشد.' });

    const validPass = password === user.password || await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: 'رمز عبور اشتباه است.' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    // 1. Check Username Uniqueness
    const existingUser = await User.findOne({ where: { name: req.body.name } });
    if (existingUser) return res.status(400).json({ error: 'این نام کاربری قبلا ثبت شده است.' });

    // 2. Check Phone Number Uniqueness
    if (req.body.phoneNumber) {
        const existingPhone = await User.findOne({ where: { phoneNumber: req.body.phoneNumber } });
        if (existingPhone) return res.status(400).json({ error: 'این شماره تلفن قبلا ثبت شده است.' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    
    // 3. Create User with Server-Generated ID
    // We explicitly overwrite 'id' to ignore any empty string sent from client
    const user = await User.create({ 
        ...req.body, 
        id: randomUUID(),
        password: hashedPassword 
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e) {
    // Handle Sequelize specific validation errors
    if (e.name === 'SequelizeUniqueConstraintError') {
        const field = e.errors[0]?.path === 'phoneNumber' ? 'شماره تلفن' : 'نام کاربری';
        return res.status(400).json({ error: `${field} تکراری است.` });
    }
    if (e.name === 'SequelizeValidationError') {
        return res.status(400).json({ error: 'خطای اعتبارسنجی داده‌ها: ' + e.message });
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;