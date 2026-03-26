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

// ── Canucks Hockey Content ────────────────────────────

export async function seedCanucksContent() {
  const snap = await getDoc(doc(db, 'contentBlocks', 'canucks-1'))
  if (snap.exists()) return

  const canucksBlocks = [
    { id: 'canucks-1', title: 'The Expansion', order: 1, text: 'The Vancouver Canucks joined the National Hockey League in 1970 as an expansion team alongside the Buffalo Sabres. They have never won the Stanley Cup.' },
    { id: 'canucks-2', title: 'First Final', order: 2, text: 'In 1982 the Canucks reached the Stanley Cup Final for the first time. They were swept in four games by the New York Islanders. That run gave birth to towel power.' },
    { id: 'canucks-3', title: 'The Russian Rocket', order: 3, text: 'Pavel Bure arrived in 1991 and changed everything. Known as the Russian Rocket, he scored 60 goals in 1994 and carried the team deep into the playoffs.' },
    { id: 'canucks-4', title: 'Game 7 Heartbreak', order: 4, text: 'That spring the Canucks fought all the way to Game 7 of the Stanley Cup Final. They lost to the New York Rangers. Kirk McLean was brilliant in net throughout the run.' },
    { id: 'canucks-5', title: 'The Sedin Era', order: 5, text: 'The twin brothers Daniel and Henrik Sedin were drafted second and third overall in 1999. They played their entire careers in Vancouver and hold most of the franchise scoring records.' },
    { id: 'canucks-6', title: 'Presidents Trophy', order: 6, text: 'In 2011 the Canucks won the Presidents Trophy with 117 points. They reached the Final again but lost to the Boston Bruins in seven games. Game 7 ended 4 to 0.' },
    { id: 'canucks-7', title: 'The Long Wait', order: 7, text: 'Three trips to the Final. Three losses. No parades. The Canucks remain one of the longest suffering franchises in professional hockey. The Cup has never come to Vancouver.' },
    { id: 'canucks-8', title: 'Towel Power', order: 8, text: 'Through all of it the fans keep showing up. They wave their white towels and believe that one day the Stanley Cup will finally come home to British Columbia.' },
  ]

  const batch = writeBatch(db)
  canucksBlocks.forEach(b => {
    b.category = 'Story'
    b.series = 'Hockey: Canucks History'
    b.wordCount = b.text.split(/\s+/).length
    b.createdAt = Date.now()
    batch.set(doc(db, 'contentBlocks', b.id), b)
  })
  await batch.commit()
}

// ── Keyboard Basics Content ───────────────────────────

