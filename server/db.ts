import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MongoClient, Db } from 'mongodb';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  username: string;
  bio: string;
  location: string;
  profileImage: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  category: string;
  type: 'TEACH' | 'LEARN';
}

export interface SkillExchangeRequest {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userProfileImage: string;
  userLocation: string;
  learningSkillId: string;
  learningSkillName: string;
  teachingSkillId: string;
  teachingSkillName: string;
  description: string;
  mode: 'Online' | 'Offline' | 'Either';
  createdAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface Connection {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderProfileImage: string;
  receiverId: string;
  receiverName: string;
  receiverUsername: string;
  receiverProfileImage: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: 'TEXT' | 'CALL_INVITE' | 'CALL_ENDED';
  callData?: {
    callId: string;
    status: 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'ENDED';
    channelName?: string;
  };
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'CALLING' | 'CONNECTED' | 'ENDED' | 'DECLINED';
  startedAt: string;
  endedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'NEW_MESSAGE' | 'NEW_MATCH' | 'INCOMING_CALL';
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface DatabaseSchema {
  users: User[];
  skills: Skill[];
  userSkills: UserSkill[];
  exchangeRequests: SkillExchangeRequest[];
  connections: Connection[];
  messages: Message[];
  notifications: Notification[];
  activeCalls?: CallSession[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'skillswap_db.json');

function ensureDirExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function getInitialSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const users: User[] = [
    {
      id: 'u-1',
      name: 'Sarah Chen',
      email: 'sarah@skillswap.io',
      password: defaultPasswordHash,
      username: 'sarahc',
      bio: 'Senior UI/UX Designer with 4+ years of product design experience at fintech startups. Passionate about typography, design systems, and Figma.',
      location: 'San Francisco, CA (PST)',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-08-15T10:00:00.000Z',
    },
    {
      id: 'u-2',
      name: 'Rahul Sharma',
      email: 'rahul@skillswap.io',
      password: defaultPasswordHash,
      username: 'rahul_dev',
      bio: 'Full-stack software engineer specializing in Java, Spring Boot, and cloud microservices. Eager to master modern visual design and Figma to build prettier apps.',
      location: 'Bangalore, India (IST)',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-08-18T14:30:00.000Z',
    },
    {
      id: 'u-3',
      name: 'Elena Rostova',
      email: 'elena@skillswap.io',
      password: defaultPasswordHash,
      username: 'elena_ai',
      bio: 'Data scientist & ML researcher. I build Python models and PyTorch pipelines every day. Looking to learn Web Development & React to build interactive dashboards.',
      location: 'Berlin, Germany (CET)',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-08-20T09:15:00.000Z',
    },
    {
      id: 'u-4',
      name: 'Marcus Brody',
      email: 'marcus@skillswap.io',
      password: defaultPasswordHash,
      username: 'marcus_video',
      bio: 'Freelance video editor & motion designer with DaVinci Resolve & Premiere Pro. Looking for a tutor in Python automation & web scraping.',
      location: 'Austin, TX (CST)',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-08-25T16:45:00.000Z',
    },
    {
      id: 'u-5',
      name: 'Priya Patel',
      email: 'priya@skillswap.io',
      password: defaultPasswordHash,
      username: 'priya_growth',
      bio: 'Digital marketing strategist & SEO analyst. Experienced in Google Ads, GA4, and content marketing. Want to learn Excel advanced formulas, SQL, and Python.',
      location: 'Toronto, Canada (EST)',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T11:20:00.000Z',
    },
    {
      id: 'u-6',
      name: 'David Kim',
      email: 'david@skillswap.io',
      password: defaultPasswordHash,
      username: 'davidk_code',
      bio: 'React & Next.js frontend developer. Excited to exchange web development coaching for UI/UX mentoring or Machine Learning fundamentals.',
      location: 'Seattle, WA (PST)',
      profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
      createdAt: '2026-09-05T08:00:00.000Z',
    },
    {
      id: 'u-saikat',
      name: 'Saikat Paul',
      email: 'saikatpaul2820@gmail.com',
      password: defaultPasswordHash,
      username: 'saikatpaul2820',
      bio: 'Full-stack software developer & SkillSwap founder.',
      location: 'India',
      profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=saikatpaul2820',
      createdAt: '2026-09-22T18:52:36.238Z',
    }
  ];

  const skills: Skill[] = [
    { id: 's-1', name: 'Java', category: 'Programming' },
    { id: 's-2', name: 'UI/UX Design', category: 'Design' },
    { id: 's-3', name: 'Python', category: 'Programming' },
    { id: 's-4', name: 'Graphic Design', category: 'Design' },
    { id: 's-5', name: 'React', category: 'Web Development' },
    { id: 's-6', name: 'Machine Learning', category: 'Data Science' },
    { id: 's-7', name: 'Video Editing', category: 'Creative' },
    { id: 's-8', name: 'Digital Marketing', category: 'Marketing' },
    { id: 's-9', name: 'Advanced Excel', category: 'Business' },
    { id: 's-10', name: 'C++', category: 'Programming' },
    { id: 's-11', name: 'Spring Boot', category: 'Backend' },
    { id: 's-12', name: 'Figma', category: 'Design' },
    { id: 's-13', name: 'SQL & Database Design', category: 'Data Science' },
    { id: 's-14', name: 'Public Speaking', category: 'Communication' }
  ];

  const userSkills: UserSkill[] = [
    // Sarah (u-1): Teaches UI/UX Design, Graphic Design, Figma. Wants to learn Java, React.
    { id: 'us-1', userId: 'u-1', skillId: 's-2', skillName: 'UI/UX Design', category: 'Design', type: 'TEACH' },
    { id: 'us-2', userId: 'u-1', skillId: 's-4', skillName: 'Graphic Design', category: 'Design', type: 'TEACH' },
    { id: 'us-3', userId: 'u-1', skillId: 's-12', skillName: 'Figma', category: 'Design', type: 'TEACH' },
    { id: 'us-4', userId: 'u-1', skillId: 's-1', skillName: 'Java', category: 'Programming', type: 'LEARN' },
    { id: 'us-5', userId: 'u-1', skillId: 's-5', skillName: 'React', category: 'Web Development', type: 'LEARN' },

    // Rahul (u-2): Teaches Java, Spring Boot, C++. Wants to learn UI/UX Design, Graphic Design.
    { id: 'us-6', userId: 'u-2', skillId: 's-1', skillName: 'Java', category: 'Programming', type: 'TEACH' },
    { id: 'us-7', userId: 'u-2', skillId: 's-11', skillName: 'Spring Boot', category: 'Backend', type: 'TEACH' },
    { id: 'us-8', userId: 'u-2', skillId: 's-10', skillName: 'C++', category: 'Programming', type: 'TEACH' },
    { id: 'us-9', userId: 'u-2', skillId: 's-2', skillName: 'UI/UX Design', category: 'Design', type: 'LEARN' },
    { id: 'us-10', userId: 'u-2', skillId: 's-4', skillName: 'Graphic Design', category: 'Design', type: 'LEARN' },

    // Elena (u-3): Teaches Python, Machine Learning. Wants to learn React, Web Development.
    { id: 'us-11', userId: 'u-3', skillId: 's-3', skillName: 'Python', category: 'Programming', type: 'TEACH' },
    { id: 'us-12', userId: 'u-3', skillId: 's-6', skillName: 'Machine Learning', category: 'Data Science', type: 'TEACH' },
    { id: 'us-13', userId: 'u-3', skillId: 's-5', skillName: 'React', category: 'Web Development', type: 'LEARN' },

    // Marcus (u-4): Teaches Video Editing. Wants to learn Python, Machine Learning.
    { id: 'us-14', userId: 'u-4', skillId: 's-7', skillName: 'Video Editing', category: 'Creative', type: 'TEACH' },
    { id: 'us-15', userId: 'u-4', skillId: 's-3', skillName: 'Python', category: 'Programming', type: 'LEARN' },

    // Priya (u-5): Teaches Digital Marketing. Wants to learn Advanced Excel, SQL.
    { id: 'us-16', userId: 'u-5', skillId: 's-8', skillName: 'Digital Marketing', category: 'Marketing', type: 'TEACH' },
    { id: 'us-17', userId: 'u-5', skillId: 's-9', skillName: 'Advanced Excel', category: 'Business', type: 'LEARN' },
    { id: 'us-18', userId: 'u-5', skillId: 's-13', skillName: 'SQL & Database Design', category: 'Data Science', type: 'LEARN' },

    // David (u-6): Teaches React. Wants to learn Machine Learning, UI/UX Design.
    { id: 'us-19', userId: 'u-6', skillId: 's-5', skillName: 'React', category: 'Web Development', type: 'TEACH' },
    { id: 'us-20', userId: 'u-6', skillId: 's-6', skillName: 'Machine Learning', category: 'Data Science', type: 'LEARN' },
    { id: 'us-21', userId: 'u-6', skillId: 's-2', skillName: 'UI/UX Design', category: 'Design', type: 'LEARN' },

    // Saikat (u-saikat): Teaches React, Web Development. Wants to learn Python, Machine Learning.
    { id: 'us-saikat-1', userId: 'u-saikat', skillId: 's-5', skillName: 'React', category: 'Web Development', type: 'TEACH' },
    { id: 'us-saikat-2', userId: 'u-saikat', skillId: 's-3', skillName: 'Python', category: 'Programming', type: 'LEARN' }
  ];

  const exchangeRequests: SkillExchangeRequest[] = [
    {
      id: 'ex-1',
      userId: 'u-1',
      userName: 'Sarah Chen',
      userUsername: 'sarahc',
      userProfileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
      userLocation: 'San Francisco, CA',
      learningSkillId: 's-1',
      learningSkillName: 'Java',
      teachingSkillId: 's-2',
      teachingSkillName: 'UI/UX Design',
      description: 'Looking for someone interested in exchanging programming and design skills! I can teach Figma, wireframing, and user research. In exchange, I want to learn core Java object-oriented principles.',
      mode: 'Online',
      createdAt: '2026-09-18T10:30:00.000Z',
      status: 'ACTIVE'
    },
    {
      id: 'ex-2',
      userId: 'u-2',
      userName: 'Rahul Sharma',
      userUsername: 'rahul_dev',
      userProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
      userLocation: 'Bangalore, India',
      learningSkillId: 's-2',
      learningSkillName: 'UI/UX Design',
      teachingSkillId: 's-1',
      teachingSkillName: 'Java',
      description: 'I have 5 years experience with Java, Spring Boot, and RESTful architectures. Looking to pair up with a designer who can review my app mocks and teach me modern UI design principles.',
      mode: 'Either',
      createdAt: '2026-09-19T14:15:00.000Z',
      status: 'ACTIVE'
    },
    {
      id: 'ex-3',
      userId: 'u-3',
      userName: 'Elena Rostova',
      userUsername: 'elena_ai',
      userProfileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      userLocation: 'Berlin, Germany',
      learningSkillId: 's-5',
      learningSkillName: 'React',
      teachingSkillId: 's-3',
      teachingSkillName: 'Python',
      description: 'Will teach Python fundamentals, NumPy, pandas, or ML basics. Want to learn how to build React components and state management for client apps.',
      mode: 'Online',
      createdAt: '2026-09-20T08:00:00.000Z',
      status: 'ACTIVE'
    },
    {
      id: 'ex-4',
      userId: 'u-4',
      userName: 'Marcus Brody',
      userUsername: 'marcus_video',
      userProfileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      userLocation: 'Austin, TX',
      learningSkillId: 's-3',
      learningSkillName: 'Python',
      teachingSkillId: 's-7',
      teachingSkillName: 'Video Editing',
      description: 'Professional video editor offering 1-on-1 pacing, color grading, and audio mastering lessons. Seeking a Python tutor to help me script automated batch render workflows.',
      mode: 'Online',
      createdAt: '2026-09-20T19:20:00.000Z',
      status: 'ACTIVE'
    },
    {
      id: 'ex-5',
      userId: 'u-5',
      userName: 'Priya Patel',
      userUsername: 'priya_growth',
      userProfileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
      userLocation: 'Toronto, Canada',
      learningSkillId: 's-9',
      learningSkillName: 'Advanced Excel',
      teachingSkillId: 's-8',
      teachingSkillName: 'Digital Marketing',
      description: 'Offering hands-on coaching in SEO, conversion rate optimization, and brand storytelling. Looking for an Excel guru to teach me INDEX/MATCH, power queries, and pivot dashboards.',
      mode: 'Either',
      createdAt: '2026-09-21T09:45:00.000Z',
      status: 'ACTIVE'
    },
    {
      id: 'ex-6',
      userId: 'u-6',
      userName: 'David Kim',
      userUsername: 'davidk_code',
      userProfileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
      userLocation: 'Seattle, WA',
      learningSkillId: 's-6',
      learningSkillName: 'Machine Learning',
      teachingSkillId: 's-5',
      teachingSkillName: 'React',
      description: 'Frontend engineer with rich React & Tailwind experience. Looking for an ML engineer to explain transformers, embeddings, and practical fine-tuning in exchange for React mentorship.',
      mode: 'Online',
      createdAt: '2026-09-21T18:00:00.000Z',
      status: 'ACTIVE'
    }
  ];

  const connections: Connection[] = [
    {
      id: 'conn-1',
      senderId: 'u-2',
      senderName: 'Rahul Sharma',
      senderUsername: 'rahul_dev',
      senderProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
      receiverId: 'u-1',
      receiverName: 'Sarah Chen',
      receiverUsername: 'sarahc',
      receiverProfileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
      status: 'ACCEPTED',
      createdAt: '2026-09-19T16:00:00.000Z',
    },
    {
      id: 'conn-2',
      senderId: 'u-4',
      senderName: 'Marcus Brody',
      senderUsername: 'marcus_video',
      senderProfileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
      receiverId: 'u-3',
      receiverName: 'Elena Rostova',
      receiverUsername: 'elena_ai',
      receiverProfileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
      status: 'PENDING',
      createdAt: '2026-09-21T11:00:00.000Z',
    },
    {
      id: 'conn-3',
      senderId: 'u-6',
      senderName: 'David Kim',
      senderUsername: 'davidk_code',
      senderProfileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
      receiverId: 'u-1',
      receiverName: 'Sarah Chen',
      receiverUsername: 'sarahc',
      receiverProfileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
      status: 'PENDING',
      createdAt: '2026-09-21T19:30:00.000Z',
    }
  ];

  const messages: Message[] = [
    {
      id: 'msg-1',
      senderId: 'u-2',
      receiverId: 'u-1',
      message: 'Hi Sarah! I noticed you can teach UI/UX Design and want to learn Java. I have 5 years in Java and Spring Boot!',
      timestamp: '2026-09-19T16:05:00.000Z',
      isRead: true
    },
    {
      id: 'msg-2',
      senderId: 'u-1',
      receiverId: 'u-2',
      message: 'Hi Rahul! That is fantastic. I am designing an analytics dashboard and really need backend architecture insights. Great match!',
      timestamp: '2026-09-19T16:10:00.000Z',
      isRead: true
    },
    {
      id: 'msg-3',
      senderId: 'u-2',
      receiverId: 'u-1',
      message: 'What time works for our first video session? Saturday 5 PM UTC?',
      timestamp: '2026-09-20T10:00:00.000Z',
      isRead: true
    },
    {
      id: 'msg-4',
      senderId: 'u-1',
      receiverId: 'u-2',
      message: 'Saturday 5 PM works perfectly for me. Looking forward to exchanging skills!',
      timestamp: '2026-09-20T10:15:00.000Z',
      isRead: true
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'u-1',
      type: 'NEW_MATCH',
      message: 'Potential Skill Swap Found! Rahul Sharma wants to learn UI/UX and can teach Java.',
      isRead: true,
      createdAt: '2026-09-19T14:16:00.000Z',
      link: '/matches'
    },
    {
      id: 'notif-2',
      userId: 'u-1',
      type: 'CONNECTION_ACCEPTED',
      message: 'Rahul Sharma accepted your connection request. You can now message each other!',
      isRead: true,
      createdAt: '2026-09-19T16:00:00.000Z',
      link: '/messages'
    },
    {
      id: 'notif-3',
      userId: 'u-1',
      type: 'CONNECTION_REQUEST',
      message: 'David Kim sent you a connection request for UI/UX Design mentoring.',
      isRead: false,
      createdAt: '2026-09-21T19:30:00.000Z',
      link: '/connections'
    }
  ];

  return {
    users,
    skills,
    userSkills,
    exchangeRequests,
    connections,
    messages,
    notifications,
    activeCalls: []
  };
}

export class Database {
  private data: DatabaseSchema;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isMongoConnected: boolean = false;

  constructor() {
    ensureDirExists();
    if (!fs.existsSync(DB_FILE)) {
      this.data = getInitialSeedData();
      this.saveLocal();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure default seed users exist if file was previously created without them
        const seed = getInitialSeedData();
        let changed = false;
        seed.users.forEach(su => {
          if (!this.data.users.some(u => (u.email || '').trim().toLowerCase() === su.email.trim().toLowerCase())) {
            this.data.users.push(su);
            changed = true;
          }
        });
        seed.userSkills.forEach(sus => {
          if (!this.data.userSkills.some(us => us.id === sus.id)) {
            this.data.userSkills.push(sus);
            changed = true;
          }
        });
        if (changed) {
          this.saveLocal();
        }
      } catch (err) {
        console.error('Failed to parse existing DB file, re-seeding:', err);
        this.data = getInitialSeedData();
        this.saveLocal();
      }
    }
  }

  /**
   * Initializes connection to MongoDB Atlas cloud cluster if MONGODB_URI is provided.
   * If not provided, cleanly falls back to local JSON file storage.
   */
  async initMongo(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri || !mongoUri.trim()) {
      console.log('📦 [Database] Storage mode: Local JSON (data/skillswap_db.json)');
      console.log('💡 [Database] Tip: Add MONGODB_URI in your environment or Render settings to persist user accounts in MongoDB Atlas cloud.');
      return;
    }

    try {
      console.log('🔄 [Database] Connecting to MongoDB Atlas cloud database...');
      this.mongoClient = new MongoClient(mongoUri.trim(), {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      await this.mongoClient.connect();
      // Uses the database specified in URI or defaults to 'skillswap'
      this.mongoDb = this.mongoClient.db();
      this.isMongoConnected = true;
      console.log('✅ [Database] Connected successfully to MongoDB Atlas! Cloud persistence active.');

      await this.loadFromMongo();
    } catch (err: any) {
      console.error('⚠️ [Database] Could not connect to MongoDB Atlas:', err?.message || err);
      console.log('📁 [Database] Falling back to local JSON file storage.');
      this.isMongoConnected = false;
    }
  }

  private async loadFromMongo() {
    if (!this.mongoDb || !this.isMongoConnected) return;

    try {
      const usersCol = this.mongoDb.collection<User>('users');
      const count = await usersCol.countDocuments();

      if (count === 0) {
        console.log('🌱 [Database] MongoDB is empty. Seeding initial data to MongoDB Atlas...');
        if (this.data.users.length) await this.mongoDb.collection('users').insertMany(this.data.users as any);
        if (this.data.skills.length) await this.mongoDb.collection('skills').insertMany(this.data.skills as any);
        if (this.data.userSkills.length) await this.mongoDb.collection('userSkills').insertMany(this.data.userSkills as any);
        if (this.data.exchangeRequests.length) await this.mongoDb.collection('exchangeRequests').insertMany(this.data.exchangeRequests as any);
        if (this.data.connections.length) await this.mongoDb.collection('connections').insertMany(this.data.connections as any);
        if (this.data.messages.length) await this.mongoDb.collection('messages').insertMany(this.data.messages as any);
        if (this.data.notifications.length) await this.mongoDb.collection('notifications').insertMany(this.data.notifications as any);
        console.log('✅ [Database] Seed data successfully written to MongoDB Atlas.');
      } else {
        console.log('📥 [Database] Syncing existing collections from MongoDB Atlas into memory...');
        const mongoUsers = await this.mongoDb.collection<User>('users').find({}).toArray();
        const mongoSkills = await this.mongoDb.collection<Skill>('skills').find({}).toArray();
        const mongoUserSkills = await this.mongoDb.collection<UserSkill>('userSkills').find({}).toArray();
        const mongoExchanges = await this.mongoDb.collection<SkillExchangeRequest>('exchangeRequests').find({}).toArray();
        const mongoConns = await this.mongoDb.collection<Connection>('connections').find({}).toArray();
        const mongoMsgs = await this.mongoDb.collection<Message>('messages').find({}).toArray();
        const mongoNotifs = await this.mongoDb.collection<Notification>('notifications').find({}).toArray();

        // Strip MongoDB internal _id before assigning to memory
        const cleanDoc = (doc: any) => {
          const { _id, ...rest } = doc;
          return rest;
        };

        this.data.users = mongoUsers.map(cleanDoc) as User[];
        this.data.skills = mongoSkills.map(cleanDoc) as Skill[];
        this.data.userSkills = mongoUserSkills.map(cleanDoc) as UserSkill[];
        this.data.exchangeRequests = mongoExchanges.map(cleanDoc) as SkillExchangeRequest[];
        this.data.connections = mongoConns.map(cleanDoc) as Connection[];
        this.data.messages = mongoMsgs.map(cleanDoc) as Message[];
        this.data.notifications = mongoNotifs.map(cleanDoc) as Notification[];

        this.saveLocal();
        console.log(`✅ [Database] Synchronized ${this.data.users.length} users and ${this.data.exchangeRequests.length} skill requests from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('⚠️ [Database] Error syncing with MongoDB Atlas:', err);
    }
  }

  private save() {
    this.saveLocal();
  }

  private saveLocal() {
    try {
      ensureDirExists();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local DB file:', err);
    }
  }

  private persistDoc(collectionName: string, doc: any) {
    if (!this.isMongoConnected || !this.mongoDb) return;
    this.mongoDb.collection(collectionName).insertOne({ ...doc }).catch(err => {
      console.warn(`[MongoDB] Failed to insert doc in ${collectionName}:`, err.message);
    });
  }

  private updateMongoDoc(collectionName: string, filter: Record<string, any>, updates: Record<string, any>) {
    if (!this.isMongoConnected || !this.mongoDb) return;
    this.mongoDb.collection(collectionName).updateOne(filter, { $set: updates }).catch(err => {
      console.warn(`[MongoDB] Failed to update doc in ${collectionName}:`, err.message);
    });
  }

  private deleteMongoDoc(collectionName: string, filter: Record<string, any>) {
    if (!this.isMongoConnected || !this.mongoDb) return;
    this.mongoDb.collection(collectionName).deleteOne(filter).catch(err => {
      console.warn(`[MongoDB] Failed to delete doc in ${collectionName}:`, err.message);
    });
  }

  private syncUserSkillsToMongo(userId: string) {
    if (!this.isMongoConnected || !this.mongoDb) return;
    this.mongoDb.collection('userSkills').deleteMany({ userId }).then(() => {
      const skills = this.data.userSkills.filter(us => us.userId === userId);
      if (skills.length > 0) {
        this.mongoDb!.collection('userSkills').insertMany(skills as any).catch(() => {});
      }
    }).catch(err => {
      console.warn('[MongoDB] Failed to sync userSkills:', err.message);
    });
  }

  getStatus() {
    return {
      storageType: this.isMongoConnected ? 'mongodb' : 'local_json',
      isMongoConnected: this.isMongoConnected,
      userCount: this.data.users.length,
      exchangeCount: this.data.exchangeRequests.length,
      messageCount: this.data.messages.length,
      connectionCount: this.data.connections.length
    };
  }

  // Users
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => (u.email || '').trim().toLowerCase() === clean);
  }

  getUserByUsername(username: string): User | undefined {
    if (!username) return undefined;
    const clean = username.trim().toLowerCase();
    return this.data.users.find(u => (u.username || '').trim().toLowerCase() === clean);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    this.persistDoc('users', user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    
    // Also update exchange requests and connections with new name/image if changed
    if (updates.name || updates.profileImage || updates.location || updates.username) {
      this.data.exchangeRequests.forEach(ex => {
        if (ex.userId === id) {
          if (updates.name) ex.userName = updates.name;
          if (updates.profileImage) ex.userProfileImage = updates.profileImage;
          if (updates.location) ex.userLocation = updates.location;
          if (updates.username) ex.userUsername = updates.username;
        }
      });
      this.data.connections.forEach(conn => {
        if (conn.senderId === id) {
          if (updates.name) conn.senderName = updates.name;
          if (updates.profileImage) conn.senderProfileImage = updates.profileImage;
          if (updates.username) conn.senderUsername = updates.username;
        }
        if (conn.receiverId === id) {
          if (updates.name) conn.receiverName = updates.name;
          if (updates.profileImage) conn.receiverProfileImage = updates.profileImage;
          if (updates.username) conn.receiverUsername = updates.username;
        }
      });

      if (this.isMongoConnected && this.mongoDb) {
        const userUpdates: Record<string, any> = {};
        if (updates.name) userUpdates.userName = updates.name;
        if (updates.profileImage) userUpdates.userProfileImage = updates.profileImage;
        if (updates.location) userUpdates.userLocation = updates.location;
        if (updates.username) userUpdates.userUsername = updates.username;

        this.mongoDb.collection('exchangeRequests').updateMany({ userId: id }, { $set: userUpdates }).catch(() => {});
        this.mongoDb.collection('connections').updateMany({ senderId: id }, { $set: { senderName: updates.name, senderProfileImage: updates.profileImage, senderUsername: updates.username } }).catch(() => {});
        this.mongoDb.collection('connections').updateMany({ receiverId: id }, { $set: { receiverName: updates.name, receiverProfileImage: updates.profileImage, receiverUsername: updates.username } }).catch(() => {});
      }
    }

    this.save();
    this.updateMongoDoc('users', { id }, updates);
    return this.data.users[idx];
  }

  // Skills
  getSkills(): Skill[] {
    return this.data.skills;
  }

  getSkillById(id: string): Skill | undefined {
    return this.data.skills.find(s => s.id === id);
  }

  createSkill(name: string, category: string): Skill {
    const existing = this.data.skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const newSkill: Skill = {
      id: `s-${Date.now()}`,
      name,
      category: category || 'General'
    };
    this.data.skills.push(newSkill);
    this.save();
    this.persistDoc('skills', newSkill);
    return newSkill;
  }

  // UserSkills
  getUserSkills(userId: string): UserSkill[] {
    return this.data.userSkills.filter(us => us.userId === userId);
  }

  setUserSkills(userId: string, skills: { skillName: string; category?: string; type: 'TEACH' | 'LEARN' }[]): UserSkill[] {
    // Remove existing user skills
    this.data.userSkills = this.data.userSkills.filter(us => us.userId !== userId);
    
    // Add new ones
    skills.forEach(s => {
      let registeredSkill = this.data.skills.find(sk => sk.name.toLowerCase() === s.skillName.toLowerCase());
      if (!registeredSkill) {
        registeredSkill = this.createSkill(s.skillName, s.category || 'General');
      }
      this.data.userSkills.push({
        id: `us-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        skillId: registeredSkill.id,
        skillName: registeredSkill.name,
        category: registeredSkill.category,
        type: s.type
      });
    });

    this.save();
    this.syncUserSkillsToMongo(userId);
    return this.getUserSkills(userId);
  }

  addUserSkill(userId: string, skillName: string, type: 'TEACH' | 'LEARN', category?: string): UserSkill {
    let registeredSkill = this.data.skills.find(sk => sk.name.toLowerCase() === skillName.toLowerCase());
    if (!registeredSkill) {
      registeredSkill = this.createSkill(skillName, category || 'General');
    }

    // Check duplicate
    const existing = this.data.userSkills.find(us => us.userId === userId && us.skillId === registeredSkill!.id && us.type === type);
    if (existing) return existing;

    const newUs: UserSkill = {
      id: `us-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      skillId: registeredSkill.id,
      skillName: registeredSkill.name,
      category: registeredSkill.category,
      type
    };
    this.data.userSkills.push(newUs);
    this.save();
    this.persistDoc('userSkills', newUs);
    return newUs;
  }

  removeUserSkill(userId: string, skillId: string, type?: 'TEACH' | 'LEARN'): boolean {
    const prevLen = this.data.userSkills.length;
    this.data.userSkills = this.data.userSkills.filter(us => {
      if (us.userId !== userId) return true;
      if (type) {
        return !(us.skillId === skillId && us.type === type);
      }
      return us.skillId !== skillId;
    });
    this.save();
    this.deleteMongoDoc('userSkills', type ? { userId, skillId, type } : { userId, skillId });
    return this.data.userSkills.length < prevLen;
  }

  // Exchanges
  getExchanges(filters?: {
    search?: string;
    mode?: string;
    skill?: string;
    userId?: string;
  }): SkillExchangeRequest[] {
    let res = [...this.data.exchangeRequests];

    if (filters?.userId) {
      res = res.filter(e => e.userId === filters.userId);
    }

    if (filters?.mode && filters.mode !== 'ALL') {
      res = res.filter(e => e.mode.toLowerCase() === filters.mode!.toLowerCase() || e.mode === 'Either');
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(e =>
        e.userName.toLowerCase().includes(q) ||
        e.userUsername.toLowerCase().includes(q) ||
        e.learningSkillName.toLowerCase().includes(q) ||
        e.teachingSkillName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }

    if (filters?.skill) {
      const s = filters.skill.toLowerCase();
      res = res.filter(e =>
        e.learningSkillName.toLowerCase().includes(s) ||
        e.teachingSkillName.toLowerCase().includes(s)
      );
    }

    // Sort newest first
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getExchangeById(id: string): SkillExchangeRequest | undefined {
    return this.data.exchangeRequests.find(e => e.id === id);
  }

  createExchange(req: Omit<SkillExchangeRequest, 'id' | 'createdAt'>): SkillExchangeRequest {
    const newEx: SkillExchangeRequest = {
      ...req,
      id: `ex-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.exchangeRequests.unshift(newEx);
    this.save();
    this.persistDoc('exchangeRequests', newEx);
    return newEx;
  }

  updateExchange(id: string, updates: Partial<SkillExchangeRequest>): SkillExchangeRequest | null {
    const idx = this.data.exchangeRequests.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.exchangeRequests[idx] = { ...this.data.exchangeRequests[idx], ...updates };
    this.save();
    this.updateMongoDoc('exchangeRequests', { id }, updates);
    return this.data.exchangeRequests[idx];
  }

  deleteExchange(id: string): boolean {
    const prev = this.data.exchangeRequests.length;
    this.data.exchangeRequests = this.data.exchangeRequests.filter(e => e.id !== id);
    this.save();
    this.deleteMongoDoc('exchangeRequests', { id });
    return this.data.exchangeRequests.length < prev;
  }

  // Connections
  getConnectionsForUser(userId: string): Connection[] {
    return this.data.connections.filter(c => c.senderId === userId || c.receiverId === userId);
  }

  getConnection(id: string): Connection | undefined {
    return this.data.connections.find(c => c.id === id);
  }

  findExistingConnection(userA: string, userB: string): Connection | undefined {
    return this.data.connections.find(c => 
      (c.senderId === userA && c.receiverId === userB) ||
      (c.senderId === userB && c.receiverId === userA)
    );
  }

  createConnection(senderId: string, receiverId: string): Connection {
    const sender = this.getUserById(senderId);
    const receiver = this.getUserById(receiverId);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      senderId,
      senderName: sender.name,
      senderUsername: sender.username,
      senderProfileImage: sender.profileImage,
      receiverId,
      receiverName: receiver.name,
      receiverUsername: receiver.username,
      receiverProfileImage: receiver.profileImage,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.data.connections.unshift(newConn);

    // Trigger notification for receiver
    this.createNotification(
      receiverId,
      'CONNECTION_REQUEST',
      `${sender.name} sent you a connection request to exchange skills.`,
      '/connections'
    );

    this.save();
    this.persistDoc('connections', newConn);
    return newConn;
  }

  updateConnectionStatus(id: string, status: 'ACCEPTED' | 'REJECTED'): Connection | null {
    const conn = this.getConnection(id);
    if (!conn) return null;

    conn.status = status;

    if (status === 'ACCEPTED') {
      this.createNotification(
        conn.senderId,
        'CONNECTION_ACCEPTED',
        `${conn.receiverName} accepted your skill exchange connection! You can now start chatting.`,
        '/messages'
      );
    }

    this.save();
    this.updateMongoDoc('connections', { id }, { status });
    return conn;
  }

  // Messages
  getMessagesBetween(userA: string, userB: string): Message[] {
    const msgs = this.data.messages.filter(m =>
      (m.senderId === userA && m.receiverId === userB) ||
      (m.senderId === userB && m.receiverId === userA)
    );

    // Mark messages sent to userA as read if requested
    let changed = false;
    msgs.forEach(m => {
      if (m.receiverId === userA && !m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      this.save();
      if (this.isMongoConnected && this.mongoDb) {
        this.mongoDb.collection('messages').updateMany({ receiverId: userA, senderId: userB, isRead: false }, { $set: { isRead: true } }).catch(() => {});
      }
    }

    return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  createMessage(
    senderId: string,
    receiverId: string,
    messageText: string,
    type: 'TEXT' | 'CALL_INVITE' | 'CALL_ENDED' = 'TEXT',
    callData?: Message['callData']
  ): Message {
    const sender = this.getUserById(senderId);
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
      type,
      callData,
    };

    this.data.messages.push(newMsg);

    // Create notification for receiver
    if (sender) {
      const notifType = type === 'CALL_INVITE' ? 'INCOMING_CALL' : 'NEW_MESSAGE';
      const notifText =
        type === 'CALL_INVITE'
          ? `Incoming 1-to-1 Video Call from ${sender.name}`
          : `New message from ${sender.name}: "${messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText}"`;

      this.createNotification(receiverId, notifType, notifText, '/messages');
    }

    this.save();
    this.persistDoc('messages', newMsg);
    return newMsg;
  }

  // 1-to-1 Video Call Management
  getActiveCallsForUser(userId: string): CallSession[] {
    if (!this.data.activeCalls) this.data.activeCalls = [];
    return this.data.activeCalls.filter(
      (c) => (c.callerId === userId || c.receiverId === userId) && (c.status === 'CALLING' || c.status === 'CONNECTED')
    );
  }

  initiateCall(callerId: string, receiverId: string): CallSession {
    if (!this.data.activeCalls) this.data.activeCalls = [];
    const caller = this.getUserById(callerId);
    const receiver = this.getUserById(receiverId);

    // Clean up any stale active calls for these users
    this.data.activeCalls = this.data.activeCalls.filter(
      (c) =>
        !(
          (c.callerId === callerId && c.receiverId === receiverId) ||
          (c.callerId === receiverId && c.receiverId === callerId)
        ) || (c.status !== 'CALLING' && c.status !== 'CONNECTED')
    );

    const call: CallSession = {
      id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      callerId,
      callerName: caller?.name || 'Peer',
      callerAvatar: caller?.profileImage || '',
      receiverId,
      receiverName: receiver?.name || 'Peer',
      receiverAvatar: receiver?.profileImage || '',
      status: 'CALLING',
      startedAt: new Date().toISOString(),
    };

    this.data.activeCalls.push(call);

    // Also send a chat message alerting the peer of the call
    this.createMessage(
      callerId,
      receiverId,
      `📹 Started a 1-to-1 Video Call session`,
      'CALL_INVITE',
      {
        callId: call.id,
        status: 'RINGING',
      }
    );

    this.save();
    return call;
  }

  getCallSession(callId: string): CallSession | undefined {
    if (!this.data.activeCalls) this.data.activeCalls = [];
    return this.data.activeCalls.find((c) => c.id === callId);
  }

  updateCallStatus(callId: string, status: 'CONNECTED' | 'ENDED' | 'DECLINED'): CallSession | null {
    if (!this.data.activeCalls) this.data.activeCalls = [];
    const call = this.data.activeCalls.find((c) => c.id === callId);
    if (!call) return null;

    call.status = status;
    if (status === 'ENDED' || status === 'DECLINED') {
      call.endedAt = new Date().toISOString();
    }
    this.save();
    return call;
  }

  // Notifications
  getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationRead(id: string): boolean {
    const n = this.data.notifications.find(item => item.id === id);
    if (!n) return false;
    n.isRead = true;
    this.save();
    this.updateMongoDoc('notifications', { id }, { isRead: true });
    return true;
  }

  createNotification(userId: string, type: Notification['type'], message: string, link?: string): Notification {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      link
    };
    this.data.notifications.unshift(notif);
    this.save();
    this.persistDoc('notifications', notif);
    return notif;
  }

  // Reset to initial seed
  resetDatabase(): DatabaseSchema {
    this.data = getInitialSeedData();
    this.save();
    return this.data;
  }
}

export const db = new Database();
