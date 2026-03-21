// Firestore-backed storage for cross-device persistence.
// All functions are async and return Promises.

import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
} from './firebase'

// ── Users ──────────────────────────────────────────────

export async function getUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => d.data())
}

export async function getUser(id) {
  const snap = await getDoc(doc(db, 'users', id))
  return snap.exists() ? snap.data() : null
}

export async function saveUser(user) {
  await setDoc(doc(db, 'users', user.id), user)
  return user
}

export async function deleteUser(id) {
  // Delete subcollections first
  const sessionSnap = await getDocs(collection(db, 'users', id, 'sessions'))
  const progressSnap = await getDocs(collection(db, 'users', id, 'progress'))
  const batch = writeBatch(db)
  sessionSnap.docs.forEach(d => batch.delete(d.ref))
  progressSnap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(doc(db, 'users', id))
  await batch.commit()
}

// ── Sessions ───────────────────────────────────────────

export async function getSessions(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'sessions'))
  return snap.docs.map(d => d.data())
}

export async function saveSession(userId, session) {
  await addDoc(collection(db, 'users', userId, 'sessions'), session)
  return session
}

// Get best WPM per content block for a user
export async function getBestWpm(userId) {
  const sessions = await getSessions(userId)
  const best = {}
  sessions.forEach(s => {
    if (s.contentBlockId && s.wpm > 0) {
      if (!best[s.contentBlockId] || s.wpm > best[s.contentBlockId]) {
        best[s.contentBlockId] = s.wpm
      }
    }
  })
  return best
}

// ── Progress ───────────────────────────────────────────

export async function getProgress(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'progress'))
  const progress = {}
  snap.docs.forEach(d => {
    progress[d.id] = d.data()
  })
  return progress
}

export async function saveProgress(userId, contentBlockId, lastWordIndex) {
  await setDoc(doc(db, 'users', userId, 'progress', contentBlockId), {
    lastWordIndex,
    updatedAt: Date.now(),
  })
}

// ── Content Blocks ─────────────────────────────────────

export async function getContentBlocks() {
  const snap = await getDocs(collection(db, 'contentBlocks'))
  return snap.docs.map(d => d.data()).filter(b => b.category !== 'Bible')
}

export async function getContentBlock(id) {
  const snap = await getDoc(doc(db, 'contentBlocks', id))
  return snap.exists() ? snap.data() : null
}

export async function saveContentBlock(block) {
  await setDoc(doc(db, 'contentBlocks', block.id), block)
  return block
}

export async function deleteContentBlock(id) {
  await deleteDoc(doc(db, 'contentBlocks', id))
}

// ── Settings ───────────────────────────────────────────

export async function getSettings() {
  const snap = await getDoc(doc(db, 'config', 'settings'))
  return snap.exists()
    ? snap.data()
    : { adminPin: '1234', dailyGoalMinutes: 10, dailyGoalSessions: 3 }
}

export async function saveSettings(settings) {
  await setDoc(doc(db, 'config', 'settings'), settings)
}

// ── Starter Content ────────────────────────────────────

export async function seedStarterContent() {
  const snap = await getDocs(collection(db, 'contentBlocks'))
  if (!snap.empty) return // Already has content

  const starterBlocks = [
    {
      id: 'starter-homerow',
      title: 'Home Row Basics',
      category: 'Fundamentals',
      text: 'asdf jkl; asdf jkl; fjdk slal fads jklf dask fljk asdf jkl; fjdk sla; alsk djfk sala fdjk asdf jkl; a sad lad asks a lass dad falls alas a flask',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'starter-toprow',
      title: 'Top Row Practice',
      category: 'Fundamentals',
      text: 'the quick red fox we were quite right your true type write quiet quest tower power route outer quote require pretty write poetry truth quality worthy equity',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'starter-bottomrow',
      title: 'Bottom Row Practice',
      category: 'Fundamentals',
      text: 'box van zen cab mix come back zone next move vim can buzz exam zinc vex ban calm mock verb nova cozy brave move boxing given Mexico vibrant',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'starter-common',
      title: 'Common English Words',
      category: 'Fundamentals',
      text: 'the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'starter-pangrams',
      title: 'Pangram Collection',
      category: 'Challenge',
      text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly. Amazingly few discotheques provide jukeboxes. Crazy Frederick bought many very exquisite opal jewels.',
      wordCount: 0,
      createdAt: Date.now(),
    },
  ]

  const batch = writeBatch(db)
  starterBlocks.forEach(b => {
    b.wordCount = b.text.split(/\s+/).length
    batch.set(doc(db, 'contentBlocks', b.id), b)
  })
  await batch.commit()
}

// ── Hobbit Story Content ──────────────────────────────