export async function seedKeyboardBasicsContent() {
  const snap = await getDoc(doc(db, 'contentBlocks', 'kb-1.01'))
  if (snap.exists()) return

  const HR = ['a','s','d','f','g','h','j','k','l',';']
  const TR = ['q','w','e','r','t','y','u','i','o','p']
  const BR = ['z','x','c','v','b','n','m',',','.','/']

  const kbBlocks = [
    // Phase 1: Home Row
    { id: 'kb-1.01', title: 'Home Position: J and F', phase: 1, phaseTitle: 'Home Row', order: 1, keysIntroduced: ['f','j'], allActiveKeys: ['f','j',' '], unlockRequirement: null, passAccuracy: 90, masteryWpm: 10, text: 'jjj fff jjj fff jf jf jf fj fj fj jjf fjj jff ffj jf jf fj fj jfj fjf jfj fjf jf fj jf fj fj jf jfj fff jjj fjf jfj ffjj jjff fjfj jfjf fj jf fj jf fjf' },
    { id: 'kb-1.02', title: 'Right Hand: J and K', phase: 1, phaseTitle: 'Home Row', order: 2, keysIntroduced: ['k'], allActiveKeys: ['f','j','k',' '], unlockRequirement: 'kb-1.01', passAccuracy: 90, masteryWpm: 10, text: 'jjj kkk jjj kkk jk jk jk kj kj kj jkj kjk jkj kjk jjk kkj jkk kjj jk kj jk kj kjk jkj kjk jkj jk kj fjk fkj jfk kfj fj fk jf kf fjk fkj jfk kfj fk jk' },
    { id: 'kb-1.03', title: 'Left Hand: F and D', phase: 1, phaseTitle: 'Home Row', order: 3, keysIntroduced: ['d'], allActiveKeys: ['f','j','k','d',' '], unlockRequirement: 'kb-1.02', passAccuracy: 90, masteryWpm: 10, text: 'fff ddd fff ddd fd fd fd df df df fdf dfd fdf dfd ffd ddf fdd dff fd df fd df dfd fdf dfd fdf fd df fdf dfd fjd fkd djf dkf fd jk dk fj fd kj fdk djk fjd dkf jdk' },
    { id: 'kb-1.04', title: 'Outer Right: L and ;', phase: 1, phaseTitle: 'Home Row', order: 4, keysIntroduced: ['l',';'], allActiveKeys: ['f','j','k','d','l',';',' '], unlockRequirement: 'kb-1.03', passAccuracy: 90, masteryWpm: 10, text: 'lll ;;; lll ;;; l; l; ;l ;l l;l ;l; l;l ;l; ll; ;;l jkl; ;lkj jl kl j; k; lj lk ;j ;k jkl; ;lkj l; ;l fjl fkl djl dkl fl dl jl kl lf ld lj lk fl; dk; jl;' },
    { id: 'kb-1.05', title: 'Outer Left: S and A', phase: 1, phaseTitle: 'Home Row', order: 5, keysIntroduced: ['s','a'], allActiveKeys: ['a','s','d','f','j','k','l',';',' '], unlockRequirement: 'kb-1.04', passAccuracy: 90, masteryWpm: 10, text: 'sss aaa sss aaa sa sa as as sas asa sas asa ssa aas fds asd fda saf ads sad fas daf asdf fdsa asdf fdsa a dad a fad a lad a lass a lash sad dad fad' },
    { id: 'kb-1.06', title: 'Home Row Complete: G and H', phase: 1, phaseTitle: 'Home Row', order: 6, keysIntroduced: ['g','h'], allActiveKeys: [...HR,' '], unlockRequirement: 'kb-1.05', passAccuracy: 90, masteryWpm: 10, text: 'ggg hhh ggg hhh gh gh hg hg ghg hgh ghg hgh ggh hhg fgf jhj fgf jhj fg jh gf hj fgh jhg fgj jhf ghj hgf had has ash dash gash lash hash shag glad flag glass' },
    { id: 'kb-1.07', title: 'Home Row Words', phase: 1, phaseTitle: 'Home Row', order: 7, keysIntroduced: [], allActiveKeys: [...HR,' '], unlockRequirement: 'kb-1.06', passAccuracy: 90, masteryWpm: 12, text: 'a ad ah as add ads all ash ask dad fad gag gal gas had has jag lag lad sad sag add all ask ash dad fad lash gash dash hash glad flag fall hall flask shall salad glass slash flash flags dads lads gals flash a glad lad had a salad a sad lass shall dash a flag all lads had flash flags dad shall add a glass half' },

    // Phase 2: Top Row
    { id: 'kb-2.01', title: 'Top Index: R and U', phase: 2, phaseTitle: 'Top Row', order: 1, keysIntroduced: ['r','u'], allActiveKeys: [...HR,'r','u',' '], unlockRequirement: 'kb-1.07', passAccuracy: 90, masteryWpm: 12, text: 'rrr uuu rrr uuu ru ru ur ur rur uru rur uru rru uur frf juj frf juj fr ju rf uj fru jur ruf ujf frf juj fur rug ruf dusk rush gush husk dug jug full hull a fur rug a full jar a rush' },
    { id: 'kb-2.02', title: 'Top Index Stretch: T and Y', phase: 2, phaseTitle: 'Top Row', order: 2, keysIntroduced: ['t','y'], allActiveKeys: [...HR,'r','u','t','y',' '], unlockRequirement: 'kb-2.01', passAccuracy: 90, masteryWpm: 12, text: 'ttt yyy ttt yyy ty ty yt yt tyt yty tyt yty tty yyt ftf jyj ftf jyj ft jy tf yj frt jyu trf yuj tyt yty that stay dusty rusty gusty hasty yards dusty lusty talk salt fast last task star start drag trust staff' },
    { id: 'kb-2.03', title: 'Top Middle: E and I', phase: 2, phaseTitle: 'Top Row', order: 3, keysIntroduced: ['e','i'], allActiveKeys: [...HR,'r','u','t','y','e','i',' '], unlockRequirement: 'kb-2.02', passAccuracy: 90, masteryWpm: 12, text: 'eee iii eee iii ei ei ie ie eie iei eie iei eei iie ded kik ded kik de ki ed ik dei kie eid ike ded kik the tide side life like fire hire ride this kiss sit like site risk tied dies kite fish diet disk silk rig dear kiss hike tide safe sake tile disk fire rise its he did this the kite is his she likes dried fish it is' },
    { id: 'kb-2.04', title: 'Top Ring: W and O', phase: 2, phaseTitle: 'Top Row', order: 4, keysIntroduced: ['w','o'], allActiveKeys: [...HR,'r','u','t','y','e','i','w','o',' '], unlockRequirement: 'kb-2.03', passAccuracy: 90, masteryWpm: 12, text: 'www ooo www ooo wo wo ow ow wow owo wow owo wwo oow sws lol sws lol sw lo ws ol swo low wos ols sws lol word work show flow two good look stood wood foot too she would go to work she took good flowers she wrote those words look right do this work for so low a fee' },
    { id: 'kb-2.05', title: 'Top Pinky: Q and P', phase: 2, phaseTitle: 'Top Row', order: 5, keysIntroduced: ['q','p'], allActiveKeys: [...HR,...TR,' '], unlockRequirement: 'kb-2.04', passAccuracy: 90, masteryWpm: 12, text: 'qqq ppp qqq ppp qp qp pq pq qpq pqp qpq pqp qqp ppq aqa ;p; aqa ;p; aq ;p qa p; aqp ;pq qpa p;a aqa ;p; quip quote equip put tip top stop skip drop sip the proper purpose of our trip was to skip past square quiet quest proof adopt press operate strip plot' },
    { id: 'kb-2.06', title: 'Top Row + Home Row Words', phase: 2, phaseTitle: 'Top Row', order: 6, keysIntroduced: [], allActiveKeys: [...HR,...TR,' '], unlockRequirement: 'kb-2.05', passAccuracy: 90, masteryWpm: 15, text: 'quite large ideas would flow freely through the wire the quick wolf leapt right off their old study desk our guide typed his true quotes outside proper style words require regular faithful effort to type faster three wise soldiers fought through your little squad' },

    // Phase 3: Bottom Row
    { id: 'kb-3.01', title: 'Bottom Index: V and N', phase: 3, phaseTitle: 'Bottom Row', order: 1, keysIntroduced: ['v','n'], allActiveKeys: [...HR,...TR,'v','n',' '], unlockRequirement: 'kb-2.06', passAccuracy: 90, masteryWpm: 12, text: 'vvv nnn vvv nnn vn vn nv nv vnv nvn vnv nvn vvn nnv fvf jnj fvf jnj fv jn vf nj fvn jnv vnf nvj fvf jnj vine even never given seven driven haven invest inner driven innovation involves venture given seven events' },
    { id: 'kb-3.02', title: 'Bottom Index Stretch: B', phase: 3, phaseTitle: 'Bottom Row', order: 2, keysIntroduced: ['b'], allActiveKeys: [...HR,...TR,'v','n','b',' '], unlockRequirement: 'kb-3.01', passAccuracy: 90, masteryWpm: 12, text: 'bbb bbb bbb fbf fbf fbf bf fb bf fb bfb fbf bfb fbf big bit bin but both been begin better above observe above the bent river banks brown birds begin to sing bright observations build better habits over the web' },
    { id: 'kb-3.03', title: 'Bottom Middle: C and M', phase: 3, phaseTitle: 'Bottom Row', order: 3, keysIntroduced: ['c','m'], allActiveKeys: [...HR,...TR,'v','n','b','c','m',' '], unlockRequirement: 'kb-3.02', passAccuracy: 90, masteryWpm: 12, text: 'ccc mmm ccc mmm cm cm mc mc cmc mcm cmc mcm ccm mmc dcd kmk dcd kmk dc km cd mk dcm kmc cmd mkd dcd kmk come much mind each become machine common claim micro the common custom becomes much more convenient in time' },
    { id: 'kb-3.04', title: 'Bottom Row Complete', phase: 3, phaseTitle: 'Bottom Row', order: 4, keysIntroduced: ['x','z',',','.','/'], allActiveKeys: [...HR,...TR,...BR,' '], unlockRequirement: 'kb-3.03', passAccuracy: 90, masteryWpm: 12, text: 'xxx zzz xxx zzz xz xz zx zx ,,, ... ,,, ... ,., .,. sxs aza sxs aza sx az xs za l,l k.k l,l k.k ;/; ;/; fix six box mix zone zero frozen maximize exact seize he fixed six broken boxes. the frozen zone was exact. maximize your zone. fix, mix, seize the extra prizes.' },
    { id: 'kb-3.05', title: 'Bottom + Home Words', phase: 3, phaseTitle: 'Bottom Row', order: 5, keysIntroduced: [], allActiveKeys: [...HR,...TR,...BR,' '], unlockRequirement: 'kb-3.04', passAccuracy: 90, masteryWpm: 12, text: 'black van, calm man, vast land, small black cabinet. zinc flax, clam bask, blank canvas, mangle and cash.' },
    { id: 'kb-3.06', title: 'All Three Rows', phase: 3, phaseTitle: 'Bottom Row', order: 6, keysIntroduced: [], allActiveKeys: [...HR,...TR,...BR,' '], unlockRequirement: 'kb-3.05', passAccuracy: 90, masteryWpm: 15, text: 'a complex problem requires a calm and exact response. maximize every chance. visualize the bronze fixtures. the brave explorer conquered six frozen mountain zones. my excellent friend recognized the broken valve. jumping quickly over fences, the fox was gone by dawn.' },

    // Phase 4: Putting It All Together
    { id: 'kb-4.01', title: 'All Letters Review', phase: 4, phaseTitle: 'All Together', order: 1, keysIntroduced: [], allActiveKeys: null, unlockRequirement: 'kb-3.06', passAccuracy: 90, masteryWpm: 15, text: 'the five boxing wizards jump quickly over the fence. pack my box with five dozen large jugs of old whisky. the quick brown fox jumps over the lazy sleeping dog. how vexingly quick daft zebras jump over the low box. a large fawn jumped quickly over white zinc boxes now.' },
    { id: 'kb-4.02', title: 'Common Words Speed', phase: 4, phaseTitle: 'All Together', order: 2, keysIntroduced: [], allActiveKeys: null, unlockRequirement: 'kb-4.01', passAccuracy: 90, masteryWpm: 15, text: 'the of and to a in is it you that he was for on are with as his they be at one have this from or had by but not what all were when we there can an your which their said if do will each about how up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us' },
    { id: 'kb-4.03', title: 'Sentences and Flow', phase: 4, phaseTitle: 'All Together', order: 3, keysIntroduced: [], allActiveKeys: null, unlockRequirement: 'kb-4.02', passAccuracy: 90, masteryWpm: 15, text: 'She walked to the store and found the last jar on the shelf. His dog ran through the field and jumped over the old stone wall. We should find a quiet place to sit and read for a while. The children played outside until the sun went down behind the hill. I think the best part of the day is right after the rain stops.' },
    { id: 'kb-4.04', title: 'Capitals Practice', phase: 4, phaseTitle: 'All Together', order: 4, keysIntroduced: [], allActiveKeys: null, unlockRequirement: 'kb-4.03', passAccuracy: 90, masteryWpm: 15, text: 'Adam Ben Carl David Ed Frank George Henry Isaac Jack Kate Lisa Mary Nancy Olivia Paul Quinn Rose Sam Tina Toronto Vancouver Montreal Ottawa Calgary Edmonton Halifax God is good. Jesus Christ is Lord. The Lord is faithful. The United States and Canada share the longest border.' },
    { id: 'kb-4.05', title: 'Numbers Row', phase: 4, phaseTitle: 'All Together', order: 5, keysIntroduced: ['1','2','3','4','5','6','7','8','9','0'], allActiveKeys: null, unlockRequirement: 'kb-4.04', passAccuracy: 90, masteryWpm: 12, text: '111 222 333 444 555 666 777 888 999 000 123 456 789 012 345 678 901 234 567 890 There are 12 eggs in a dozen and 52 weeks in a year. He drove 340 miles in about 5 hours and 20 minutes. The score was 108 to 97 with 3 minutes and 14 seconds left. Genesis 1:1 Psalm 23:1 John 3:16 Romans 8:28 Isaiah 40:31' },
    { id: 'kb-4.06', title: 'Common Punctuation', phase: 4, phaseTitle: 'All Together', order: 6, keysIntroduced: [], allActiveKeys: null, unlockRequirement: 'kb-4.05', passAccuracy: 90, masteryWpm: 12, text: 'Yes, I would like that. No, I don\'t think so. Really? "Hello," she said. "How are you doing today?" It\'s a beautiful day; the sun is shining brightly. He asked, "What time is it?" She replied, "It\'s noon." Wait -- did you hear that? Yes! I heard it clearly. The dog (a golden retriever) ran across the yard.' },
  ]

  const batch = writeBatch(db)
  kbBlocks.forEach(b => {
    b.category = 'Keyboard Basics'
    b.wordCount = b.text.split(/\s+/).length
    b.createdAt = Date.now()
    batch.set(doc(db, 'contentBlocks', b.id), b)
  })
  await batch.commit()
}

