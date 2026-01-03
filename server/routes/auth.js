import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
    const existingUser = await User.findOne({ where: { name: req.body.name } });
    if (existingUser) return res.status(400).json({ error: 'این نام کاربری قبلا ثبت شده است.' });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;