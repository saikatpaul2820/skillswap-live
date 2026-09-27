import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { signalingService } from './signaling.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'skillswap-production-secret-key-2026';

// Middleware to extract user from JWT token
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// Optional auth for public views that enhance for authenticated user
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
      req.user = decoded;
    } catch {
      // ignore
    }
  }
  next();
}

function sanitizeUser(u: any) {
  const { password, ...rest } = u;
  return rest;
}

// -------------------------------------------------------------
// Database Status & Diagnostics
// -------------------------------------------------------------
router.get('/db-status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    ...db.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 1. Authentication Endpoints
// -------------------------------------------------------------

router.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.getUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Generate clean username from name or email
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
    let username = baseUsername;
    let counter = 1;
    while (db.getUserByUsername(username)) {
      username = `${baseUsername}${counter++}`;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = db.createUser({
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      username,
      bio: '',
      location: '',
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: sanitizeUser(newUser),
      isNewUser: true
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email or Username and password are required' });
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanIdentifier) || db.getUserByUsername(cleanIdentifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid Email/Username or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userSkills = db.getUserSkills(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
      skills: userSkills
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const skills = db.getUserSkills(user.id);
  return res.json({
    user: sanitizeUser(user),
    skills
  });
});

// -------------------------------------------------------------
// 2. Users Endpoints
// -------------------------------------------------------------

router.get('/users/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();
  const allUsers = db.getUsers().map(sanitizeUser);

  if (!query) {
    return res.json(allUsers);
  }

  const filtered = allUsers.filter(u => {
    const userSkills = db.getUserSkills(u.id);
    const hasMatchingSkill = userSkills.some(s => s.skillName.toLowerCase().includes(query));
    return (
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.location.toLowerCase().includes(query) ||
      u.bio.toLowerCase().includes(query) ||
      hasMatchingSkill
    );
  });

  return res.json(filtered);
});

router.get('/users/:id', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const skills = db.getUserSkills(user.id);
  const exchanges = db.getExchanges({ userId: user.id });

  return res.json({
    user: sanitizeUser(user),
    skills,
    exchanges
  });
});

router.put('/users/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
  }

  const { name, bio, location, profileImage, username } = req.body;
  const updates: Partial<any> = {};
  if (name !== undefined) updates.name = name.trim();
  if (bio !== undefined) updates.bio = bio.trim();
  if (location !== undefined) updates.location = location.trim();
  if (profileImage !== undefined) updates.profileImage = profileImage.trim();

  if (username !== undefined) {
    const cleanUsername = username.trim().toLowerCase();
    const existing = db.getUserByUsername(cleanUsername);
    if (existing && existing.id !== req.user!.id) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    updates.username = cleanUsername;
  }

  const updated = db.updateUser(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(updated)
  });
});

// -------------------------------------------------------------
// 3. Skills Endpoints
// -------------------------------------------------------------

router.get('/skills', (req: Request, res: Response) => {
  return res.json(db.getSkills());
});

router.post('/skills', authMiddleware, (req: Request, res: Response) => {
  const { name, category } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Skill name is required' });
  }
  const skill = db.createSkill(name.trim(), category ? category.trim() : 'General');
  return res.status(201).json(skill);
});

// -------------------------------------------------------------
// 4. User Skills Endpoints
// -------------------------------------------------------------

router.get('/users/:id/skills', (req: Request, res: Response) => {
  const skills = db.getUserSkills(req.params.id);
  return res.json(skills);
});

router.post('/users/:id/skills', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden: You can only manage your own skills' });
  }

  if (Array.isArray(req.body.skills)) {
    const updated = db.setUserSkills(req.params.id, req.body.skills);
    return res.json(updated);
  }

  const { skillName, type, category } = req.body;
  if (!skillName || !type || !['TEACH', 'LEARN'].includes(type)) {
    return res.status(400).json({ error: 'skillName and type (TEACH or LEARN) are required' });
  }

  const newUs = db.addUserSkill(req.params.id, skillName.trim(), type, category);
  return res.status(201).json(newUs);
});

router.delete('/users/:id/skills/:skillId', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden: You can only remove your own skills' });
  }

  const type = req.query.type as ('TEACH' | 'LEARN') | undefined;
  const removed = db.removeUserSkill(req.params.id, req.params.skillId, type);
  if (!removed) {
    return res.status(404).json({ error: 'Skill not associated with user' });
  }
  return res.json({ message: 'Skill removed successfully' });
});

// -------------------------------------------------------------
// 5. Exchange Requests Endpoints
// -------------------------------------------------------------

