import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-eci-key-2026';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access Denied: Missing or invalid token." });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = decoded; // { username, role, assignedZone }

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Access Denied: You do not have the required role." });
      }

      // Zone Authorization Guard
      // Check if the request contains a constituencyId or wardId and if it matches assignedZone.
      // We skip zone check for CentralAdmin as they have global access.
      if (decoded.role !== 'CentralAdmin' && decoded.assignedZone !== 0) {
        const targetZone = req.body.constituencyId || req.body.wardId || req.query.constituencyId || req.query.wardId;
        if (targetZone && Number(targetZone) !== Number(decoded.assignedZone)) {
          return res.status(403).json({ error: "Access Denied: Cross-Zone Operations are strictly prohibited." });
        }
      }

      next();
    } catch (error) {
      return res.status(403).json({ error: "Access Denied: Token verification failed." });
    }
  };
};
