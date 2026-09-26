🔄 SkillSwap — Peer-to-Peer Skill Exchange Platform
A modern full-stack web application that allows people to exchange skills without currency. Teach what you know, learn what you love! Built with a mutual compatibility matching engine, interactive chat, and integrated 1-to-1 live video calling.

✨ Features
🎯 Smart Mutual Matching Engine

Calculates compatibility scores based on mutual skill swaps (e.g., You teach UI/UX Design & want Java ⇄ Peer teaches Java & wants UI/UX).
Categorizes matches by mutual swaps, people who can teach you, or people seeking your skills.
📹 1-to-1 Live Video Calling

Launch live video sessions directly from private chat conversations.
Interactive call alerts, microphone toggle, camera toggle, flip camera, and session duration timers.
Real-time call status signaling (CALLING, CONNECTED, ENDED).
💬 Private Direct Messaging

Instant messaging between accepted connections.
Call invite preview cards embedded directly in the message stream.
🤝 Connection Management

Send, accept, or reject peer connection requests.
Tabbed overview for incoming pending requests, sent requests, and active connections.
🔍 Explore Skill Exchange Directory

Browse public skill exchange requests by topic, skill category, or delivery mode (Online, In-person, or Either).
Post your own customized learning & teaching exchange proposals.
👤 User Profiles & Skills Portfolio

Manage your bio, avatar, location, and teaching/learning skills catalog.
🛠️ Tech Stack
Frontend: React 19, TypeScript, Tailwind CSS, Lucide React Icons, Vite
Backend: Node.js, Express, REST API
Auth & Security: JWT (JSON Web Tokens), bcryptjs password hashing
Persistence: JSON-backed file database engine with auto-seeding
Real-Time & Media: WebRTC media streams, active call sessions, notification dispatchers
🚀 Getting Started
Prerequisites
Node.js (version 18 or higher recommended)
npm (bundled with Node.js)
Installation
Clone or download the repository:
git clone https://github.com/saikatpaul2820/skillswap-live.git
cd SkillSwap