router.get('/exchanges', (req: Request, res: Response) => {
  const { search, mode, skill, userId } = req.query;
  const exchanges = db.getExchanges({
    search: search as string,
    mode: mode as string,
    skill: skill as string,
    userId: userId as string
  });
  return res.json(exchanges);
});

router.get('/exchanges/:id', (req: Request, res: Response) => {
  const exchange = db.getExchangeById(req.params.id);
  if (!exchange) {
    return res.status(404).json({ error: 'Exchange request not found' });
  }
  return res.json(exchange);
});

router.post('/exchanges', authMiddleware, (req: AuthRequest, res: Response) => {
  const { learningSkill, teachingSkill, description, mode } = req.body;

  if (!learningSkill || !teachingSkill || !description) {
    return res.status(400).json({ error: 'learningSkill, teachingSkill, and description are required' });
  }

  const user = db.getUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const learnSk = db.createSkill(learningSkill.trim(), 'General');
  const teachSk = db.createSkill(teachingSkill.trim(), 'General');

  db.addUserSkill(user.id, learnSk.name, 'LEARN', learnSk.category);
  db.addUserSkill(user.id, teachSk.name, 'TEACH', teachSk.category);

  const exchange = db.createExchange({
    userId: user.id,
    userName: user.name,
    userUsername: user.username,
    userProfileImage: user.profileImage,
    userLocation: user.location || 'Remote',
    learningSkillId: learnSk.id,
    learningSkillName: learnSk.name,
    teachingSkillId: teachSk.id,
    teachingSkillName: teachSk.name,
    description: description.trim(),
    mode: ['Online', 'Offline', 'Either'].includes(mode) ? mode : 'Online',
    status: 'ACTIVE'
  });

  return res.status(201).json(exchange);
});

router.put('/exchanges/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const existing = db.getExchangeById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Exchange request not found' });
  }

  if (existing.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: You can only edit your own exchange requests' });
  }

  const { description, mode, status, learningSkill, teachingSkill } = req.body;
  const updates: Partial<any> = {};

  if (description) updates.description = description.trim();
  if (mode && ['Online', 'Offline', 'Either'].includes(mode)) updates.mode = mode;
  if (status && ['ACTIVE', 'PAUSED', 'COMPLETED'].includes(status)) updates.status = status;

  if (learningSkill) {
    const s = db.createSkill(learningSkill.trim(), 'General');
    updates.learningSkillId = s.id;
    updates.learningSkillName = s.name;
  }

  if (teachingSkill) {
    const s = db.createSkill(teachingSkill.trim(), 'General');
    updates.teachingSkillId = s.id;
    updates.teachingSkillName = s.name;
  }

  const updated = db.updateExchange(req.params.id, updates);
  return res.json(updated);
});

router.delete('/exchanges/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const existing = db.getExchangeById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Exchange request not found' });
  }

  if (existing.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden: You can only delete your own exchange requests' });
  }

  db.deleteExchange(req.params.id);
  return res.json({ message: 'Exchange request deleted successfully' });
});

// -------------------------------------------------------------
// 6. Matching System Endpoint
// -------------------------------------------------------------

router.get('/matches', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = db.getUserById(currentUserId);
  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const mySkills = db.getUserSkills(currentUserId);
  const myTeaches = mySkills.filter(s => s.type === 'TEACH').map(s => s.skillName.toLowerCase());
  const myLearns = mySkills.filter(s => s.type === 'LEARN').map(s => s.skillName.toLowerCase());

  const allUsers = db.getUsers().filter(u => u.id !== currentUserId);
  const matches = [];

  for (const other of allUsers) {
    const otherSkills = db.getUserSkills(other.id);
    const otherTeaches = otherSkills.filter(s => s.type === 'TEACH').map(s => s.skillName.toLowerCase());
    const otherLearns = otherSkills.filter(s => s.type === 'LEARN').map(s => s.skillName.toLowerCase());

    const otherCanTeachMe = myLearns.filter(ml => otherTeaches.includes(ml));
    const iCanTeachOther = otherLearns.filter(ol => myTeaches.includes(ol));

    const isMutualSwap = otherCanTeachMe.length > 0 && iCanTeachOther.length > 0;
    const isOneWayTeach = otherCanTeachMe.length > 0;
    const isOneWayLearn = iCanTeachOther.length > 0;

    if (isMutualSwap || isOneWayTeach || isOneWayLearn) {
      const existingConn = db.findExistingConnection(currentUserId, other.id);

      matches.push({
        user: sanitizeUser(other),
        skills: otherSkills,
        matchType: isMutualSwap ? 'MUTUAL_SWAP' : (isOneWayTeach ? 'CAN_TEACH_YOU' : 'WANTS_YOUR_SKILL'),
        compatibilityScore: isMutualSwap ? 100 : 75,
        theyCanTeachYou: otherCanTeachMe,
        youCanTeachThem: iCanTeachOther,
        connectionStatus: existingConn ? existingConn.status : 'NONE',
        connectionId: existingConn ? existingConn.id : null,
        isSender: existingConn ? existingConn.senderId === currentUserId : false
      });
    }
  }

  matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return res.json(matches);
});

