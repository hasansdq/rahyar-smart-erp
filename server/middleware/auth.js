import jwt from 'jsonwebtoken';

const JWT_SECRET = 'rahyar-secret-key-change-in-prod';

export const authenticateToken = (req, res, next) => {
  let token = null;
  
  // Robust Manual Cookie Parsing
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith('token=')) {
            token = trimmed.substring(6); // Get everything after 'token='
            break;
        }
    }
  }

  // Fallback to Bearer Header
  if (!token) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
      }
  }

  if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'لطفا وارد سیستم شوید.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
        return res.status(403).json({ error: 'Forbidden', message: 'نشست کاربری نامعتبر است.' });
    }
    req.user = user;
    next();
  });
};

export { JWT_SECRET };