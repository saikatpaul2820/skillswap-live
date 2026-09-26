# SkillSwap 🚀

SkillSwap is a full-stack, real-time peer-to-peer skill exchange platform. Connect with developers, designers, language learners, and mentors worldwide to trade knowledge through high-definition WebRTC video calls, live messaging, and interactive session scheduling.

![SkillSwap Platform](https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🎥 **Real-time WebRTC 1-on-1 Video & Audio**: HD video calling with multi-peer mesh signaling, screen sharing, camera/mic toggling, and in-call text chat.
- 💬 **Instant Direct Messaging**: Real-time WebSocket messaging with instant typing indicators, unread notification counts, and message history.
- 🤝 **Skill Exchange Marketplace**: Browse offered skills and requested skills, search by tags, proficiency levels, and location.
- 📅 **Session Booking & Swap Proposals**: Propose skill swaps, accept/decline offers, and schedule calendar appointments.
- ⭐ **Reviews & Rating System**: Rate past swap partners and build a credible community profile.
- 🌐 **Persistent Cloud Database**: MongoDB Atlas integration with automatic fallback to JSON file persistence for local development.
- 🔐 **Secure Authentication**: JWT token authentication with bcrypt password hashing and user profiles.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Vite
- **Backend**: Node.js, Express, WebSocket (`ws`)
- **Real-time**: WebRTC, STUN/TURN ICE signaling
- **Database**: MongoDB Atlas (`mongodb` driver) with local JSON storage fallback
- **Deployment**: Render Web Service, Docker ready

---

## 🚀 Quick Start (Local Development)

### 1. Clone or Download the repository
```bash
[git clone https://github.com/saikatpaul2820/skillswap-live.git
cd skillswap-live](https://github.com/saikatpaul2820/skillswap-live)