// -------------------------------------------------------------
// 7. Connections Endpoints
// -------------------------------------------------------------

router.get('/connections', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const userConnections = db.getConnectionsForUser(currentUserId);

  const pendingIncoming = userConnections.filter(c => c.receiverId === currentUserId && c.status === 'PENDING');
  const pendingSent = userConnections.filter(c => c.senderId === currentUserId && c.status === 'PENDING');
  const accepted = userConnections.filter(c => c.status === 'ACCEPTED');

  return res.json({
    all: userConnections,
    pendingIncoming,
    pendingSent,
    accepted
  });
});

router.post('/connections', authMiddleware, (req: AuthRequest, res: Response) => {
  const { receiverId } = req.body;
  const senderId = req.user!.id;

  if (!receiverId) {
    return res.status(400).json({ error: 'receiverId is required' });
  }

  if (receiverId === senderId) {
    return res.status(400).json({ error: 'Cannot send connection request to yourself' });
  }

  const existing = db.findExistingConnection(senderId, receiverId);
  if (existing) {
    return res.status(400).json({
      error: `Connection already exists with status: ${existing.status}`,
      connection: existing
    });
  }

  try {
    const conn = db.createConnection(senderId, receiverId);
    return res.status(201).json(conn);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'User not found' });
  }
});

router.put('/connections/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const conn = db.getConnection(req.params.id);
  if (!conn) {
    return res.status(404).json({ error: 'Connection request not found' });
  }

  if (conn.receiverId !== req.user!.id) {
    return res.status(403).json({ error: 'Only the receiver can accept this connection request' });
  }

  const updated = db.updateConnectionStatus(req.params.id, 'ACCEPTED');
  return res.json(updated);
});

router.put('/connections/:id/reject', authMiddleware, (req: AuthRequest, res: Response) => {
  const conn = db.getConnection(req.params.id);
  if (!conn) {
    return res.status(404).json({ error: 'Connection request not found' });
  }

  if (conn.receiverId !== req.user!.id) {
    return res.status(403).json({ error: 'Only the receiver can reject this connection request' });
  }

  const updated = db.updateConnectionStatus(req.params.id, 'REJECTED');
  return res.json(updated);
});

// -------------------------------------------------------------
// 8. Messaging Endpoints
// -------------------------------------------------------------

router.get('/messages/:userId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = req.params.userId;

  let conn = db.findExistingConnection(currentUserId, targetUserId);
  if (!conn) {
    try {
      conn = db.createConnection(currentUserId, targetUserId);
      db.updateConnectionStatus(conn.id, 'ACCEPTED');
    } catch {
      // ignore
    }
  } else if (conn.status !== 'ACCEPTED') {
    db.updateConnectionStatus(conn.id, 'ACCEPTED');
  }

  const messages = db.getMessagesBetween(currentUserId, targetUserId);
  const targetUser = db.getUserById(targetUserId);

  return res.json({
    targetUser: targetUser ? sanitizeUser(targetUser) : null,
    messages
  });
});

router.post('/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  const { receiverId, message, type, callData } = req.body;
  const senderId = req.user!.id;

  if (!receiverId || !message || !message.trim()) {
    return res.status(400).json({ error: 'receiverId and message are required' });
  }

  let conn = db.findExistingConnection(senderId, receiverId);
  if (!conn) {
    try {
      conn = db.createConnection(senderId, receiverId);
      db.updateConnectionStatus(conn.id, 'ACCEPTED');
    } catch {
      // ignore
    }
  } else if (conn.status !== 'ACCEPTED') {
    db.updateConnectionStatus(conn.id, 'ACCEPTED');
  }

  const newMsg = db.createMessage(senderId, receiverId, message, type, callData);
  return res.status(201).json(newMsg);
});

// -------------------------------------------------------------
// 8.1 1-to-1 Video Call Endpoints
// -------------------------------------------------------------

