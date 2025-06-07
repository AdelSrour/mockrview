# MockrView

**MockrView** is a mock interview platform that connects you with random strangers for real-time interview practice — no sign-in or registration required. Simply select your role and interview tags, then get matched instantly for live interview sessions.

---

## Features

- **No Sign-In Needed:** Just pick your role and tags, and start practicing right away.
- **Random Matchmaking:** Connect with random users ready for mock interviews.
- **Role Selection:** Choose to be the interviewer or the interviewee.
- **Tag Selection:** Select interview topics or skills to customize your session.
- **Real-Time Communication:** Powered by WebRTC for seamless video/audio interaction.
- **Anonymous & Secure:** No personal data stored — practice privately.
- **Backend Support:** Firebase handles signaling and user state; Node.js manages matchmaking.

---

## How It Works

1. **Select Role & Tags:** Choose your interview role and relevant topics.
2. **Matchmaking:** Node.js backend pairs you with a suitable random partner.
3. **WebRTC Session:** Establishes a direct peer-to-peer audio/video connection for your mock interview.
4. **Interview Practice:** Conduct your real-time session.
5. **Repeat or Exit:** End session or start a new one with a different partner.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- Angular CLI (`npm install -g @angular/cli`)

### Setup & Run Locally

```bash
git clone https://github.com/AdelSrour/mockrview.git
cd mockrview
npm install
ng serve
```

## Technologies Used

- **Frontend:** Angular
- **Real-Time Communication:** WebRTC
- **Backend:** Node.js (matchmaking server)
- **Signaling & State:** Firebase

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License.

---

## Contact

For questions or suggestions, contact contact@adel.dev.
