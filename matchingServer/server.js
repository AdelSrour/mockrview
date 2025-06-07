/**
 * This is matching script must run on the cloud to match users
 */
const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  onValue,
} = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyBMDhVP5KLjW6WUIYNiW77y7nEkEDiV2Co",
  authDomain: "mockrview.firebaseapp.com",
  databaseURL:
    "https://mockrview-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mockrview",
  storageBucket: "mockrview.firebasestorage.app",
  messagingSenderId: "417992497103",
  appId: "1:417992497103:web:e9909044cb8e7cba41a4ba",
  measurementId: "G-BRCQJ56CG1",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function getWaitingUsersByRole(role) {
  const waitingUsersRef = ref(db, "waitingUsers");
  const q = query(waitingUsersRef, orderByChild("role"), equalTo(role));
  const snapshot = await get(q);

  const users = [];
  snapshot.forEach((childSnap) => {
    const user = childSnap.val();
    user.id = childSnap.key;

    if (!user.matched && user.online) {
      users.push(user);
    }
  });

  return users;
}

async function createMatch(interviewer, interviewee) {
  const sessionId =
    Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
  const updates = {};

  updates[`waitingUsers/${interviewer.id}/matched`] = true;
  updates[`waitingUsers/${interviewer.id}/matchedWith`] = interviewee.userId;
  updates[`waitingUsers/${interviewer.id}/sessionId`] = sessionId;
  updates[`waitingUsers/${interviewer.id}/online`] = false;

  updates[`waitingUsers/${interviewee.id}/matched`] = true;
  updates[`waitingUsers/${interviewee.id}/matchedWith`] = interviewer.userId;
  updates[`waitingUsers/${interviewee.id}/sessionId`] = sessionId;
  updates[`waitingUsers/${interviewee.id}/online`] = false;

  await update(ref(db), updates);
}

async function findMatches() {
  const interviewers = await getWaitingUsersByRole("interviewer");
  const interviewees = await getWaitingUsersByRole("interviewee");

  const matchedIntervieweeIds = new Set();

  for (const interviewer of interviewers) {
    for (const interviewee of interviewees) {
      if (matchedIntervieweeIds.has(interviewee.id)) continue;

      const commonTags = interviewer.tags.filter((tag) =>
        interviewee.tags.includes(tag)
      );
      if (commonTags.length > 0) {
        await createMatch(interviewer, interviewee);
        matchedIntervieweeIds.add(interviewee.id);
        break;
      }
    }
  }
}

const waitingUsersRef = ref(db, "waitingUsers");

onValue(waitingUsersRef, async (snapshot) => {
  const users = snapshot.val();
  if (!users) return;

  const unmatchedOnlineUsers = Object.values(users).filter(
    (u) => !u.matched && u.online
  );

  if (unmatchedOnlineUsers.length > 0) {
    await findMatches();
  }
});