router.get('/calls/active', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const activeCalls = db.getActiveCallsForUser(currentUserId);
  return res.json({ calls: activeCalls });
});

router.post('/calls/initiate', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { receiverId, connectImmediately } = req.body;

  if (!receiverId) {
    return res.status(400).json({ error: 'receiverId is required' });
  }

  // Ensure connection exists so users can call without roadblocks
  let conn = db.findExistingConnection(currentUserId, receiverId);
  if (!conn) {
    try {
      conn = db.createConnection(currentUserId, receiverId);
      db.updateConnectionStatus(conn.id, 'ACCEPTED');
    } catch {
      // ignore
    }
  } else if (conn.status !== 'ACCEPTED') {
    db.updateConnectionStatus(conn.id, 'ACCEPTED');
  }

  // Check if there is already an active or calling session between these two users
  const existingCalls = db.getActiveCallsForUser(currentUserId);
  const activeBetweenPair = existingCalls.find(
    (c) =>
      ((c.callerId === currentUserId && c.receiverId === receiverId) ||
        (c.callerId === receiverId && c.receiverId === currentUserId)) &&
      (c.status === 'CALLING' || c.status === 'CONNECTED')
  );

  if (activeBetweenPair) {
    // If either side or caller requested immediate connect, or receiver joins
    if (connectImmediately || activeBetweenPair.receiverId === currentUserId) {
      const updated = db.updateCallStatus(activeBetweenPair.id, 'CONNECTED');
      signalingService.sendToUser(activeBetweenPair.callerId, {
        type: 'call_status',
        callId: activeBetweenPair.id,
        status: 'CONNECTED',
        byUserId: currentUserId,
      });
      return res.status(200).json(updated || activeBetweenPair);
    }
    return res.status(200).json(activeBetweenPair);
  }

  const session = db.initiateCall(currentUserId, receiverId);

  if (connectImmediately) {
    db.updateCallStatus(session.id, 'CONNECTED');
    session.status = 'CONNECTED';
  }

  // Notify receiver in real time via WebSocket
  signalingService.sendToUser(receiverId, {
    type: 'incoming_call',
    call: session,
  });

  return res.status(201).json(session);
});

router.get('/calls/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const session = db.getCallSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Call session not found' });
  }
  return res.json(session);
});

router.put('/calls/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['CONNECTED', 'ENDED', 'DECLINED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const session = db.getCallSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Call session not found' });
  }

  const updated = db.updateCallStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Call session not found' });
  }

  // Determine peer to notify
  const targetUserId = req.user!.id === session.callerId ? session.receiverId : session.callerId;
  signalingService.sendToUser(targetUserId, {
    type: 'call_status',
    callId: req.params.id,
    status,
    byUserId: req.user!.id,
  });

  return res.json(updated);
});

// Relay WebRTC SDP offer, answer, and ICE candidates
router.post('/calls/:id/signal', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { toUserId, signal } = req.body;

  if (!toUserId || !signal) {
    return res.status(400).json({ error: 'toUserId and signal are required' });
  }

  signalingService.storeAndRelaySignal(req.params.id, currentUserId, toUserId, signal);
  return res.json({ success: true });
});

// Retrieve signals for client fallback / polling
router.get('/calls/:id/signals', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const since = Number(req.query.since || 0);

  const signals = signalingService.getSignals(req.params.id, currentUserId, since);
  return res.json({ signals });
});

// Simulate demo peer accepting call for solo testing
router.post('/calls/:id/simulate-accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const session = db.getCallSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Call session not found' });
  }

  const updated = db.updateCallStatus(req.params.id, 'CONNECTED');
  signalingService.sendToUser(session.callerId, {
    type: 'call_status',
    callId: req.params.id,
    status: 'CONNECTED',
    byUserId: session.receiverId,
  });

  return res.json(updated);
});

// -------------------------------------------------------------
// 9. Notifications Endpoints
// -------------------------------------------------------------

router.get('/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const notifs = db.getNotifications(req.user!.id);
  const unreadCount = notifs.filter(n => !n.isRead).length;
  return res.json({
    notifications: notifs,
    unreadCount
  });
});

router.put('/notifications/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const success = db.markNotificationRead(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  return res.json({ message: 'Marked as read' });
});

// Reset database endpoint for demo testing
router.post('/seed/reset', (req: Request, res: Response) => {
  db.resetDatabase();
  return res.json({ message: 'Database reset to initial demo seeds successfully' });
});

export default router;