// ── Content Migration ─────────────────────────────────
// Migrates existing content to new category structure (idempotent)

export async function migrateContent() {
  const snap = await getDocs(collection(db, 'contentBlocks'))
  const blocks = snap.docs.map(d => d.data())
  const batch = writeBatch(db)
  let changed = false

  blocks.forEach(b => {
    const ref = doc(db, 'contentBlocks', b.id)
    const updates = {}

    // Recategorize old Fundamentals → General Practice
    if (b.category === 'Fundamentals') {
      updates.category = 'General Practice'
    }

    // Recategorize Challenge → General Practice
    if (b.category === 'Challenge') {
      updates.category = 'General Practice'
    }

    // Add series to Hobbit blocks
    if (b.id.startsWith('hobbit-') && !b.series) {
      updates.series = 'The Hobbit: Chapter I'
    }

    if (Object.keys(updates).length > 0) {
      batch.set(ref, { ...b, ...updates })
      changed = true
    }
  })

  if (changed) await batch.commit()
}

// ── Best Accuracy Helper ──────────────────────────────

export async function getBestAccuracy(userId) {
  const sessions = await getSessions(userId)
  const best = {}
  sessions.forEach(s => {
    if (s.contentBlockId && s.accuracy > 0) {
      if (!best[s.contentBlockId] || s.accuracy > best[s.contentBlockId]) {
        best[s.contentBlockId] = s.accuracy
      }
    }
  })
  return best
}
