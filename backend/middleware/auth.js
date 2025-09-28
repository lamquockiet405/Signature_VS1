const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify session exists in database
    const sessionQuery = `
      SELECT us.*, u.id, u.username, u.email, u.mst, u.full_name, u.organization
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      WHERE us.session_token = $1 AND us.expires_at > NOW() AND u.is_active = true
    `;
    
    const sessionResult = await pool.query(sessionQuery, [token]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session' 
      });
    }

    req.user = sessionResult.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // For now, all authenticated users have the same role
    // You can extend this based on your requirements
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
