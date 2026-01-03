import jwt from 'jsonwebtoken';

const JWT_SECRET = 'rahyar-secret-key-change-in-prod';

export const authenticateToken = (req, res, next) => {
  // Try to get token from Cookie header manually (since cookie-parser might not be installed)
  let token = null;
  
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
        token = tokenCookie.split('=')[1];
    }
  }

  // Fallback to Header (optional, for flexibility)
  if (!token) {
      const authHeader = req.headers['authorization'];
      if (authHeader) token = authHeader.split(' ')[1];
  }

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export { JWT_SECRET };