export async function seedHobbitContent() {
  const snap = await getDoc(doc(db, 'contentBlocks', 'hobbit-1'))
  if (snap.exists()) return // Already seeded

  const hobbitBlocks = [
    {
      id: 'hobbit-1',
      title: 'The Hobbit-Hole',
      category: 'Story',
      text: 'In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort. It had a perfectly round door like a porthole, painted green, with a shiny yellow brass knob in the exact middle. The door opened on to a tube-shaped hall like a tunnel: a very comfortable tunnel without smoke, with paneled walls, and floors tiled and carpeted, provided with polished chairs, and lots and lots of pegs for hats and coats -- the hobbit was fond of visitors. The tunnel wound on and on, going fairly but not quite straight into the side of the hill -- The Hill, as all the people for many miles round called it -- and many little round doors opened out of it, first on one side and then on another. No going upstairs for the hobbit: bedrooms, bathrooms, cellars, pantries, wardrobes, kitchens, dining rooms, all were on the same floor, and indeed on the same passage. The best rooms were all on the left-hand side, for these were the only ones to have windows, deep-set round windows looking over his garden and meadows beyond, sloping down to the river.',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-2',
      title: 'The Baggins Family',
      category: 'Story',
      text: 'This hobbit was a very well-to-do hobbit, and his name was Baggins. The Bagginses had lived in the neighbourhood of The Hill for time out of mind, and people considered them very respectable, not only because most of them were rich, but also because they never had any adventures or did anything unexpected: you could tell what a Baggins would say on any question without the bother of asking him. This is a story of how a Baggins had an adventure, found himself doing and saying things altogether unexpected. He may have lost the neighbours\' respect, but he gained -- well, you will see whether he gained anything in the end. The mother of our particular hobbit -- what is a hobbit? I suppose hobbits need some description nowadays, since they have become rare and shy of the Big People, as they call us. They are a little people, about half our height, and smaller than the bearded Dwarves. Hobbits have no beards. There is little or no magic about them, except the ordinary everyday sort which helps them to disappear quietly and quickly when large stupid folk like you and me come blundering along, making a noise like elephants which they can hear a mile off. They are inclined to be fat in the stomach; they dress in bright colours; wear no shoes, because their feet grow natural leathery soles and thick warm brown hair like the stuff on their heads; have long clever brown fingers, good-natured faces, and laugh deep fruity laughs.',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-3',
      title: 'Gandalf Arrives',
      category: 'Story',
      text: 'By some curious chance one morning long ago in the quiet of the world, when there was less noise and more green, and the hobbits were still numerous and prosperous, and Bilbo Baggins was standing at his door after breakfast smoking an enormous long wooden pipe that reached nearly down to his woolly toes -- Gandalf came by. Gandalf! If you had heard only a quarter of what I have heard about him, and I have only heard very little of all there is to hear, you would be prepared for any sort of remarkable tale. Tales and adventures sprouted up all over the place wherever he went, in the most extraordinary fashion. All that the unsuspecting Bilbo saw that morning was an old man with a staff. He had a tall pointed blue hat, a long grey cloak, a silver scarf over which a white beard hung down below his waist, and immense black boots. "Good morning!" said Bilbo, and he meant it. The sun was shining, and the grass was very green. But Gandalf looked at him from under long bushy eyebrows that stuck out further than the brim of his shady hat. "What do you mean?" he said. "Do you wish me a good morning, or mean that it is a good morning whether I want not; or that you feel good this morning; or that it is morning to be good on?" "All of them at once," said Bilbo. "And a very fine morning for a pipe of tobacco out of doors, into the bargain."',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-4',
      title: 'An Unexpected Invitation',
      category: 'Story',
      text: '"Very pretty!" said Gandalf. "But I have no time to blow smoke-rings this morning. I am looking for someone to share in an adventure that I am arranging, and it\'s very difficult to find anyone." "I should think so -- in these parts! We are plain quiet folk and have no use for adventures. Nasty disturbing uncomfortable things! Make you late for dinner! I can\'t think what anybody sees in them," said our Mr. Baggins, and stuck one thumb behind his braces, and blew out another even bigger smoke-ring. Then he took out his morning letters, and began to read, pretending to take no more notice of the old man. He had decided that he was not quite his sort, and wanted him to go away. But the old man did not move. He stood leaning on his stick and gazing at the hobbit without saying anything, till Bilbo got quite uncomfortable and even a little cross. "Good morning!" he said at last. "We don\'t want any adventures here, thank you! You might try over The Hill or across The Water." "What a lot of things you do use Good morning for!" said Gandalf. "Now you mean that you want to get rid of me, and that it won\'t be good till I move off." "Not at all, not at all, my dear sir! Let me see, I don\'t think I know your name?" "Yes, yes, my dear sir -- and I do know your name, Mr. Bilbo Baggins. And you do know my name, though you don\'t remember that I belong to it. I am Gandalf, and Gandalf means me!"',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-5',
      title: 'Uninvited Guests',
      category: 'Story',
      text: 'The next day he had almost forgotten about Gandalf. He did not remember things very well, unless he put them down on his Engagement Tablet: like this: Gandalf Tea Wednesday. Just before tea-time there came a tremendous ring on the front-door bell, and then he remembered! He rushed and put on the kettle, and put out another cup and saucer and an extra cake or two, and ran to the door. "I am so sorry to keep you waiting!" he was going to say, when he saw that it was not Gandalf at all. It was a dwarf with a blue beard tucked into a golden belt, and very bright eyes under his dark-green hood. As soon as the door was opened, he pushed inside, just as if he had been expected. He hung his hooded cloak on the nearest peg, and "Dwalin at your service!" he said with a low bow. "Bilbo Baggins at yours!" said the hobbit, too surprised to ask any questions for the moment. They had not been at table long, in fact they had hardly reached the third cake, when there came another even louder ring at the bell. "Excuse me!" said the hobbit, and off he went to the door. It was not Gandalf. Instead there was a very old-looking dwarf on the step with a white beard and a scarlet hood; and he too hopped inside as soon as the door was open, just as if he had been invited. "Balin at your service!" he said with his hand on his breast.',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-6',
      title: 'The Unexpected Party',
      category: 'Story',
      text: 'Bilbo rushed along the passage, very angry, and altogether bewildered -- this was the most awkward Wednesday he ever remembered. He pulled open the door with a jerk, and they all fell in, one on top of the other. More dwarves, four more! And there was Gandalf behind, leaning on his staff and laughing. "Carefully! Carefully!" he said. "It is not like you, Bilbo, to keep friends waiting on the mat, and then open the door like a pop-gun! Let me introduce Bifur, Bofur, Bombur, and especially Thorin!" "Now we are all here!" said Gandalf, looking at the row of thirteen hoods and his own hat hanging on the pegs. "Quite a merry gathering!" Thereupon the twelve dwarves -- not Thorin, he was too important, and stayed talking to Gandalf -- jumped to their feet and made tall piles of all the things. Off they went, not waiting for trays, balancing columns of plates, each with a bottle on the top, with one hand, while the hobbit ran after them almost squeaking with fright: "please be careful!" and "please, don\'t trouble! I can manage." But the dwarves only started to sing: Chip the glasses and crack the plates! Blunt the knives and bend the forks! That\'s what Bilbo Baggins hates! So, carefully! carefully with the plates! And of course they did none of these dreadful things, and everything was cleaned and put away safe as quick as lightning.',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-7',
      title: 'Far Over the Misty Mountains',
      category: 'Story',
      text: 'The dark filled all the room, and the fire died down, and the shadows were lost, and still they played on. And suddenly first one and then another began to sing as they played, deep-throated singing of the dwarves in the deep places of their ancient homes. Far over the misty mountains cold, to dungeons deep and caverns old, we must away ere break of day, to seek the pale enchanted gold. The dwarves of yore made mighty spells, while hammers fell like ringing bells, in places deep where dark things sleep, in hollow halls beneath the fells. For ancient king and elvish lord, there many a gloaming golden hoard they shaped and wrought, and light they caught to hide in gems on hilt of sword. As they sang the hobbit felt the love of beautiful things made by hands and by cunning and by magic moving through him, a fierce and jealous love, the desire of the hearts of dwarves. Then something Tookish woke up inside him, and he wished to go and see the great mountains, and hear the pine-trees and the waterfalls, and explore the caves, and wear a sword instead of a walking-stick. He looked out of the window. The stars were out in a dark sky above the trees. He shuddered; and very quickly he was plain Mr. Baggins of Bag-End, Under-Hill, again.',
      wordCount: 0,
      createdAt: Date.now(),
    },
    {
      id: 'hobbit-8',
      title: 'Thorin\'s Tale',
      category: 'Story',
      text: '"We are met to discuss our plans, our ways, means, policy and devices. We shall soon before the break of day start on our long journey, a journey from which some of us, or perhaps all of us may never return. It is a solemn moment." This was Thorin\'s style. He was an important dwarf. "Long ago in my grandfather Thror\'s time our family was driven out of the far North, and came back with all their wealth and their tools to this Mountain on the map. They mined and they tunnelled and they made huger halls and greater workshops. Anyway they grew immensely rich and famous, and my grandfather was King under the Mountain again. They built the merry town of Dale there in those days. Altogether those were good days for us. There was a most specially greedy, strong and wicked worm called Smaug. One day he flew up into the air and came south. Then he came down the slopes and when he reached the woods they all went up in fire. He went back and crept in through the Front Gate and routed out all the halls, and lanes, and tunnels. After that there were no dwarves left alive inside, and he took all their wealth for himself. We still mean to get it back, and to bring our curses home to Smaug -- if we can." Bilbo went to sleep with that in his ears, and it gave him very uncomfortable dreams.',
      wordCount: 0,
      createdAt: Date.now(),
    },
  ]

  const batch = writeBatch(db)
  hobbitBlocks.forEach(b => {
    b.wordCount = b.text.split(/\s+/).length
    batch.set(doc(db, 'contentBlocks', b.id), b)
  })
  await batch.commit()
}
